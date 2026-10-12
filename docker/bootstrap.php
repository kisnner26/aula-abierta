<?php

require '/app/vendor/autoload.php';
$app = require '/app/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// New buckets are private by default. Existing objects are preserved.
$s3 = Illuminate\Support\Facades\Storage::disk('r2')->getClient();
$bucket = config('filesystems.disks.r2.bucket');
if (! $s3->doesBucketExistV2($bucket)) {
    $s3->createBucket(['Bucket' => $bucket]);
}

// Seed an empty database atomically. A restart preserves edits and passwords;
// a failed seed rolls back so the next start can retry safely.
Illuminate\Support\Facades\DB::transaction(function (): void {
    if (! Illuminate\Support\Facades\DB::table('users')->exists()) {
        $exitCode = Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        echo Illuminate\Support\Facades\Artisan::output();
        if ($exitCode !== 0) {
            throw new RuntimeException('Development database seeding failed.');
        }
    }
});
