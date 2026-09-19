<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseTaskResource;
use App\Models\CourseTask;
use App\Services\CourseTaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseTaskController extends Controller
{
    public function __construct(private readonly CourseTaskService $courseTaskService) {}

    // Student: upcoming tasks across all enrolled classrooms
    public function upcoming(Request $request): JsonResponse
    {
        $studentId = $request->user()->id;

        $tasks = CourseTask::whereHas('week.classroom.enrollments', fn ($q) => $q->where('student_id', $studentId)->where('is_active', true)
        )
            ->with([
                'rubric.criteria',
                'submissions' => fn ($q) => $q->where('student_id', $studentId)->with(['grade', 'evidenceFiles']),
            ])
            ->where(fn ($q) => $q->where('deadline', '>=', now())->orWhere('is_open', true))
            ->orderBy('deadline')
            ->get()
            ->map(fn ($task) => $task->setRelation('submission', $task->submissions->first()));

        return response()->json(['data' => CourseTaskResource::collection($tasks)]);
    }

    // Student: single task with their submission
    public function show(Request $request, int $id): JsonResponse
    {
        $studentId = $request->user()->id;

        $task = CourseTask::whereHas('week.classroom.enrollments', fn ($q) => $q->where('student_id', $studentId)->where('is_active', true)
        )
            ->with([
                'rubric.criteria',
                'submissions' => fn ($q) => $q->where('student_id', $studentId)->with(['grade.criterionScores', 'evidenceFiles']),
            ])
            ->findOrFail($id);

        $task->setRelation('submission', $task->submissions->first());

        return response()->json(['data' => new CourseTaskResource($task)]);
    }

    // Coordinator-only reopen
    public function reopen(Request $request, CourseTask $courseTask): JsonResponse
    {
        $this->authorize('reopen', $courseTask);

        $request->validate(['deadline' => ['nullable', 'date', 'after:now']]);

        $task = $this->courseTaskService->reopen($courseTask, $request->input('deadline'));

        return response()->json(['data' => new CourseTaskResource($task)]);
    }
}
