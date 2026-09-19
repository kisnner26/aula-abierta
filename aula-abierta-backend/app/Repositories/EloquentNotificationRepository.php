<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\UserNotification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentNotificationRepository implements NotificationRepositoryInterface
{
    public function forUser(User $user, int $limit = 30): Collection
    {
        return UserNotification::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function findForUser(User $user, int $notificationId): UserNotification
    {
        return UserNotification::query()
            ->where('user_id', $user->id)
            ->findOrFail($notificationId);
    }

    public function create(array $attributes): UserNotification
    {
        return UserNotification::create($attributes);
    }

    public function markRead(UserNotification $notification): UserNotification
    {
        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return $notification->refresh();
    }

    public function markAllRead(User $user): int
    {
        return UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function delete(UserNotification $notification): void
    {
        $notification->delete();
    }

    public function deleteAll(User $user): int
    {
        return UserNotification::query()
            ->where('user_id', $user->id)
            ->delete();
    }
}
