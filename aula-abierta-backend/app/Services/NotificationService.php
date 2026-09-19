<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserNotification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Support\Collection;

class NotificationService
{
    public function __construct(private readonly NotificationRepositoryInterface $notifications) {}

    public function forUser(User $user): Collection
    {
        return $this->notifications->forUser($user);
    }

    public function send(User $recipient, string $type, string $title, string $body, ?string $actionUrl = null, array $metadata = []): ?UserNotification
    {
        $preferences = array_merge(User::defaultPreferences(), $recipient->preferences ?? []);
        $preferenceKey = match ($type) {
            'message' => 'notification_messages',
            'grade' => 'notification_grades',
            'task', 'submission' => 'notification_tasks',
            default => null,
        };

        if ($preferenceKey && ! $preferences[$preferenceKey]) {
            return null;
        }

        return $this->notifications->create([
            'user_id' => $recipient->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'action_url' => $actionUrl,
            'metadata' => $metadata ?: null,
        ]);
    }

    public function markRead(User $user, int $notificationId): UserNotification
    {
        return $this->notifications->markRead(
            $this->notifications->findForUser($user, $notificationId),
        );
    }

    public function markAllRead(User $user): int
    {
        return $this->notifications->markAllRead($user);
    }

    public function delete(User $user, int $notificationId): void
    {
        $this->notifications->delete(
            $this->notifications->findForUser($user, $notificationId),
        );
    }

    public function deleteAll(User $user): int
    {
        return $this->notifications->deleteAll($user);
    }
}
