<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\ProfileRepositoryInterface;

class EloquentProfileRepository implements ProfileRepositoryInterface
{
    public function update(User $user, array $attributes): User
    {
        $user->update($attributes);

        return $user->refresh()->load('teacherProfile');
    }
}
