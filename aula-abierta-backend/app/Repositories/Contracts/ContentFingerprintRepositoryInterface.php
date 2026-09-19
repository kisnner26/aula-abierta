<?php

namespace App\Repositories\Contracts;

use App\Models\ContentFingerprint;
use App\Models\Material;

interface ContentFingerprintRepositoryInterface
{
    public function create(array $attributes): ContentFingerprint;

    public function findActiveForMaterial(string $id, Material $material): ContentFingerprint;

    public function markGenerated(ContentFingerprint $fingerprint, string $storagePath, string $mimeType): ContentFingerprint;

    public function markAccessed(ContentFingerprint $fingerprint): ContentFingerprint;
}
