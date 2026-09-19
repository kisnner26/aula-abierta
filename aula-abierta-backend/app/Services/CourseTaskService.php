<?php

namespace App\Services;

use App\Models\CourseTask;

class CourseTaskService
{
    public function reopen(CourseTask $task, ?string $newDeadline): CourseTask
    {
        // Policy enforces coordinator-only; this is the business-layer guard
        $task->update([
            'is_open' => true,
            'deadline' => $newDeadline ? now()->parse($newDeadline) : $task->deadline->addDays(7),
        ]);

        activity()
            ->causedBy(auth()->user())
            ->performedOn($task)
            ->withProperties(['new_deadline' => $task->fresh()->deadline])
            ->log('task_reopened');

        return $task->fresh();
    }

    public function closeExpired(): int
    {
        return CourseTask::query()
            ->where('is_open', true)
            ->where('deadline', '<', now())
            ->update(['is_open' => false]);
    }
}
