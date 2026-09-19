<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    // ── Teacher: start a new quiz session for a classroom ────────────────────
    public function start(Request $request, int $classroomId): JsonResponse
    {
        $user = $request->user();

        $classroom = DB::table('classrooms')
            ->where('id', $classroomId)
            ->where('trainer_id', $user->id)
            ->first();

        if (! $classroom) {
            return response()->json(['message' => 'Classroom not found.'], 404);
        }

        // Close any currently active quiz for this classroom
        DB::table('quiz_sessions')
            ->where('classroom_id', $classroomId)
            ->whereIn('status', ['pending', 'active'])
            ->update(['status' => 'ended', 'ended_at' => now(), 'updated_at' => now()]);

        $quizId = DB::table('quiz_sessions')->insertGetId([
            'classroom_id' => $classroomId,
            'trainer_id'   => $user->id,
            'status'       => 'pending',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(['data' => ['id' => $quizId, 'status' => 'pending']], 201);
    }

    // ── Teacher: add a question to a pending quiz ─────────────────────────────
    public function addQuestion(Request $request, int $quizId): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'question_text' => 'required|string|max:500',
            'options'       => 'required|array|size:4',
            'options.*'     => 'required|string|max:200',
            'correct_index' => 'required|integer|min:0|max:3',
        ]);

        $quiz = DB::table('quiz_sessions')
            ->where('id', $quizId)
            ->where('trainer_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (! $quiz) {
            return response()->json(['message' => 'Quiz not found or already started.'], 404);
        }

        $position = (int) (DB::table('quiz_questions')
            ->where('quiz_session_id', $quizId)
            ->max('position') ?? 0) + 1;

        $questionId = DB::table('quiz_questions')->insertGetId([
            'quiz_session_id' => $quizId,
            'question_text'   => $validated['question_text'],
            'options'         => json_encode(array_values($validated['options'])),
            'correct_index'   => $validated['correct_index'],
            'position'        => $position,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        return response()->json(['data' => ['id' => $questionId, 'position' => $position]], 201);
    }

    // ── Teacher: delete a question from a pending quiz ────────────────────────
    public function deleteQuestion(Request $request, int $quizId, int $questionId): JsonResponse
    {
        $user = $request->user();

        $quiz = DB::table('quiz_sessions')
            ->where('id', $quizId)
            ->where('trainer_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (! $quiz) {
            return response()->json(['message' => 'Quiz not found or already started.'], 404);
        }

        DB::table('quiz_questions')
            ->where('id', $questionId)
            ->where('quiz_session_id', $quizId)
            ->delete();

        return response()->json([], 204);
    }

    // ── Teacher: reveal next question (progresses quiz forward) ───────────────
    public function revealNext(Request $request, int $quizId): JsonResponse
    {
        $user = $request->user();

        $quiz = DB::table('quiz_sessions')
            ->where('id', $quizId)
            ->where('trainer_id', $user->id)
            ->whereIn('status', ['pending', 'active'])
            ->first();

        if (! $quiz) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $next = DB::table('quiz_questions')
            ->where('quiz_session_id', $quizId)
            ->whereNull('revealed_at')
            ->orderBy('position')
            ->first();

        if (! $next) {
            return response()->json(['message' => 'No more questions to reveal.'], 422);
        }

        DB::table('quiz_questions')
            ->where('id', $next->id)
            ->update(['revealed_at' => now(), 'updated_at' => now()]);

        DB::table('quiz_sessions')
            ->where('id', $quizId)
            ->update([
                'status'              => 'active',
                'current_question_id' => $next->id,
                'started_at'          => $quiz->started_at ?? now(),
                'updated_at'          => now(),
            ]);

        return response()->json(['data' => [
            'question_id' => $next->id,
            'position'    => $next->position,
        ]]);
    }

    // ── Teacher: end the quiz ─────────────────────────────────────────────────
    public function end(Request $request, int $quizId): JsonResponse
    {
        $user = $request->user();

        $updated = DB::table('quiz_sessions')
            ->where('id', $quizId)
            ->where('trainer_id', $user->id)
            ->update(['status' => 'ended', 'ended_at' => now(), 'updated_at' => now()]);

        if (! $updated) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        return response()->json(['data' => ['status' => 'ended']]);
    }

    // ── Teacher: full quiz state + leaderboard ────────────────────────────────
    public function trainerState(Request $request, int $quizId): JsonResponse
    {
        $user = $request->user();

        $quiz = DB::table('quiz_sessions')
            ->where('id', $quizId)
            ->where('trainer_id', $user->id)
            ->first();

        if (! $quiz) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $questions = DB::table('quiz_questions')
            ->where('quiz_session_id', $quizId)
            ->orderBy('position')
            ->get()
            ->map(fn ($q) => [
                'id'            => $q->id,
                'question_text' => $q->question_text,
                'options'       => json_decode($q->options),
                'correct_index' => $q->correct_index,
                'position'      => $q->position,
                'revealed'      => ! is_null($q->revealed_at),
                'answer_count'  => DB::table('quiz_answers')
                    ->where('quiz_question_id', $q->id)
                    ->count(),
            ]);

        return response()->json(['data' => [
            'quiz'        => $quiz,
            'questions'   => $questions,
            'leaderboard' => $this->buildLeaderboard((int) $quizId),
        ]]);
    }

    // ── Student: get active quiz for enrolled classrooms ──────────────────────
    public function studentActive(Request $request): JsonResponse
    {
        $user = $request->user();

        $quiz = DB::table('quiz_sessions')
            ->join('enrollments', 'enrollments.classroom_id', '=', 'quiz_sessions.classroom_id')
            ->where('enrollments.student_id', $user->id)
            ->where('enrollments.is_active', true)
            ->where('quiz_sessions.status', 'active')
            ->select('quiz_sessions.*')
            ->first();

        if (! $quiz) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => $this->buildStudentState($quiz, (int) $user->id)]);
    }

    // ── Student: submit an answer ─────────────────────────────────────────────
    public function answer(Request $request, int $quizId): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'question_id'  => 'required|integer',
            'answer_index' => 'required|integer|min:0|max:3',
        ]);

        $quiz = DB::table('quiz_sessions')
            ->join('enrollments', 'enrollments.classroom_id', '=', 'quiz_sessions.classroom_id')
            ->where('quiz_sessions.id', $quizId)
            ->where('enrollments.student_id', $user->id)
            ->where('enrollments.is_active', true)
            ->where('quiz_sessions.status', 'active')
            ->select('quiz_sessions.*')
            ->first();

        if (! $quiz) {
            return response()->json(['message' => 'Quiz not found or not active.'], 404);
        }

        if ($quiz->current_question_id != $validated['question_id']) {
            return response()->json(['message' => 'This question is not currently active.'], 422);
        }

        $question = DB::table('quiz_questions')
            ->where('id', $validated['question_id'])
            ->where('quiz_session_id', $quizId)
            ->first();

        if (! $question) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        // Idempotent — ignore duplicate submissions
        $existing = DB::table('quiz_answers')
            ->where('quiz_question_id', $validated['question_id'])
            ->where('student_id', $user->id)
            ->first();

        if ($existing) {
            return response()->json(['data' => [
                'is_correct'    => (bool) $existing->is_correct,
                'correct_index' => (int) $question->correct_index,
            ]]);
        }

        $isCorrect = (int) $validated['answer_index'] === (int) $question->correct_index;

        DB::table('quiz_answers')->insert([
            'quiz_session_id'  => $quizId,
            'quiz_question_id' => $validated['question_id'],
            'student_id'       => $user->id,
            'answer_index'     => $validated['answer_index'],
            'is_correct'       => $isCorrect,
            'answered_at'      => now(),
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        return response()->json(['data' => [
            'is_correct'    => $isCorrect,
            'correct_index' => (int) $question->correct_index,
        ]]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildStudentState(object $quiz, int $studentId): array
    {
        $currentQuestion = null;
        $alreadyAnswered = false;
        $myAnswerIndex   = null;
        $correctIndex    = null;

        if ($quiz->current_question_id) {
            $q = DB::table('quiz_questions')->where('id', $quiz->current_question_id)->first();
            if ($q) {
                $currentQuestion = [
                    'id'            => $q->id,
                    'question_text' => $q->question_text,
                    'options'       => json_decode($q->options),
                    'position'      => $q->position,
                ];

                $answer = DB::table('quiz_answers')
                    ->where('quiz_question_id', $q->id)
                    ->where('student_id', $studentId)
                    ->first();

                if ($answer) {
                    $alreadyAnswered = true;
                    $myAnswerIndex   = (int) $answer->answer_index;
                    $correctIndex    = (int) $q->correct_index;
                }
            }
        }

        $myScore = DB::table('quiz_answers')
            ->where('quiz_session_id', $quiz->id)
            ->where('student_id', $studentId)
            ->where('is_correct', true)
            ->count();

        return [
            'quiz_id'          => $quiz->id,
            'classroom_id'     => $quiz->classroom_id,
            'status'           => $quiz->status,
            'current_question' => $currentQuestion,
            'already_answered' => $alreadyAnswered,
            'my_answer_index'  => $myAnswerIndex,
            'correct_index'    => $correctIndex,
            'my_score'         => (int) $myScore,
        ];
    }

    private function buildLeaderboard(int $quizId): array
    {
        return DB::table('quiz_answers')
            ->join('users', 'users.id', '=', 'quiz_answers.student_id')
            ->where('quiz_answers.quiz_session_id', $quizId)
            ->where('quiz_answers.is_correct', true)
            ->selectRaw('quiz_answers.student_id, users.name, COUNT(*) as score')
            ->groupBy('quiz_answers.student_id', 'users.name')
            ->orderByDesc('score')
            ->limit(20)
            ->get()
            ->map(fn ($row, $i) => [
                'rank'       => $i + 1,
                'student_id' => $row->student_id,
                'name'       => $row->name,
                'score'      => (int) $row->score,
            ])
            ->toArray();
    }
}
