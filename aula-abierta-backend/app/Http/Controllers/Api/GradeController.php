<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Grade\StoreGradeRequest;
use App\Http\Resources\GradeResource;
use App\Models\Grade;
use App\Models\Submission;
use App\Services\GradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function __construct(private readonly GradeService $gradeService) {}

    public function store(StoreGradeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $submission = Submission::with('courseTask.rubric.criteria')->findOrFail($validated['submission_id']);
        $this->authorize('grade', $submission);

        $grade = $this->gradeService->grade(
            $submission,
            $request->user(),
            $validated['criterion_scores'],
            $validated['feedback'] ?? null,
        );

        return response()->json(['data' => new GradeResource($grade)], 201);
    }

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
