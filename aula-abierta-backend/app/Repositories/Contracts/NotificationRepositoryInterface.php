<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Collection;

interface NotificationRepositoryInterface
{
    public function forUser(User $user, int $limit = 30): Collection;

    public function findForUser(User $user, int $notificationId): UserNotification;

    public function create(array $attributes): UserNotification;

    public function markRead(UserNotification $notification): UserNotification;

    public function markAllRead(User $user): int;

    public function delete(UserNotification $notification): void;

    public function deleteAll(User $user): int;
}
