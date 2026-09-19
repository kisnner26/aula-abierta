<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClassroomResource;
use App\Http\Resources\CourseTaskResource;
use App\Http\Resources\MaterialResource;
use App\Models\Classroom;
use App\Services\ClassroomJourneyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassroomJourneyController extends Controller
{
    public function __construct(private readonly ClassroomJourneyService $journeys) {}

    public function show(Request $request, int $id): JsonResponse
    {
        $classroom = Classroom::whereHas('enrollments', fn ($query) => $query
            ->where('student_id', $request->user()->id)->where('is_active', true))
            ->with('level.program')
            ->findOrFail($id);

        $journey = $this->journeys->build($classroom, $request->user());
        $journey['classroom'] = new ClassroomResource($classroom);
        $journey['weeks'] = collect($journey['weeks'])->map(fn ($week) => [
            ...$week,
            'materials' => MaterialResource::collection($week['materials']),
            'tasks' => CourseTaskResource::collection($week['tasks']),
        ])->values();

        return response()->json(['data' => $journey]);
    }

    public function stars(Request $request, Classroom $classroom): JsonResponse
    {
        $allowed = $request->user()->hasAnyRole(['admin', 'super_admin'])
            || ($request->user()->hasRole('teacher') && $classroom->trainer_id === $request->user()->id)
            || $classroom->enrollments()->where('student_id', $request->user()->id)->where('is_active', true)->exists();
        abort_unless($allowed, 403);

        return response()->json(['data' => $this->journeys->starWall($classroom)]);
    }
}
