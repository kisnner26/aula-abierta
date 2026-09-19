<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $closed = ! $this->is_open || $this->deadline->isPast();

        $submission = $this->relationLoaded('submission') ? $this->submission : null;
        $status = match (true) {
            $submission?->grade !== null => 'graded',
            $submission !== null => 'submitted',
            $closed => 'closed',
            default => 'pending',
        };

        return [
            'id' => $this->id,
            'week_id' => $this->week_id,
            'title' => $this->title,
            'description' => $this->description,
            'deadline' => $this->deadline->toISOString(),
            'is_open' => $this->is_open,
            'status' => $status,
            'rubric' => new RubricResource($this->whenLoaded('rubric')),
            'submission' => new SubmissionResource($this->whenLoaded('submission')),
        ];
    }
}
