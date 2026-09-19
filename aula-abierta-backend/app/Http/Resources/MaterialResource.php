<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'week_id' => $this->week_id,
            'title' => $this->title,
            'type' => $this->type,
            'is_protected' => $this->is_protected,
            'external_url' => $this->is_protected ? null : $this->external_url,
            // signed_url intentionally absent — client must call /materials/{id}/signed-url
        ];
    }
}
