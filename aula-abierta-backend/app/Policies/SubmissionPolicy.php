<?php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function view(User $user, Submission $submission): bool
    {
        if ($user->hasRole('student')) {
            return $submission->student_id === $user->id;
        }

        if ($user->hasRole('teacher')) {
            return $submission->courseTask->week->classroom->trainer_id === $user->id;
        }

        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function grade(User $user, Submission $submission): bool
    {
        if ($user->hasRole('teacher')) {
            return $submission->courseTask->week->classroom->trainer_id === $user->id;
        }

        return $user->hasAnyRole(['admin', 'super_admin']);
    }
}
