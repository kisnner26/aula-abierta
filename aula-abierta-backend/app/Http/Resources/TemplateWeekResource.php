<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateWeekResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'template_id' => $this->template_id,
            'number' => $this->number,
            'title' => $this->title,
            'vocabulary' => $this->vocabulary,
            'materials' => TemplateMaterialResource::collection($this->whenLoaded('materials')),
            'tasks' => TemplateCourseTaskResource::collection($this->whenLoaded('courseTasks')),
        ];
    }
}
