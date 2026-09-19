<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classroom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'classroom_id' => ['required', 'integer', 'exists:classrooms,id'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'integer', 'exists:users,id'],
            'records.*.date' => ['required', 'date_format:Y-m-d'],
            'records.*.present' => ['required', 'boolean'],
            'records.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        $classroom = Classroom::findOrFail($data['classroom_id']);

        // Trainer can only record for their classroom
        if ($request->user()->hasRole('teacher') && $classroom->trainer_id !== $request->user()->id) {
            abort(403);
        }

        $saved = DB::transaction(function () use ($data) {
            $results = [];
            foreach ($data['records'] as $record) {
                $results[] = Attendance::updateOrCreate(
                    [
                        'classroom_id' => $data['classroom_id'],
                        'student_id' => $record['student_id'],
                        'date' => $record['date'],
                    ],
                    [
                        'present' => $record['present'],
                        'notes' => $record['notes'] ?? null,
                    ],
                );
            }

            return $results;
        });

        return response()->json(['data' => $saved, 'message' => 'Attendance saved.']);
    }
}
