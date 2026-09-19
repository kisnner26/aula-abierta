<?php

namespace App\Http\Resources;

use App\Services\PrivateStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'level_id' => $this->level_id,
            'title' => $this->title,
            'cover_image_url' => $this->cover_image_path
                ? app(PrivateStorageService::class)->temporaryUrl($this->cover_image_path, 900)
                : null,
            'is_frozen' => $this->is_frozen,
            'weeks_count' => $this->weeks_count ?? 0,
            'classrooms_count' => $this->classrooms_count ?? null,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at->toISOString(),
            'level' => $this->whenLoaded('level', fn () => [
                'id' => $this->level->id,
                'name' => $this->level->name,
                'order' => $this->level->order,
                'program' => $this->level->relationLoaded('program') ? [
                    'id' => $this->level->program->id,
                    'name' => $this->level->program->name,
                    'code' => $this->level->program->code,
                ] : null,
            ]),
            'weeks' => TemplateWeekResource::collection($this->whenLoaded('weeks')),
        ];
    }
}
