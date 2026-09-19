<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateCourseTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'template_week_id' => $this->template_week_id,
            'title' => $this->title,
            'description' => $this->description,
            'deadline_offset_days' => $this->deadline_offset_days,
            'is_open' => $this->is_open,
            'rubric' => $this->whenLoaded('rubric', fn () => [
                'id' => $this->rubric->id,
                'template_course_task_id' => $this->rubric->template_course_task_id,
                'title' => $this->rubric->title,
                'criteria' => $this->rubric->relationLoaded('criteria')
                    ? $this->rubric->criteria->map(fn ($criterion) => [
                        'id' => $criterion->id,
                        'template_rubric_id' => $criterion->template_rubric_id,
                        'name' => $criterion->name,
                        'description' => $criterion->description,
                        'max_score' => $criterion->max_score,
                        'order' => $criterion->order,
                    ])->values()
                    : [],
            ]),
        ];
    }
}
