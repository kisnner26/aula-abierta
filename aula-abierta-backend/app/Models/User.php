<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\Traits\CausesActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use CausesActivity, HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = ['sis_id', 'name', 'password', 'avatar_url', 'avatar_path', 'preferences'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'preferences' => 'array',
        ];
    }

    public static function defaultPreferences(): array
    {
        return [
            'theme' => 'system',
            'keep_signed_in' => true,
            'notification_messages' => true,
            'notification_tasks' => true,
            'notification_grades' => true,
        ];
    }

    public function resolvedAvatarUrl(): ?string
    {
        if ($this->avatar_path) {
            $base = Storage::disk('public')->url($this->avatar_path);
            $v    = $this->updated_at?->timestamp ?? time();
            return "{$base}?v={$v}";
        }

        return $this->avatar_url;
    }

    public function teacherProfile(): HasOne
    {
        return $this->hasOne(TeacherProfile::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'student_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'student_id');
    }

    public function taughtClassrooms(): HasMany
    {
        return $this->hasMany(Classroom::class, 'trainer_id');
    }
}
