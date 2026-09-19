<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassroomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'template_id' => $this->template_id,
            'level_id' => $this->level_id,
            'trainer_id' => $this->trainer_id,
            'name' => $this->name,
            'academic_period' => $this->academic_period,
            'starts_at' => $this->starts_at?->toDateString(),
            'ends_at' => $this->ends_at?->toDateString(),
            'is_active' => $this->is_active,
            'enrollment_count' => $this->enrollments_count ?? $this->enrollment_count ?? 0,
            'theme' => [
                'primary_color' => $this->theme_primary_color,
                'accent_color' => $this->theme_accent_color,
                'hero_background' => $this->hero_background,
                'welcome_message' => $this->welcome_message,
            ],
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
        ];
    }
}
