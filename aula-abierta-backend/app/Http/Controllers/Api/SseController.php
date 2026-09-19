<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use App\Models\Message;
use App\Models\Submission;
use App\Models\Grade;
use App\Models\Week;
use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SseController extends Controller
{
    // Single-shot mode: do one DB poll and return immediately.
    // PHP's built-in server is single-worker; holding connections blocks all API requests.
    // EventSource reconnects automatically after `retry` ms — effectively long-polling.
    private const RETRY_MS = 2000;

    public function stream(Request $request): StreamedResponse
    {
        $token = $request->query('token');

        if (! $token) {
            abort(401, 'Missing token');
        }

        $pat = PersonalAccessToken::findToken($token);

        if (! $pat || ! $pat->tokenable) {
            abort(401, 'Invalid token');
        }

        /** @var User $user */
        $user = $pat->tokenable;

        // Cache role check — avoids extra DB round-trips per iteration
        $isTeacher = $user->hasRole('teacher');
        $isStudent = $user->hasRole('student');
        $isFamily  = $user->hasRole('family');

        // Parse cursors: notifId:msgId:subId:gradeId:quizQuestionId:quizAnswerId
        $rawCursor = $request->header('Last-Event-ID') ?? $request->query('cursor', '0:0:0:0:0:0');
        $cursors = $this->parseCursors((string) $rawCursor);

        return response()->stream(
            function () use ($user, $cursors, $isTeacher, $isStudent, $isFamily) {
                while (ob_get_level() > 0) ob_end_flush();
                ob_implicit_flush(true);

                // Tell the client how long to wait before reconnecting.
                echo 'retry: ' . self::RETRY_MS . "\n\n";
                flush();

                // Single poll — return immediately so the PHP worker is freed.
                // EventSource will reconnect after RETRY_MS and carry the Last-Event-ID cursor.
                $events = $this->collectEvents($user->id, $cursors, $isTeacher, $isStudent, $isFamily);

                foreach ($events as $event) {
                    $cursor = implode(':', $cursors);
                    echo "id: {$cursor}\n";
                    echo "event: {$event['type']}\n";
                    echo 'data: ' . json_encode($event) . "\n\n";
                }

                // Heartbeat so the client knows the connection is alive.
                echo ": ping\n\n";
                flush();
            },
            200,
            [
                'Content-Type'      => 'text/event-stream',
                'Cache-Control'     => 'no-cache, no-store',
                'X-Accel-Buffering' => 'no',
                'Connection'        => 'keep-alive',
            ]
        );
    }

    private function collectEvents(int $userId, array &$cursors, bool $isTeacher, bool $isStudent, bool $isFamily = false): array
    {
        $events = [];

        // ── 1. Notifications (all roles) ────────────────────────────────────
        // Index: (user_id, id)
        $notifIds = UserNotification::where('user_id', $userId)
            ->where('id', '>', $cursors[0])
            ->orderBy('id')
            ->pluck('id');

        if ($notifIds->isNotEmpty()) {
            $cursors[0] = $notifIds->last();
            $events[] = ['type' => 'notification', 'count' => $notifIds->count()];
        }

        // ── 2. Messages (all roles) ──────────────────────────────────────────
        // Index: (recipient_id, id)
        $newMessages = Message::select('id', 'classroom_id', 'sender_id')
            ->where('recipient_id', $userId)
            ->where('id', '>', $cursors[1])
            ->orderBy('id')
            ->get();

        if ($newMessages->isNotEmpty()) {
            $cursors[1] = $newMessages->last()->id;
            foreach ($newMessages->groupBy('classroom_id') as $classroomId => $msgs) {
                $events[] = [
                    'type'        => 'message',
                    'classroomId' => (int) $classroomId,
                    'senderId'    => $msgs->first()->sender_id,
                ];
            }
        }

        // ── 3. Teacher: new submissions ──────────────────────────────────────
        // Direct JOIN instead of whereHas chains — single query
        if ($isTeacher) {
            $newSubs = DB::table('submissions')
                ->join('course_tasks', 'course_tasks.id', '=', 'submissions.course_task_id')
                ->join('weeks', 'weeks.id', '=', 'course_tasks.week_id')
                ->join('classrooms', 'classrooms.id', '=', 'weeks.classroom_id')
                ->where('classrooms.trainer_id', $userId)
                ->where('submissions.id', '>', $cursors[2])
                ->orderBy('submissions.id')
                ->select('submissions.id', 'weeks.classroom_id')
                ->get();

            if ($newSubs->isNotEmpty()) {
                $cursors[2] = $newSubs->last()->id;
                foreach ($newSubs->groupBy('classroom_id') as $classroomId => $subs) {
                    $events[] = [
                        'type'        => 'submission',
                        'classroomId' => (int) $classroomId,
                        'count'       => $subs->count(),
                    ];
                }
            }
        }

        // ── 4. Student: new grades ───────────────────────────────────────────
        // Direct JOIN — single query
        if ($isStudent) {
            $newGradeIds = DB::table('grades')
                ->join('submissions', 'submissions.id', '=', 'grades.submission_id')
                ->where('submissions.student_id', $userId)
                ->where('grades.id', '>', $cursors[3])
                ->orderBy('grades.id')
                ->pluck('grades.id');

            if ($newGradeIds->isNotEmpty()) {
                $cursors[3] = $newGradeIds->last();
                $events[] = ['type' => 'grade', 'count' => $newGradeIds->count()];
            }
        }

        // ── 5. Session live-state changes (student + teacher) ────────────────
        // Index: weeks.updated_at — overlap 5s to avoid gaps
        if ($isStudent || $isTeacher) {
            $liveChanges = $this->getSessionChanges($userId, $isStudent, $isTeacher);
            foreach ($liveChanges as $classroomId => $week) {
                $events[] = [
                    'type'        => 'session',
                    'classroomId' => (int) $classroomId,
                    'isLive'      => (bool) $week->session_is_live,
                ];
            }
        }

        // ── 6. Quiz: student sees new question when teacher reveals ───────────
        // cursor[4] = last quiz_question_id the student has seen
        if ($isStudent) {
            $quizQuestion = DB::table('quiz_sessions')
                ->join('enrollments', 'enrollments.classroom_id', '=', 'quiz_sessions.classroom_id')
                ->join('quiz_questions', 'quiz_questions.id', '=', 'quiz_sessions.current_question_id')
                ->where('enrollments.student_id', $userId)
                ->where('enrollments.is_active', true)
                ->where('quiz_sessions.status', 'active')
                ->where('quiz_sessions.current_question_id', '>', $cursors[4])
                ->select(
                    'quiz_sessions.id as quiz_id',
                    'quiz_sessions.classroom_id',
                    'quiz_questions.id as question_id',
                    'quiz_questions.question_text',
                    'quiz_questions.options',
                    'quiz_questions.position',
                )
                ->first();

            if ($quizQuestion) {
                $cursors[4] = $quizQuestion->question_id;
                $events[] = [
                    'type'          => 'quiz_question',
                    'quizId'        => (int) $quizQuestion->quiz_id,
                    'classroomId'   => (int) $quizQuestion->classroom_id,
                    'questionId'    => (int) $quizQuestion->question_id,
                    'questionText'  => $quizQuestion->question_text,
                    'options'       => json_decode($quizQuestion->options),
                    'position'      => (int) $quizQuestion->position,
                ];
            }

            // Notify student when quiz ends
            $endedQuiz = DB::table('quiz_sessions')
                ->join('enrollments', 'enrollments.classroom_id', '=', 'quiz_sessions.classroom_id')
                ->where('enrollments.student_id', $userId)
                ->where('enrollments.is_active', true)
                ->where('quiz_sessions.status', 'ended')
                ->where('quiz_sessions.current_question_id', '>', 0)
                ->whereRaw('quiz_sessions.ended_at >= NOW() - INTERVAL \'10 seconds\'')
                ->select('quiz_sessions.id as quiz_id', 'quiz_sessions.classroom_id')
                ->first();

            if ($endedQuiz) {
                $events[] = [
                    'type'        => 'quiz_ended',
                    'quizId'      => (int) $endedQuiz->quiz_id,
                    'classroomId' => (int) $endedQuiz->classroom_id,
                ];
            }
        }

        // ── 7. Quiz: teacher sees live leaderboard updates as students answer ─
        // cursor[5] = last quiz_answer_id the teacher has seen
        if ($isTeacher) {
            $newAnswers = DB::table('quiz_answers')
                ->join('quiz_sessions', 'quiz_sessions.id', '=', 'quiz_answers.quiz_session_id')
                ->join('classrooms', 'classrooms.id', '=', 'quiz_sessions.classroom_id')
                ->where('classrooms.trainer_id', $userId)
                ->where('quiz_answers.id', '>', $cursors[5])
                ->orderBy('quiz_answers.id')
                ->select('quiz_answers.id', 'quiz_sessions.id as quiz_id')
                ->get();

            if ($newAnswers->isNotEmpty()) {
                $cursors[5] = $newAnswers->last()->id;
                $quizId = $newAnswers->first()->quiz_id;

                // Build live leaderboard
                $leaderboard = DB::table('quiz_answers')
                    ->join('users', 'users.id', '=', 'quiz_answers.student_id')
                    ->where('quiz_answers.quiz_session_id', $quizId)
                    ->where('quiz_answers.is_correct', true)
                    ->selectRaw('quiz_answers.student_id, users.name, COUNT(*) as score')
                    ->groupBy('quiz_answers.student_id', 'users.name')
                    ->orderByDesc('score')
                    ->limit(10)
                    ->get()
                    ->values()
                    ->map(fn ($row, $i) => [
                        'rank'  => $i + 1,
                        'name'  => $row->name,
                        'score' => (int) $row->score,
                    ])
                    ->toArray();

                $events[] = [
                    'type'        => 'quiz_leaderboard',
                    'quizId'      => (int) $quizId,
                    'leaderboard' => $leaderboard,
                ];
            }
        }

        return $events;
    }

    private function getSessionChanges(int $userId, bool $isStudent, bool $isTeacher): \Illuminate\Support\Collection
    {
        // Look back RETRY_MS + 1s to avoid missing events between reconnections.
        $cutoff = now()->subMilliseconds(self::RETRY_MS + 1000);

        if ($isStudent) {
            // Direct JOIN: weeks → classrooms → enrollments
            $rows = DB::table('weeks')
                ->join('enrollments', 'enrollments.classroom_id', '=', 'weeks.classroom_id')
                ->where('enrollments.student_id', $userId)
                ->where('enrollments.is_active', true)
                ->where('weeks.updated_at', '>=', $cutoff)
                ->select('weeks.classroom_id', 'weeks.session_is_live')
                ->get();

            return $rows->keyBy('classroom_id');
        }

        if ($isTeacher) {
            // Direct JOIN: weeks → classrooms where trainer_id = user
            $rows = DB::table('weeks')
                ->join('classrooms', 'classrooms.id', '=', 'weeks.classroom_id')
                ->where('classrooms.trainer_id', $userId)
                ->where('weeks.updated_at', '>=', $cutoff)
                ->select('weeks.classroom_id', 'weeks.session_is_live')
                ->get();

            return $rows->keyBy('classroom_id');
        }

        return collect();
    }

    private function parseCursors(string $raw): array
    {
        $parts = explode(':', $raw);

        return [
            (int) ($parts[0] ?? 0), // notification id
            (int) ($parts[1] ?? 0), // message id
            (int) ($parts[2] ?? 0), // submission id (teacher)
            (int) ($parts[3] ?? 0), // grade id (student)
            (int) ($parts[4] ?? 0), // quiz question id (student)
            (int) ($parts[5] ?? 0), // quiz answer id (teacher)
        ];
    }
}
