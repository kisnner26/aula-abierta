<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateMaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'template_week_id' => $this->template_week_id,
            'title' => $this->title,
            'type' => $this->type,
            'is_protected' => $this->is_protected,
            'has_file' => filled($this->storage_path),
            'external_url' => $this->is_protected ? null : $this->external_url,
        ];
    }
}
