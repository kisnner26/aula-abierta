<?php

namespace App\Services;

use App\Models\CourseTask;
use App\Models\EvidenceFile;
use App\Models\Submission;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmissionService
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly PrivateStorageService $storage,
    ) {}

    private const ALLOWED_MIMES = [
        'application/pdf',
        'image/jpeg', 'image/png', 'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/mpeg', 'audio/mp4', 'audio/ogg',
    ];

    public function submit(CourseTask $task, int $studentId, array $data, array $files): Submission
    {
        if ($task->isClosed()) {
            throw ValidationException::withMessages(['task' => ['This task is no longer accepting submissions.']]);
        }

        return DB::transaction(function () use ($task, $studentId, $data, $files) {
            $submission = Submission::updateOrCreate(
                ['course_task_id' => $task->id, 'student_id' => $studentId],
                [
                    'notes' => $data['notes'] ?? null,
                    'link_url' => $data['link_url'] ?? null,
                    'submitted_at' => now(),
                ],
            );

            foreach ($files as $file) {
                /** @var UploadedFile $file */
                if (! in_array($file->getMimeType(), self::ALLOWED_MIMES, true)) {
                    continue;
                }

                $path = $file->store("submissions/{$submission->id}", [
                    'disk' => $this->storage->diskName(),
                    'visibility' => 'private',
                ]);

                EvidenceFile::create([
                    'submission_id' => $submission->id,
                    'filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'storage_path' => $path,
                    'size_bytes' => $file->getSize(),
                ]);
            }

            $task->loadMissing('week.classroom.trainer');
            $trainer = $task->week?->classroom?->trainer;
            if ($trainer) {
                $this->notificationService->send(
                    $trainer,
                    'submission',
                    'New submission to review',
                    $task->title,
                    "/trainer/classrooms/{$task->week->classroom_id}/grading",
                    ['submission_id' => $submission->id, 'course_task_id' => $task->id],
                );
            }

            return $submission->load(['evidenceFiles', 'grade']);
        });
    }
}
