<?php

namespace App\Services;

use App\Models\Classroom;
use App\Models\LearningVideo;
use App\Models\User;

class LearningVideoService
{
    public function forClassroom(Classroom $classroom, User $user)
    {
        $allowed = $user->hasAnyRole(['admin', 'super_admin'])
            || ($user->hasRole('teacher') && $classroom->trainer_id === $user->id)
            || ($user->hasRole('student') && $classroom->enrollments()->where('student_id', $user->id)->where('is_active', true)->exists());
        abort_unless($allowed, 403);

        $classroom->loadMissing('level.program');

        return LearningVideo::query()
            ->where('program_id', $classroom->level->program_id)
            ->where('level_id', $classroom->level_id)
            ->when($user->hasRole('student'), fn ($query) => $query->where('is_active', true))
            ->orderBy('sort_order')->orderBy('title')->get();
    }

    public function create(User $user, array $data): LearningVideo
    {
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);
        abort_unless(\App\Models\Level::whereKey($data['level_id'])->where('program_id', $data['program_id'])->exists(), 422, 'The selected level does not belong to this program.');

        return LearningVideo::create([...$data, 'added_by' => $user->id]);
    }

    public function update(User $user, LearningVideo $video, array $data): LearningVideo
    {
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);
        $video->update($data);

        return $video->fresh();
    }

    public function delete(User $user, LearningVideo $video): void
    {
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);
        $video->delete();
    }
}
