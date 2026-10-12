"""Check a running development stack; recreate containers without deleting volumes."""

import json
import subprocess
import sys
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PHP_BOOT = (
    "require '/app/vendor/autoload.php'; "
    "$app = require '/app/bootstrap/app.php'; "
    "$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); "
)


def compose(*args, timeout=90):
    result = subprocess.run(
        ["docker", "compose", *args], cwd=ROOT, text=True,
        capture_output=True, timeout=timeout,
    )
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout


def php(code):
    return compose("exec", "-T", "backend", "php", "-r", PHP_BOOT + code)


def http(url, method="GET", data=None, headers=None):
    request = Request(
        url, method=method, headers=headers or {},
        data=json.dumps(data).encode() if data is not None else None,
    )
    with urlopen(request, timeout=20) as response:
        return response.read(), response.headers


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    config = json.loads(compose("config", "--format", "json"))
    services = config["services"]
    backend_port = services["backend"]["ports"][0]["published"]
    frontend_port = services["frontend"]["ports"][0]["published"]
    api = f"http://127.0.0.1:{backend_port}/api/v1"
    frontend = f"http://127.0.0.1:{frontend_port}"
    env = services["backend"]["environment"]
    http(frontend)
    http(f"http://127.0.0.1:{backend_port}/up")

    accounts = [
        ("SA-0001", "SUPER_ADMIN", "admin/metrics"),
        ("CO-0001", "COORDINATOR", "coordinator/metrics"),
        ("TR-0001", "TRAINER", "trainer/dashboard"),
        ("ST-0001", "STUDENT", "student/dashboard"),
    ]
    for sis_id, role, endpoint in accounts:
        payload, _ = http(api + "/auth/login", "POST", {
            "sis_id": sis_id,
            "password": env[f"AULA_SEED_{role}_PASSWORD"],
        }, {"Content-Type": "application/json", "Accept": "application/json"})
        token = json.loads(payload)["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        try:
            http(api + "/" + endpoint, headers=headers)
        finally:
            http(api + "/auth/logout", "POST", headers=headers)
        print(f"PASS: {sis_id} login and dashboard")

    _, cors = http(api + "/auth/login", "OPTIONS", headers={
        "Origin": frontend, "Access-Control-Request-Method": "POST",
    })
    check(cors.get("Access-Control-Allow-Origin") == frontend, "Browser origin rejected")

    marker = "docker-smoke-" + uuid.uuid4().hex
    # UUID-derived values are safe PHP string literals; no shell is used.
    snapshot_code = (
        f"$marker = '{marker}'; "
        "$storage = app(App\\Services\\PrivateStorageService::class); "
        "$path = 'docker-smoke/'.$marker.'.txt'; "
        "echo json_encode(["
        "'key' => hash('sha256', (string) config('app.key')), "
        "'users' => Illuminate\\Support\\Facades\\DB::table('users')->count(), "
        "'db_marker' => Illuminate\\Support\\Facades\\DB::table('cache')->where('key', $marker)->value('value'), "
        "'object' => $storage->disk()->get($path), "
        "'url' => $storage->temporaryUrl($path)]);"
    )
    try:
        php(
            f"$marker = '{marker}'; "
            "Illuminate\\Support\\Facades\\DB::table('cache')->insert(["
            "'key' => $marker, 'value' => $marker, 'expiration' => time()+3600]); "
            "app(App\\Services\\PrivateStorageService::class)->disk()->put('docker-smoke/'.$marker.'.txt', $marker);"
        )
        before = json.loads(php(snapshot_code))
        check(before["db_marker"] == marker, "Database write failed")
        check(before["object"] == marker, "Internal S3 read/write failed")
        content, _ = http(before["url"])
        check(content.decode() == marker, "Browser signed S3 URL failed")
        try:
            http(before["url"].split("?")[0])
            raise AssertionError("Bucket allows anonymous downloads")
        except HTTPError as error:
            check(error.code == 403, f"Expected private bucket, got HTTP {error.code}")
        print("PASS: private MinIO upload and browser signed download")

        compose("up", "-d", "--force-recreate", "--wait", "--wait-timeout", "180", timeout=240)
        after = json.loads(php(snapshot_code))
        for field in ("key", "users", "db_marker", "object"):
            check(after[field] == before[field], f"Container recreation lost {field}")
        content, _ = http(after["url"])
        check(content.decode() == marker, "Signed downloads fail after restart")
        print("PASS: database, objects, user count and application key persist")
    finally:
        php(
            f"$marker = '{marker}'; "
            "Illuminate\\Support\\Facades\\DB::table('cache')->where('key', $marker)->delete(); "
            "app(App\\Services\\PrivateStorageService::class)->disk()->delete('docker-smoke/'.$marker.'.txt');"
        )
    print("All Docker integration checks passed. Stack remains running.")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, RuntimeError, HTTPError, subprocess.TimeoutExpired) as error:
        print(f"FAILED: {error} {getattr(error, 'url', '')}", file=sys.stderr)
        sys.exit(1)
