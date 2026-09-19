<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboards) {}

    public function student(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('student'), 403);

        return response()->json(['data' => $this->dashboards->student($request->user(), $request)]);
    }

    public function trainer(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('teacher'), 403);

        return response()->json(['data' => $this->dashboards->trainer($request->user(), $request)]);
    }
}
