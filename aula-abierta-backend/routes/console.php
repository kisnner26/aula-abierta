<?php

use App\Models\ContentFingerprint;
use App\Services\ContentFingerprintEncoder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('fingerprints:purge', function () {
    ContentFingerprint::query()
        ->where('expires_at', '<', now())
        ->whereNotNull('storage_path')
        ->orderBy('expires_at')
        ->chunkById(100, function ($fingerprints) {
            foreach ($fingerprints as $fingerprint) {
                Storage::disk('local')->delete($fingerprint->storage_path);
                $fingerprint->forceFill(['storage_path' => null])->save();
            }
        }, 'id');

    $this->info('Expired fingerprinted copies were removed. Audit records were preserved.');
})->purpose('Delete expired forensic content copies while preserving audit records');

Artisan::command('fingerprints:inspect-image {path} {--limit=5000}', function () {
    $path = (string) $this->argument('path');
    $limit = max(1, (int) $this->option('limit'));

    if (! is_file($path) || ! is_readable($path)) {
        $this->error('The image path is not readable.');

        return 1;
    }

    $bytes = file_get_contents($path);
    if ($bytes === false || @getimagesizefromstring($bytes) === false) {
        $this->error('The file is not a readable raster image.');

        return 1;
    }

    $encoder = app(ContentFingerprintEncoder::class);
    $metadataId = $encoder->metadataFingerprintId($bytes);

    if ($metadataId) {
        $fingerprint = ContentFingerprint::query()
            ->with(['user', 'material'])
            ->find($metadataId);

        if (! $fingerprint) {
            $this->warn("Metadata fingerprint {$metadataId} was found, but no audit record exists.");

            return 0;
        }

        $this->table(['Fingerprint', 'User', 'Role', 'Material', 'Created'], [[
            $fingerprint->id,
            $fingerprint->user_reference,
            $fingerprint->role,
            $fingerprint->material_reference,
            $fingerprint->created_at?->toISOString(),
        ]]);

        return 0;
    }

    $matches = ContentFingerprint::query()
        ->whereNotNull('pixel_tag')
        ->latest()
        ->limit($limit)
        ->get()
        ->map(fn (ContentFingerprint $fingerprint) => [
            'fingerprint' => $fingerprint,
            'score' => $encoder->detectionScore($bytes, $fingerprint->pixel_tag),
        ])
        ->sortByDesc('score')
        ->take(5)
        ->values();

    if ($matches->isEmpty()) {
        $this->warn('No fingerprint candidates were found.');

        return 0;
    }

    $this->table(['Fingerprint', 'Score', 'User', 'Role', 'Material', 'Created'], $matches->map(fn (array $match) => [
        $match['fingerprint']->id,
        number_format($match['score'], 4),
        $match['fingerprint']->user_reference,
        $match['fingerprint']->role,
        $match['fingerprint']->material_reference,
        $match['fingerprint']->created_at?->toISOString(),
    ])->all());

    return 0;
})->purpose('Inspect a captured/exported raster image and map its forensic fingerprint to an audit record');
