<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Week\UpdateWeekSessionRequest;
use App\Models\Classroom;
use App\Models\Week;
use App\Services\WeekSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeekSessionController extends Controller
{
    public function __construct(private readonly WeekSessionService $sessions) {}

    public function show(Request $request, Classroom $classroom, Week $week): JsonResponse
    {
        return response()->json(['data' => $this->sessions->show($classroom, $week, $request->user())]);
    }

    public function update(UpdateWeekSessionRequest $request, Classroom $classroom, Week $week): JsonResponse
    {
        return response()->json(['data' => $this->sessions->update($classroom, $week, $request->user(), $request->validated())]);
    }

    public function history(Request $request, Classroom $classroom): JsonResponse
    {
        return response()->json(['data' => $this->sessions->history($classroom, $request->user())]);
    }
}
