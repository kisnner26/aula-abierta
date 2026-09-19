<?php

namespace App\Policies;

use App\Models\Material;
use App\Models\User;

class MaterialPolicy
{
    public function viewSignedUrl(User $user, Material $material): bool
    {
        // Trainers cannot download protected material
        if ($user->hasRole('teacher') && $material->is_protected) {
            return false;
        }

        return true;
    }

    public function store(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function destroy(User $user, Material $material): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }
}
