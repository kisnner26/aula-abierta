<?php

namespace App\Services;

use App\Models\Classroom;
use App\Models\Grade;
use App\Models\User;

class ClassroomJourneyService
{
    public function build(Classroom $classroom, User $student): array
    {
        $classroom->loadMissing('level.program');
        $weeks = $classroom->weeks()->with([
            'materials',
            'courseTasks.rubric.criteria',
            'courseTasks.submissions' => fn ($query) => $query
                ->where('student_id', $student->id)
                ->with(['grade.criterionScores', 'evidenceFiles']),
        ])->get();

        $completedWeeks = 0;
        $encounteredCurrent = false;
        $journeyWeeks = $weeks->map(function ($week) use (&$completedWeeks, &$encounteredCurrent) {
            $tasks = $week->courseTasks;
            $completed = $tasks->isNotEmpty()
                && $tasks->every(fn ($task) => $task->submissions->isNotEmpty());

            if ($completed) {
                $state = 'completed';
                $completedWeeks++;
            } elseif (! $encounteredCurrent) {
                $state = 'current';
                $encounteredCurrent = true;
            } else {
                $state = 'locked';
            }

            return [
                'id' => $week->id,
                'number' => $week->number,
                'title' => $week->title,
                'vocabulary' => $week->vocabulary,
                'state' => $state,
                'materials_count' => $week->materials->count(),
                'tasks_count' => $tasks->count(),
                'completed_tasks_count' => $tasks->filter(fn ($task) => $task->submissions->isNotEmpty())->count(),
                'materials' => $week->materials,
                'tasks' => $tasks->map(function ($task) {
                    $task->setRelation('submission', $task->submissions->first());

                    return $task;
                }),
                'session' => $this->sessionPayload($week, false),
            ];
        });

        $totalWeeks = max($weeks->count(), (int) ($classroom->level->program->weeks_per_level ?? 0));
        $pendingTasks = $weeks->flatMap->courseTasks
            ->filter(fn ($task) => $task->submissions->isEmpty() && $task->is_open && $task->deadline->isFuture())
            ->count();

        return [
            'classroom' => $classroom,
            'program' => [
                'id' => $classroom->level->program->id,
                'name' => $classroom->level->program->name,
                'code' => $classroom->level->program->code,
            ],
            'level' => [
                'id' => $classroom->level->id,
                'name' => $classroom->level->name,
                'order' => $classroom->level->order,
            ],
            'progress' => [
                'completed_weeks' => $completedWeeks,
                'total_weeks' => $totalWeeks,
                'remaining_weeks' => max(0, $totalWeeks - $completedWeeks),
                'percent' => $totalWeeks > 0 ? (int) round(($completedWeeks / $totalWeeks) * 100) : 0,
            ],
            'motivation' => $pendingTasks > 0
                ? $this->motivationFor($classroom->level->program->code, $student->name, $pendingTasks)
                : null,
            'weeks' => $journeyWeeks,
            'star_wall' => $this->starWall($classroom),
        ];
    }

    public function starWall(Classroom $classroom): array
    {
        return Grade::query()
            ->where('numeric_score', '>=', 90)
            ->whereHas('submission.courseTask.week', fn ($query) => $query->where('classroom_id', $classroom->id))
            ->with(['submission.student', 'submission.courseTask'])
            ->latest('graded_at')
            ->limit(12)
            ->get()
            ->map(fn (Grade $grade) => [
                'grade_id' => $grade->id,
                'student_name' => $grade->submission->student->name,
                'task_title' => $grade->submission->courseTask->title,
                'numeric_score' => $grade->numeric_score,
                'letter_grade' => $grade->letter_grade,
                'awarded_at' => $grade->graded_at->toISOString(),
            ])->all();
    }

    public function sessionPayload($week, bool $includePrivate): array
    {
        return [
            'week_id' => $week->id,
            'meet_link' => $week->meet_link,
            'provider' => $week->session_provider ?: 'google_meet',
            'google_event_id' => $includePrivate ? $week->google_event_id : null,
            'google_calendar_url' => $includePrivate ? $week->google_calendar_url : null,
            'session_scheduled_at' => $week->session_scheduled_at?->toISOString(),
            'session_is_live' => (bool) $week->session_is_live,
        ];
    }

    private function motivationFor(string $programCode, string $name, int $pending): array
    {
        $firstName = explode(' ', trim($name))[0];
        $message = match ($programCode) {
            'FES' => "{$firstName}, your next mission is ready. One playful step today keeps your English adventure moving.",
            'TES' => "{$firstName}, consistency builds the future you are preparing for. Complete one mission and keep your momentum.",
            'COLAB' => "{$firstName}, every challenge you solve trains a creator's mind. Start with the next mission.",
            default => "{$firstName}, your next activity is ready. Continue practicing and review your progress.",
        };

        return ['message' => $message, 'pending_tasks' => $pending, 'program_code' => $programCode];
    }
}
