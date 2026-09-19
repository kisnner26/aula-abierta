<?php

namespace App\Policies;

use App\Models\CourseTask;
use App\Models\User;

class CourseTaskPolicy
{
    public function reopen(User $user, CourseTask $task): bool
    {
        // Only coordinators and super admins can reopen tasks
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function update(User $user, CourseTask $task): bool
    {
        // Trainers can only adjust tasks in their own classrooms
        if ($user->hasRole('teacher')) {
            $classroomTrainerId = $task->week->classroom->trainer_id;

            return $classroomTrainerId === $user->id;
        }

        return $user->hasAnyRole(['admin', 'super_admin']);
    }
}
