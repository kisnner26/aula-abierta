<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface ProfileRepositoryInterface
{
    public function update(User $user, array $attributes): User;
}
