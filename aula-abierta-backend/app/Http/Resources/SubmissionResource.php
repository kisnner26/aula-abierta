<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\PrivateStorageService;

class SubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'course_task_id' => $this->course_task_id,
            'student_id' => $this->student_id,
            'notes' => $this->notes,
            'submitted_at' => $this->submitted_at->toISOString(),
            'student' => $this->whenLoaded('student', fn () => [
                'id' => $this->student->id,
                'sis_id' => $this->student->sis_id,
                'name' => $this->student->name,
            ]),
            'course_task' => $this->whenLoaded('courseTask', fn () => [
                'id' => $this->courseTask->id,
                'title' => $this->courseTask->title,
                'description' => $this->courseTask->description,
                'deadline' => $this->courseTask->deadline->toISOString(),
                'rubric' => $this->courseTask->relationLoaded('rubric') && $this->courseTask->rubric
                    ? new RubricResource($this->courseTask->rubric)
                    : null,
            ]),
            'evidence_urls' => $this->whenLoaded('evidenceFiles', function () {
                return $this->evidenceFiles->map(fn ($ef) => [
                    'id' => $ef->id,
                    'filename' => $ef->filename,
                    'mime_type' => $ef->mime_type,
                    // Generate short-lived signed URL at serialization time — storage_path never exposed
                    'signed_url' => app(PrivateStorageService::class)->temporaryUrl($ef->storage_path),
                ]);
            }),
            'grade' => new GradeResource($this->whenLoaded('grade')),
        ];
    }
}
