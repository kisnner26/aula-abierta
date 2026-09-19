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
        return $this->disk()->temporaryUrl($path, now()->addSeconds($seconds));
    }
}
