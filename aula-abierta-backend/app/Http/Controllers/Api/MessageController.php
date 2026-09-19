<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Message;
use App\Models\User;
use App\Http\Resources\ClassroomResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    // GET /student/classrooms/{classroomId}/messages
    // GET /trainer/classrooms/{classroomId}/messages
    public function index(Request $request, int $classroomId): JsonResponse
    {
        $user = $request->user();
        $classroom = Classroom::findOrFail($classroomId);

        $this->authorizeClassroomAccess($user, $classroom);

        $beforeId = $request->integer('before_id') ?: null;
        $messages = Message::where('classroom_id', $classroomId)
            ->where(fn ($q) => $q->where('sender_id', $user->id)
                ->orWhere('recipient_id', $user->id)
            )
            ->when($beforeId, fn ($query) => $query->where('id', '<', $beforeId))
            ->with(['sender:id,name,avatar_url', 'recipient:id,name,avatar_url'])
            ->latest('id')
            ->limit(80)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($m) => [
                'id' => $m->id,
                'from' => $m->sender_id === $user->id ? 'me' : 'other',
                'sender_id' => $m->sender_id,
                'sender_name' => $m->sender->name,
                'body' => $m->body,
                'read_at' => $m->read_at?->toISOString(),
                'timestamp' => $m->created_at->toISOString(),
            ]);

        // Mark incoming as read
        Message::where('classroom_id', $classroomId)
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => $messages,
            'meta' => [
                'has_more' => $messages->count() === 80,
                'oldest_id' => $messages->first()['id'] ?? null,
            ],
        ]);
    }

    // POST /classrooms/{classroomId}/messages
    public function store(Request $request, int $classroomId): JsonResponse
    {
        $user = $request->user();
        $classroom = Classroom::findOrFail($classroomId);

        $this->authorizeClassroomAccess($user, $classroom);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        // Students can only send to their classroom's trainer; trainers reply to students
        if ($user->hasRole('student')) {
            abort_unless($data['recipient_id'] === $classroom->trainer_id, 403, 'You can only message your trainer.');
        }

        if ($user->hasRole('teacher')) {
            $isEnrolled = $classroom->enrollments()
                ->where('student_id', $data['recipient_id'])
                ->where('is_active', true)
                ->exists();
            abort_unless($isEnrolled, 403, 'Recipient is not enrolled in this classroom.');
        }

        $message = Message::create([
            'classroom_id' => $classroomId,
            'sender_id' => $user->id,
            'recipient_id' => $data['recipient_id'],
            'body' => $data['body'],
        ]);

        $message->load('sender:id,name,avatar_url');

        $recipient = User::findOrFail($data['recipient_id']);
        $actionUrl = $recipient->hasRole('teacher')
            ? "/trainer/classrooms/{$classroomId}/messages"
            : "/student/classrooms/{$classroomId}/messages";

        $this->notificationService->send(
            $recipient,
            'message',
            "New message from {$user->name}",
            str($message->body)->limit(140)->toString(),
            $actionUrl,
            ['classroom_id' => $classroomId, 'message_id' => $message->id],
        );

        return response()->json([
            'data' => [
                'id' => $message->id,
                'from' => 'me',
                'sender_id' => $message->sender_id,
                'sender_name' => $message->sender->name,
                'body' => $message->body,
                'read_at' => null,
                'timestamp' => $message->created_at->toISOString(),
            ],
        ], 201);
    }

    public function inbox(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('student'), 403);

        $classrooms = Classroom::query()
            ->whereHas('enrollments', fn ($query) => $query->where('student_id', $user->id)->where('is_active', true))
            ->whereNotNull('trainer_id')
            ->with('level.program')
            ->orderBy('name')
            ->get();

        $messages = Message::query()
            ->whereIn('classroom_id', $classrooms->pluck('id'))
            ->where(fn ($query) => $query->where('sender_id', $user->id)->orWhere('recipient_id', $user->id))
            ->latest('id')
            ->get(['id', 'classroom_id', 'sender_id', 'recipient_id', 'body', 'read_at', 'created_at']);

        $latest = $messages->groupBy('classroom_id')->map->first();
        $unread = $messages->where('recipient_id', $user->id)->whereNull('read_at')->groupBy('classroom_id')->map->count();

        return response()->json(['data' => $classrooms->map(function ($classroom) use ($latest, $unread, $request, $user) {
            $message = $latest->get($classroom->id);

            return [
                'classroom' => (new ClassroomResource($classroom))->resolve($request),
                'latest_message' => $message ? [
                    'id' => $message->id,
                    'from' => $message->sender_id === $user->id ? 'me' : 'other',
                    'body' => $message->body,
                    'read_at' => $message->read_at?->toISOString(),
                    'timestamp' => $message->created_at->toISOString(),
                ] : null,
                'unread_count' => (int) ($unread->get($classroom->id) ?? 0),
            ];
        })->values()]);
    }

    private function authorizeClassroomAccess(User $user, Classroom $classroom): void
    {
        if ($user->hasRole('student')) {
            $enrolled = $classroom->enrollments()
                ->where('student_id', $user->id)
                ->where('is_active', true)
                ->exists();
            abort_unless($enrolled, 403);
        }

        if ($user->hasRole('teacher')) {
            abort_unless($classroom->trainer_id === $user->id, 403);
        }
    }
}
