<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'level_count' => $this->level_count,
            'weeks_per_level' => $this->weeks_per_level,
            'is_active' => $this->is_active,
            'levels' => LevelResource::collection($this->whenLoaded('levels')),
        ];
    }
}
