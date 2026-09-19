<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserNotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => UserNotificationResource::collection(
                $this->notificationService->forUser($request->user()),
            ),
        ]);
    }

    public function markRead(Request $request, int $notificationId): JsonResponse
    {
        $notification = $this->notificationService->markRead($request->user(), $notificationId);

        return response()->json(['data' => new UserNotificationResource($notification)]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $updated = $this->notificationService->markAllRead($request->user());

        return response()->json(['data' => ['updated' => $updated]]);
    }

    public function destroy(Request $request, int $notificationId): JsonResponse
    {
        $this->notificationService->delete($request->user(), $notificationId);

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        $deleted = $this->notificationService->deleteAll($request->user());

        return response()->json(['data' => ['deleted' => $deleted]]);
    }
}
