<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService) {}

    public function grades(Request $request, Classroom $classroom): Response
    {
        $this->authorizeClassroomAccess($request, $classroom);

        return $this->reportService->gradesPdf($classroom);
    }

    public function attendance(Request $request, Classroom $classroom): Response
    {
        $this->authorizeClassroomAccess($request, $classroom);

        return $this->reportService->attendancePdf($classroom);
    }

    private function authorizeClassroomAccess(Request $request, Classroom $classroom): void
    {
        $user = $request->user();

        if ($user->hasRole('teacher') && $classroom->trainer_id !== $user->id) {
            abort(403, 'You do not have access to this classroom.');
        }
    }
}
