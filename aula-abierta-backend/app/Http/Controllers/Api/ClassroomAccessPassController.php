<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Classroom;
use App\Models\User;
use App\Services\ClassroomAccessPassService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassroomAccessPassController extends Controller
{
    public function __construct(private readonly ClassroomAccessPassService $passes) {}

    public function store(Request $request, Classroom $classroom): JsonResponse
    {
        $validated = $request->validate(['student_id' => ['required', 'integer', 'exists:users,id']]);
        $student = User::findOrFail($validated['student_id']);

        return response()->json(['data' => $this->passes->create($classroom, $student, $request->user())], 201);
    }

    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate(['token' => ['required', 'string', 'size:64']]);
        $result = $this->passes->redeem($validated['token']);

        return response()->json(['data' => [
            'user' => new UserResource($result['user']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'classroom_id' => $result['classroom_id'],
        ]]);
    }
}
