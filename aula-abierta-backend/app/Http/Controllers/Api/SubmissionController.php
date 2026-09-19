<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GradeResource;
use App\Http\Resources\SubmissionResource;
use App\Models\Classroom;
use App\Models\CourseTask;
use App\Models\Grade;
use App\Models\Submission;
use App\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function __construct(private readonly SubmissionService $submissionService) {}

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'course_task_id' => ['required', 'integer', 'exists:course_tasks,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'link_url' => ['nullable', 'url', 'max:500'],
            'evidence' => ['nullable', 'array', 'max:5'],
            'evidence.*' => ['file', 'max:51200'], // 50 MB per file
        ]);

        $task = CourseTask::findOrFail($request->course_task_id);
        $submission = $this->submissionService->submit(
            $task,
            $request->user()->id,
            $request->only(['notes', 'link_url']),
            $request->file('evidence', []),
        );

        return response()->json(['data' => new SubmissionResource($submission)], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $submission = Submission::with(['evidenceFiles', 'grade.criterionScores'])->findOrFail($id);
        $this->authorize('view', $submission);

        return response()->json(['data' => new SubmissionResource($submission)]);
    }

    // Trainer: pending (ungraded) submissions for a classroom
    public function pending(Request $request, int $classroomId): JsonResponse
    {
        $classroom = Classroom::findOrFail($classroomId);

        if ($request->user()->hasRole('teacher') && $classroom->trainer_id !== $request->user()->id) {
            abort(403);
        }

        $submissions = Submission::whereHas('courseTask.week', fn ($q) => $q->where('classroom_id', $classroomId)
        )
            ->whereDoesntHave('grade')
            ->with(['evidenceFiles', 'student', 'courseTask.rubric.criteria'])
            ->latest('submitted_at')
            ->get();

        return response()->json(['data' => SubmissionResource::collection($submissions)]);
    }

    // Trainer: all submissions for a classroom
    public function byClassroom(Request $request, int $classroomId): JsonResponse
    {
        $classroom = Classroom::findOrFail($classroomId);

        if ($request->user()->hasRole('teacher') && $classroom->trainer_id !== $request->user()->id) {
            abort(403);
        }

        $submissions = Submission::whereHas('courseTask.week', fn ($q) => $q->where('classroom_id', $classroomId)
        )
            ->with(['evidenceFiles', 'student', 'grade.criterionScores', 'courseTask.rubric.criteria'])
            ->latest('submitted_at')
            ->get();

        return response()->json(['data' => SubmissionResource::collection($submissions)]);
    }

    // Student: my grades across all classrooms
    public function myGrades(Request $request): JsonResponse
    {
        $grades = Grade::whereHas('submission', fn ($q) => $q->where('student_id', $request->user()->id)
        )
            ->with(['submission.courseTask.week.classroom', 'criterionScores'])
            ->latest('graded_at')
            ->get();

        return response()->json(['data' => GradeResource::collection($grades)]);
    }
}
