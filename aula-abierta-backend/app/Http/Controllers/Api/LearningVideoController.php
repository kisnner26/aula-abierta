<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LearningVideo\StoreLearningVideoRequest;
use App\Http\Requests\LearningVideo\UpdateLearningVideoRequest;
use App\Http\Resources\LearningVideoResource;
use App\Models\Classroom;
use App\Models\LearningVideo;
use App\Services\LearningVideoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LearningVideoController extends Controller
{
    public function __construct(private readonly LearningVideoService $videos) {}

    public function index(Request $request, Classroom $classroom): JsonResponse
    {
        return response()->json(['data' => LearningVideoResource::collection($this->videos->forClassroom($classroom, $request->user()))]);
    }

    public function store(StoreLearningVideoRequest $request): JsonResponse
    {
        return response()->json(['data' => new LearningVideoResource($this->videos->create($request->user(), $request->validated()))], 201);
    }

    public function update(UpdateLearningVideoRequest $request, LearningVideo $learningVideo): JsonResponse
    {
        return response()->json(['data' => new LearningVideoResource($this->videos->update($request->user(), $learningVideo, $request->validated()))]);
    }

    public function destroy(Request $request, LearningVideo $learningVideo): JsonResponse
    {
        $this->videos->delete($request->user(), $learningVideo);

        return response()->json(status: 204);
    }
}
