<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Services\ContentFingerprintService;
use App\Services\MaterialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MaterialController extends Controller
{
    public function __construct(
        private readonly MaterialService $materialService,
        private readonly ContentFingerprintService $fingerprints,
    ) {}

    public function signedUrl(Request $request, Material $material): JsonResponse
    {
        $this->authorize('viewSignedUrl', $material);

        $access = $this->materialService->accessUrl($material, $request->user(), $request);

        return response()->json(['data' => [
            'url' => $access->url,
            'expires_in' => $access->expiresIn,
            'fingerprint_mode' => $access->mode,
            'fingerprint_version' => $access->version,
        ]]);
    }

    public function fingerprintedContent(Material $material, string $fingerprint): BinaryFileResponse
    {
        return $this->fingerprints->stream($material, $fingerprint);
    }
}
