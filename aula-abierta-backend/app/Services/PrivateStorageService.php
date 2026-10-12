<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

class PrivateStorageService
{
    public function diskName(): string
    {
        return (string) config('filesystems.protected_disk', 'r2');
    }

    public function disk(): Filesystem
    {
        return Storage::disk($this->diskName());
    }

    public function temporaryUrl(string $path, int $seconds = 300): string
    {
        $disk = $this->disk();
        $config = config('filesystems.disks.'.$this->diskName(), []);

        // Sign with the browser's endpoint: changing the host after signing
        // invalidates the S3 signature. Reads and uploads keep the internal URL.
        if (($config['driver'] ?? null) === 's3' && ! empty($config['public_endpoint'])) {
            $disk = Storage::build(array_replace($config, ['endpoint' => $config['public_endpoint']]));
        }

        return $disk->temporaryUrl($path, now()->addSeconds($seconds));
    }
}
