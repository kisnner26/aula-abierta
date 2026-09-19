<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function attempt(string $sisId, string $password): array
    {
        $user = User::where('sis_id', $sisId)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            activity('auth')
                ->withProperties(['sis_id' => $sisId, 'ip' => request()->ip()])
                ->log('login_failed');

            throw ValidationException::withMessages([
                'sis_id' => ['The credentials provided are incorrect.'],
            ]);
        }

        activity('auth')
            ->causedBy($user)
            ->withProperties(['ip' => request()->ip()])
            ->log('login_succeeded');

        // Revoke previous tokens to enforce single active session per user
        $user->tokens()->delete();

        $accessToken = $user->createToken('access', ['*'], now()->addMinutes((int) config('sanctum.token_expiration', 15)));
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays((int) config('sanctum.refresh_expiration_days', 30)));

        return [
            'user' => $user->load('teacherProfile'),
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $refreshToken->plainTextToken,
        ];
    }

    public function refresh(string $refreshToken): array
    {
        if (! str_contains($refreshToken, '|')) {
            throw ValidationException::withMessages(['refresh_token' => ['Invalid refresh token.']]);
        }

        [$id, $token] = explode('|', $refreshToken, 2);

        $tokenModel = PersonalAccessToken::find($id);

        if (
            ! $tokenModel
            || ! hash_equals($tokenModel->token, hash('sha256', $token))
            || ! $tokenModel->can('refresh')
        ) {
            throw ValidationException::withMessages(['refresh_token' => ['Invalid refresh token.']]);
        }

        if ($tokenModel->expires_at !== null && $tokenModel->expires_at->isPast()) {
            $tokenModel->delete();

            throw ValidationException::withMessages(['refresh_token' => ['Refresh token has expired.']]);
        }

        $user = $tokenModel->tokenable;

        $tokenModel->delete();

        $newAccess = $user->createToken('access', ['*'], now()->addMinutes((int) config('sanctum.token_expiration', 15)));
        $newRefresh = $user->createToken('refresh', ['refresh'], now()->addDays((int) config('sanctum.refresh_expiration_days', 30)));

        return [
            'access_token' => $newAccess->plainTextToken,
            'refresh_token' => $newRefresh->plainTextToken,
        ];
    }

    public function logout(User $user): void
    {
        activity('auth')
            ->causedBy($user)
            ->withProperties(['ip' => request()->ip()])
            ->log('logout');

        $user->currentAccessToken()->delete();
    }

    public function issueSession(User $user, string $name = 'access'): array
    {
        $accessToken = $user->createToken($name, ['*'], now()->addMinutes((int) config('sanctum.token_expiration', 15)));
        $refreshToken = $user->createToken("{$name}-refresh", ['refresh'], now()->addDays((int) config('sanctum.refresh_expiration_days', 30)));

        return [
            'user' => $user->load('teacherProfile'),
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $refreshToken->plainTextToken,
        ];
    }
}
