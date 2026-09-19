<?php

namespace App\Policies;

use App\Models\ContentFingerprint;
use App\Models\User;

class ContentFingerprintPolicy
{
    public function view(User $user, ContentFingerprint $contentFingerprint): bool
    {
        return $user->hasRole('super_admin');
    }
}
