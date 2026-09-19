<?php

namespace App\Services;

use App\Models\Classroom;
use App\Models\User;
use App\Models\Week;

class WeekSessionService
{
    public function __construct(
        private readonly ClassroomJourneyService $journeys,
        private readonly GoogleMeetService $googleMeet,
    ) {}

    public function show(Classroom $classroom, Week $week, User $user): array
    {
        $this->assertWeek($classroom, $week);
        $this->assertCanView($classroom, $user);

        return $this->journeys->sessionPayload($week, ! $user->hasRole('student'));
    }

    public function update(Classroom $classroom, Week $week, User $user, array $data): array
    {
        $this->assertWeek($classroom, $week);
        $this->assertCanManage($classroom, $user);

        $googleData = [];
        $scheduledAt = $data['session_scheduled_at'] ?? $week->session_scheduled_at?->toISOString();

        if (($data['create_google_meet'] ?? false) && $scheduledAt) {
            $googleData = $this->googleMeet->schedule($classroom, $week, $scheduledAt);
        }

        $week->update([
            ...collect($data)->except('create_google_meet')->all(),
            ...$googleData,
            'session_provider' => 'google_meet',
        ]);

        activity()->causedBy($user)->performedOn($week)->withProperties([
            'classroom_id' => $classroom->id,
            'session_is_live' => $week->session_is_live,
            'session_scheduled_at' => $week->session_scheduled_at,
            'session_provider' => 'google_meet',
            'google_event_id' => $week->google_event_id,
        ])->log('week_session_updated');

        return $this->journeys->sessionPayload($week->fresh(), true);
    }

    public function history(Classroom $classroom, User $user): array
    {
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        return $classroom->weeks()
            ->where(fn ($query) => $query->whereNotNull('session_scheduled_at')->orWhere('session_is_live', true))
            ->orderByDesc('session_scheduled_at')
            ->get()
            ->map(fn ($week) => $this->journeys->sessionPayload($week, true) + [
                'week_number' => $week->number,
                'week_title' => $week->title,
            ])->all();
    }

    private function assertWeek(Classroom $classroom, Week $week): void
    {
        abort_unless($week->classroom_id === $classroom->id, 404);
    }

    private function assertCanView(Classroom $classroom, User $user): void
    {
        $allowed = $user->hasAnyRole(['admin', 'super_admin'])
            || ($user->hasRole('teacher') && $classroom->trainer_id === $user->id)
            || ($user->hasRole('student') && $classroom->enrollments()->where('student_id', $user->id)->where('is_active', true)->exists());
        abort_unless($allowed, 403);
    }

    private function assertCanManage(Classroom $classroom, User $user): void
    {
        $allowed = $user->hasAnyRole(['admin', 'super_admin'])
            || ($user->hasRole('teacher') && $classroom->trainer_id === $user->id);
        abort_unless($allowed, 403);
    }
}
