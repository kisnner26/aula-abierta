<?php

namespace App\Services;

use App\Data\FingerprintedAccess;
use App\Models\Material;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

class MaterialService
{
    public function __construct(
        private readonly PrivateStorageService $storage,
        private readonly ContentFingerprintService $fingerprints,
    ) {}

    public function accessUrl(Material $material, User $accessor, Request $request): FingerprintedAccess
    {
        return $this->fingerprints->issue($material, $accessor, $request);
    }

    public function store(int $weekId, array $data, ?UploadedFile $file): Material
    {
        $storagePath = null;

        if ($file) {
            $storagePath = $file->store(
                "materials/week-{$weekId}",
                ['disk' => $this->storage->diskName(), 'visibility' => 'private'],
            );
        }

        return Material::create([
            'week_id' => $weekId,
            'title' => $data['title'],
            'type' => $data['type'],
            'is_protected' => $data['is_protected'] ?? false,
            'storage_path' => $storagePath,
            'external_url' => $data['external_url'] ?? null,
        ]);
    }
}
