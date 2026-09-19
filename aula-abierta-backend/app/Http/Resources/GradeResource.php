<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'submission_id' => $this->submission_id,
            'numeric_score' => $this->numeric_score,
            'letter_grade' => $this->letter_grade,
            'feedback' => $this->feedback,
            'graded_at' => $this->graded_at->toISOString(),
            'graded_by' => $this->graded_by,
            'task_title' => $this->when(
                $this->relationLoaded('submission') && $this->submission?->relationLoaded('courseTask'),
                fn () => $this->submission?->courseTask?->title,
            ),
            'classroom_name' => $this->when(
                $this->relationLoaded('submission')
                    && $this->submission?->relationLoaded('courseTask')
                    && $this->submission?->courseTask?->relationLoaded('week')
                    && $this->submission?->courseTask?->week?->relationLoaded('classroom'),
                fn () => $this->submission?->courseTask?->week?->classroom?->name,
            ),
            'criterion_scores' => $this->whenLoaded('criterionScores', fn () => $this->criterionScores->map(fn ($cs) => [
                'criterion_id' => $cs->criterion_id,
                'score' => $cs->score,
            ])
            ),
        ];
    }
}
