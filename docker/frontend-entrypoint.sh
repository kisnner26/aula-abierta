#!/bin/sh
set -eu
cd /app
# Linux dependencies stay in the volume, separate from Windows node_modules.
lock_hash=$(sha256sum package-lock.json | cut -d ' ' -f 1)
if [ ! -f node_modules/.aula-lock-hash ] || [ "$(cat node_modules/.aula-lock-hash)" != "$lock_hash" ]; then
    npm ci --no-fund
    printf '%s' "$lock_hash" > node_modules/.aula-lock-hash
fi
exec "$@"
