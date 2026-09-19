<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentFingerprintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user_reference' => $this->user_reference,
            'user_name' => $this->user?->name,
            'material_id' => $this->material_id,
            'material_reference' => $this->material_reference,
            'role' => $this->role,
            'mime_type' => $this->mime_type,
            'metadata_version' => config('content_fingerprint.version', 'AAFP1'),
            'accessed_at' => $this->accessed_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
