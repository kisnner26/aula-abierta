<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FamilyController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\SseController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\ClassroomAccessPassController;
use App\Http\Controllers\Api\ClassroomJourneyController;
use App\Http\Controllers\Api\ContentFingerprintController;
use App\Http\Controllers\Api\CourseTaskController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\LearningVideoController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\MetricsController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WeekSessionController;
use Illuminate\Support\Facades\Route;

// ─── Public (unauthenticated) ────────────────────────────────────────────────
Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::post('auth/qr-access', [ClassroomAccessPassController::class, 'redeem']);
    Route::get('events/stream', [SseController::class, 'stream'])->middleware('throttle:120,1');
    Route::get('materials/{material}/content/{fingerprint}', [MaterialController::class, 'fingerprintedContent'])
        ->middleware('signed')
        ->name('materials.fingerprinted-content');

    // ─── Authenticated ───────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        // Personal profile and preferences
        Route::get('profile', [ProfileController::class, 'show']);
        Route::patch('profile', [ProfileController::class, 'update']);
        Route::post('profile/avatar', [ProfileController::class, 'updateAvatar']);
        Route::delete('profile/avatar', [ProfileController::class, 'removeAvatar']);

        // In-app notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::delete('notifications/all', [NotificationController::class, 'destroyAll']);
        Route::post('notifications/{notificationId}/read', [NotificationController::class, 'markRead']);
        Route::delete('notifications/{notificationId}', [NotificationController::class, 'destroy']);

        // Programs & levels (coordinator+)
        Route::get('programs', [ProgramController::class, 'index']);
        Route::post('programs', [ProgramController::class, 'store']);
        Route::get('programs/{program}/levels', [ProgramController::class, 'levels']);

        // Templates (coordinator+)
        Route::get('templates', [TemplateController::class, 'index']);
        Route::post('templates', [TemplateController::class, 'store']);
        Route::get('templates/{template}', [TemplateController::class, 'show']);
        Route::post('templates/{template}/weeks', [TemplateController::class, 'storeWeek']);
        Route::post('templates/{template}/cover', [TemplateController::class, 'uploadCover']);
        Route::post('template-weeks/{templateWeek}/materials', [TemplateController::class, 'uploadMaterial']);
        Route::patch('template-weeks/{templateWeek}', [TemplateController::class, 'updateWeek']);
        Route::post('templates/{template}/freeze', [TemplateController::class, 'freeze']);
        Route::post('templates/{template}/clone', [TemplateController::class, 'clone']);
        Route::delete('templates/{template}', [TemplateController::class, 'destroy']);

        // Classrooms
        Route::get('classrooms', [ClassroomController::class, 'index']);
        Route::post('classrooms', [ClassroomController::class, 'store']);
        Route::get('classrooms/{classroom}', [ClassroomController::class, 'show']);
        Route::patch('classrooms/{classroom}', [ClassroomController::class, 'update']);
        Route::patch('classrooms/{classroom}/theme', [ClassroomController::class, 'updateTheme']);
        Route::post('classrooms/{classroom}/assign-trainer', [ClassroomController::class, 'assignTrainer']);
        Route::get('classrooms/{classroom}/weeks', [ClassroomController::class, 'weeks']);
        Route::get('classrooms/{classroom}/students', [ClassroomController::class, 'students']);
        Route::get('classrooms/{classroom}/attendance', [ClassroomController::class, 'attendance']);
        Route::get('classrooms/{classroom}/star-wall', [ClassroomJourneyController::class, 'stars']);
        Route::get('classrooms/{classroom}/learning-videos', [LearningVideoController::class, 'index']);
        Route::post('classrooms/{classroom}/access-passes', [ClassroomAccessPassController::class, 'store']);
        Route::get('classrooms/{classroom}/sessions', [WeekSessionController::class, 'history']);
        Route::get('classrooms/{classroom}/weeks/{week}/session', [WeekSessionController::class, 'show']);
        Route::patch('classrooms/{classroom}/weeks/{week}/session', [WeekSessionController::class, 'update']);

        // Video library curation (coordination only for writes)
        Route::post('learning-videos', [LearningVideoController::class, 'store']);
        Route::patch('learning-videos/{learningVideo}', [LearningVideoController::class, 'update']);
        Route::delete('learning-videos/{learningVideo}', [LearningVideoController::class, 'destroy']);

        // Reports (PDF — coordinator and trainer)
        Route::get('classrooms/{classroom}/reports/grades', [ReportController::class, 'grades']);
        Route::get('classrooms/{classroom}/reports/attendance', [ReportController::class, 'attendance']);

        // Materials — signed URL only, never raw path
        Route::get('materials/{material}/signed-url', [MaterialController::class, 'signedUrl']);

        // Course tasks
        Route::post('course-tasks/{courseTask}/reopen', [CourseTaskController::class, 'reopen']);

        // Submissions
        Route::post('submissions', [SubmissionController::class, 'store']);
        Route::get('submissions/{id}', [SubmissionController::class, 'show']);

        // Grades
        Route::post('grades', [GradeController::class, 'store']);

        // Attendance
        Route::post('attendance', [AttendanceController::class, 'store']);

        // Users (super_admin / admin)
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::match(['put', 'patch'], 'users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
        Route::post('users/bulk-import', [UserController::class, 'bulkImport']);

        // Quiz (Arena) — trainer controls
        Route::prefix('trainer')->group(function () {
            Route::post('classrooms/{classroomId}/quiz', [QuizController::class, 'start']);
            Route::post('quiz/{quizId}/questions', [QuizController::class, 'addQuestion']);
            Route::delete('quiz/{quizId}/questions/{questionId}', [QuizController::class, 'deleteQuestion']);
            Route::patch('quiz/{quizId}/reveal', [QuizController::class, 'revealNext']);
            Route::post('quiz/{quizId}/end', [QuizController::class, 'end']);
            Route::get('quiz/{quizId}/state', [QuizController::class, 'trainerState']);
        });

        // Quiz (Arena) — student participation
        Route::prefix('student')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'student']);
            Route::get('inbox', [MessageController::class, 'inbox']);
            Route::get('quiz/active', [QuizController::class, 'studentActive']);
            Route::post('quiz/{quizId}/answer', [QuizController::class, 'answer']);
        });

        // Family portal — read-only views of linked students
        Route::prefix('family')->group(function () {
            Route::get('children', [FamilyController::class, 'children']);
            Route::get('children/{studentId}/dashboard', [FamilyController::class, 'childDashboard']);
        });

        // Student-scoped routes
        Route::prefix('student')->group(function () {
            Route::get('classrooms', [ClassroomController::class, 'myClassrooms']);
            Route::get('classrooms/{id}', [ClassroomController::class, 'myClassroom']);
            Route::get('classrooms/{id}/weeks', [ClassroomController::class, 'myWeeks']);
            Route::get('classrooms/{id}/journey', [ClassroomJourneyController::class, 'show']);
            Route::get('classrooms/{id}/messages', [MessageController::class, 'index']);
            Route::post('classrooms/{id}/messages', [MessageController::class, 'store']);
            Route::get('tasks/upcoming', [CourseTaskController::class, 'upcoming']);
            Route::get('tasks/{id}', [CourseTaskController::class, 'show']);
            Route::get('grades', [GradeController::class, 'myGrades']);
        });

        // Trainer-scoped routes
        Route::prefix('trainer')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'trainer']);
            Route::get('classrooms', [ClassroomController::class, 'trainerClassrooms']);
            Route::get('classrooms/{id}', [ClassroomController::class, 'trainerClassroom']);
            Route::get('classrooms/{id}/submissions/pending', [SubmissionController::class, 'pending']);
            Route::get('classrooms/{id}/submissions', [SubmissionController::class, 'byClassroom']);
            Route::get('classrooms/{id}/messages', [MessageController::class, 'index']);
            Route::post('classrooms/{id}/messages', [MessageController::class, 'store']);
        });

        // Coordinator/Admin metrics
        Route::get('coordinator/metrics', [MetricsController::class, 'coordinator']);
        Route::get('admin/metrics', [MetricsController::class, 'admin']);

        // Audit logs (super_admin)
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('admin/content-fingerprints/{contentFingerprint}', [ContentFingerprintController::class, 'show']);
    });
});
