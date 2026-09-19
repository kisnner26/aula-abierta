<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    private const PRIVILEGED_ROLES = ['admin', 'super_admin'];

    public function create(User $actor): bool
    {
        return $actor->hasAnyRole(self::PRIVILEGED_ROLES);
    }

    public function update(User $actor, User $target): bool
    {
        return $this->canManage($actor, $target);
    }

    public function delete(User $actor, User $target): bool
    {
        if ($actor->id === $target->id) {
            return false;
        }

        return $this->canManage($actor, $target);
    }

    // super_admin manages everyone; admin (coordinator) only non-privileged accounts.
    private function canManage(User $actor, User $target): bool
    {
        if ($actor->hasRole('super_admin')) {
            return true;
        }

        return $actor->hasRole('admin') && ! $target->hasAnyRole(self::PRIVILEGED_ROLES);
    }
}
