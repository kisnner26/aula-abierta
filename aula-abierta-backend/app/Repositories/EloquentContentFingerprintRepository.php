<?php

namespace App\Repositories;

use App\Models\ContentFingerprint;
use App\Models\Material;
use App\Repositories\Contracts\ContentFingerprintRepositoryInterface;

class EloquentContentFingerprintRepository implements ContentFingerprintRepositoryInterface
{
    public function create(array $attributes): ContentFingerprint
    {
        return ContentFingerprint::create($attributes);
    }

    public function findActiveForMaterial(string $id, Material $material): ContentFingerprint
    {
        return ContentFingerprint::query()
            ->whereKey($id)
            ->where('material_id', $material->id)
            ->where('expires_at', '>', now())
            ->firstOrFail();
    }

    public function markGenerated(ContentFingerprint $fingerprint, string $storagePath, string $mimeType): ContentFingerprint
    {
        $fingerprint->update([
            'storage_path' => $storagePath,
            'mime_type' => $mimeType,
        ]);

        return $fingerprint->refresh();
    }

    public function markAccessed(ContentFingerprint $fingerprint): ContentFingerprint
    {
        $fingerprint->update(['accessed_at' => now()]);

        return $fingerprint->refresh();
    }
}
