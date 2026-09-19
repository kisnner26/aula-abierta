<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\ProfileRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProfileService
{
    public function __construct(private readonly ProfileRepositoryInterface $profiles) {}

    public function update(User $user, array $attributes): User
    {
        $preferences = array_merge(User::defaultPreferences(), $attributes['preferences']);

        return $this->profiles->update($user, [
            'name' => $attributes['name'],
            'preferences' => $preferences,
        ]);
    }

    public function updateAvatar(User $user, UploadedFile $avatar): User
    {
        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $avatar->store("avatars/{$user->id}", 'public');

        return $this->profiles->update($user, [
            'avatar_path' => $path,
            'avatar_url' => null,
        ]);
    }

    public function removeAvatar(User $user): User
    {
        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        return $this->profiles->update($user, [
            'avatar_path' => null,
            'avatar_url' => null,
        ]);
    }
}
