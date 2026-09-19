<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FamilyController extends Controller
{
    // ── GET /family/children ──────────────────────────────────────────────────
    // Returns all students linked to the authenticated family member.
    public function children(Request $request): JsonResponse
    {
        $user = $request->user();

        $children = DB::table('family_students')
            ->join('users', 'users.id', '=', 'family_students.student_user_id')
            ->where('family_students.family_user_id', $user->id)
            ->select(
                'users.id',
                'users.name',
                'users.sis_id',
                'users.avatar_url',
                'family_students.relationship',
            )
            ->get();

        return response()->json(['data' => $children]);
    }

    // ── GET /family/children/{studentId}/dashboard ────────────────────────────
    // Returns a read-only dashboard for a single linked child.
    public function childDashboard(Request $request, int $studentId): JsonResponse
    {
        $user = $request->user();

        // Verify the family link exists
        $link = DB::table('family_students')
            ->where('family_user_id', $user->id)
            ->where('student_user_id', $studentId)
            ->first();

        if (! $link) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $student = DB::table('users')->where('id', $studentId)->first();

        // Enrolled classrooms
        $classrooms = DB::table('classrooms')
            ->join('enrollments', 'enrollments.classroom_id', '=', 'classrooms.id')
            ->where('enrollments.student_id', $studentId)
            ->where('enrollments.is_active', true)
            ->select('classrooms.id', 'classrooms.name', 'classrooms.academic_period', 'classrooms.is_active')
            ->get();

        // Recent grades (last 10)
        $grades = DB::table('grades')
            ->join('submissions', 'submissions.id', '=', 'grades.submission_id')
            ->join('course_tasks', 'course_tasks.id', '=', 'submissions.course_task_id')
            ->where('submissions.student_id', $studentId)
            ->orderByDesc('grades.created_at')
            ->limit(10)
            ->select(
                'grades.id',
                'grades.numeric_score',
                'grades.feedback',
                'grades.created_at as graded_at',
                'course_tasks.title as task_title',
            )
            ->get();

        $averageScore = $grades->isNotEmpty()
            ? round($grades->avg('numeric_score'))
            : null;

        // Upcoming tasks
        $upcomingTasks = DB::table('course_tasks')
            ->join('weeks', 'weeks.id', '=', 'course_tasks.week_id')
            ->join('enrollments', 'enrollments.classroom_id', '=', 'weeks.classroom_id')
            ->leftJoin('submissions', function ($join) use ($studentId) {
                $join->on('submissions.course_task_id', '=', 'course_tasks.id')
                    ->where('submissions.student_id', $studentId);
            })
            ->where('enrollments.student_id', $studentId)
            ->where('enrollments.is_active', true)
            ->where('course_tasks.is_open', true)
            ->where('course_tasks.deadline', '>=', now())
            ->whereNull('submissions.id')
            ->orderBy('course_tasks.deadline')
            ->limit(5)
            ->select('course_tasks.id', 'course_tasks.title', 'course_tasks.deadline')
            ->get();

        // Attendance summary (last 30 days)
        $attendanceRows = DB::table('attendance')
            ->join('classrooms', 'classrooms.id', '=', 'attendance.classroom_id')
            ->join('enrollments', 'enrollments.classroom_id', '=', 'classrooms.id')
            ->where('attendance.student_id', $studentId)
            ->where('attendance.date', '>=', now()->subDays(30)->toDateString())
            ->select('attendance.date', 'attendance.present')
            ->orderByDesc('attendance.date')
            ->get();

        $attendedCount = $attendanceRows->where('present', true)->count();
        $totalCount    = $attendanceRows->count();

        return response()->json(['data' => [
            'student'          => $student,
            'classrooms'       => $classrooms,
            'grades'           => $grades,
            'average_score'    => $averageScore,
            'upcoming_tasks'   => $upcomingTasks,
            'attendance_30d'   => [
                'attended' => $attendedCount,
                'total'    => $totalCount,
                'rate'     => $totalCount ? round($attendedCount / $totalCount * 100) : null,
            ],
        ]]);
    }
}
