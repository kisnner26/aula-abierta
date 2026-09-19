<?php

namespace App\Services;

use App\Http\Resources\ClassroomResource;
use App\Http\Resources\CourseTaskResource;
use App\Http\Resources\GradeResource;
use App\Models\Classroom;
use App\Models\CourseTask;
use App\Models\Grade;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardService
{
    public function __construct(private readonly ClassroomJourneyService $journeys) {}

    public function student(User $student, Request $request): array
    {
        $classrooms = Classroom::query()
            ->whereHas('enrollments', fn ($query) => $query->where('student_id', $student->id)->where('is_active', true))
            ->with('level.program')
            ->withCount(['enrollments' => fn ($query) => $query->where('is_active', true)])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $tasks = CourseTask::query()
            ->whereHas('week.classroom.enrollments', fn ($query) => $query->where('student_id', $student->id)->where('is_active', true))
            ->with([
                'rubric.criteria',
                'submissions' => fn ($query) => $query->where('student_id', $student->id)->with(['grade', 'evidenceFiles']),
            ])
            ->where(fn ($query) => $query->where('deadline', '>=', now())->orWhere('is_open', true))
            ->orderBy('deadline')
            ->limit(12)
            ->get()
            ->map(fn ($task) => $task->setRelation('submission', $task->submissions->first()));

        $grades = Grade::query()
            ->whereHas('submission', fn ($query) => $query->where('student_id', $student->id))
            ->with(['submission.courseTask.week.classroom', 'criterionScores'])
            ->latest('graded_at')
            ->limit(20)
            ->get();

        return [
            'classrooms' => ClassroomResource::collection($classrooms)->resolve($request),
            'upcoming_tasks' => CourseTaskResource::collection($tasks)->resolve($request),
            'grades' => GradeResource::collection($grades)->resolve($request),
            'journey' => $classrooms->first() ? $this->journeys->build($classrooms->first(), $student) : null,
        ];
    }

    public function trainer(User $trainer, Request $request): array
    {
        $classrooms = Classroom::query()
            ->where('trainer_id', $trainer->id)
            ->with('level.program')
            ->withCount(['enrollments' => fn ($query) => $query->where('is_active', true)])
            ->orderBy('name')
            ->get();

        $pending = Submission::query()
            ->selectRaw('weeks.classroom_id, count(*) as aggregate')
            ->join('course_tasks', 'course_tasks.id', '=', 'submissions.course_task_id')
            ->join('weeks', 'weeks.id', '=', 'course_tasks.week_id')
            ->leftJoin('grades', 'grades.submission_id', '=', 'submissions.id')
            ->whereIn('weeks.classroom_id', $classrooms->pluck('id'))
            ->whereNull('grades.id')
            ->groupBy('weeks.classroom_id')
            ->pluck('aggregate', 'weeks.classroom_id');

        return [
            'classrooms' => ClassroomResource::collection($classrooms)->resolve($request),
            'pending_by_classroom' => $pending->map(fn ($count) => (int) $count)->all(),
            'pending_total' => $pending->sum(),
            'student_total' => $classrooms->sum('enrollments_count'),
        ];
    }
}
