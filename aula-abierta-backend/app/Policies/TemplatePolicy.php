<?php

namespace App\Policies;

use App\Models\Template;
use App\Models\User;

class TemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function view(User $user, Template $template): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function update(User $user, Template $template): bool
    {
        // Frozen templates cannot be edited
        if ($template->is_frozen) {
            return false;
        }

        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function clone(User $user, Template $template): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function freeze(User $user, Template $template): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function delete(User $user, Template $template): bool
    {
        // Academic coordination (admin) and super administrators may delete templates.
        return $user->hasAnyRole(['admin', 'super_admin']);
    }
}
