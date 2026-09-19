<?php

namespace App\Services;

use App\Models\Classroom;
use App\Models\ClassroomAccessPass;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ClassroomAccessPassService
{
    public function __construct(private readonly AuthService $authService) {}

    public function create(Classroom $classroom, User $student, User $creator): array
    {
        abort_unless($creator->hasAnyRole(['admin', 'super_admin']), 403);
        abort_unless($classroom->enrollments()->where('student_id', $student->id)->where('is_active', true)->exists(), 422, 'Student is not actively enrolled in this classroom.');

        $plainToken = Str::random(64);
        $pass = ClassroomAccessPass::create([
            'classroom_id' => $classroom->id,
            'student_id' => $student->id,
            'created_by' => $creator->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addMinutes(10),
        ]);

        activity()->causedBy($creator)->performedOn($classroom)->withProperties([
            'student_id' => $student->id,
            'access_pass_id' => $pass->id,
            'expires_at' => $pass->expires_at,
        ])->log('classroom_qr_access_created');

        return [
            'token' => $plainToken,
            'access_url' => rtrim((string) config('app.frontend_url', 'http://127.0.0.1:5173'), '/')."/qr-access?token={$plainToken}",
            'expires_at' => $pass->expires_at->toISOString(),
        ];
    }

    public function redeem(string $plainToken): array
    {
        return DB::transaction(function () use ($plainToken) {
            $pass = ClassroomAccessPass::where('token_hash', hash('sha256', $plainToken))->lockForUpdate()->first();

            if (! $pass || $pass->used_at || $pass->expires_at->isPast()) {
                throw ValidationException::withMessages(['token' => ['This classroom access code is invalid or has expired.']]);
            }

            $pass->update(['used_at' => now()]);
            $tokens = $this->authService->issueSession($pass->student, 'qr-classroom-access');

            return [...$tokens, 'classroom_id' => $pass->classroom_id];
        });
    }
}
