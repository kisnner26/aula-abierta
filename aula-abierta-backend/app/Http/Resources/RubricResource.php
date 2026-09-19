<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RubricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'course_task_id' => $this->course_task_id,
            'title' => $this->title,
            'criteria' => RubricCriterionResource::collection($this->whenLoaded('criteria')),
        ];
    }
}
