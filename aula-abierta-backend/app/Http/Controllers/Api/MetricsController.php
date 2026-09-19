<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\CourseTask;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MetricsController extends Controller
{
    public function coordinator(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'super_admin']), 403);

        $activeClassrooms = Classroom::where('is_active', true)->count();

        $totalStudents = User::role('student')->count();

        $totalTasks = CourseTask::where('is_open', false)->orWhere('deadline', '<', now())->count();
        $submittedTasks = Submission::count();
        $completionRate = $totalTasks > 0 ? (int) round(($submittedTasks / $totalTasks) * 100) : 0;

        $pendingSubmissions = Submission::whereDoesntHave('grade')->count();

        return response()->json([
            'data' => [
                'active_classrooms' => $activeClassrooms,
                'total_students' => $totalStudents,
                'task_completion_rate' => $completionRate,
                'pending_submissions' => $pendingSubmissions,
            ],
        ]);
    }

    public function admin(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('super_admin'), 403);

        $activeGroups = Classroom::where('is_active', true)->count();
        $totalUsers = User::count();

        $totalTasks = CourseTask::count();
        $submittedTasks = Submission::count();
        $completionRate = $totalTasks > 0 ? (int) round(($submittedTasks / $totalTasks) * 100) : 0;

        $activityByGroup = DB::table('submissions')
            ->join('course_tasks', 'submissions.course_task_id', '=', 'course_tasks.id')
            ->join('weeks', 'course_tasks.week_id', '=', 'weeks.id')
            ->join('classrooms', 'weeks.classroom_id', '=', 'classrooms.id')
            ->select('classrooms.name as classroom_name', DB::raw('COUNT(submissions.id) as activity_count'))
            ->groupBy('classrooms.id', 'classrooms.name')
            ->orderByDesc('activity_count')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'active_groups' => $activeGroups,
                'total_users' => $totalUsers,
                'task_completion_rate' => $completionRate,
                'activity_by_group' => $activityByGroup,
            ],
        ]);
    }
}
