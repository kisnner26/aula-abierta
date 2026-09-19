<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentFingerprintResource;
use App\Models\ContentFingerprint;

class ContentFingerprintController extends Controller
{
    public function show(ContentFingerprint $contentFingerprint): ContentFingerprintResource
    {
        $this->authorize('view', $contentFingerprint);

        $contentFingerprint->loadMissing(['user', 'material']);

        return ContentFingerprintResource::make($contentFingerprint);
    }
}
