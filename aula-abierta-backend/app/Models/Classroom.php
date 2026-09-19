<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classroom extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'template_id', 'level_id', 'trainer_id',
        'name', 'academic_period', 'starts_at', 'ends_at', 'is_active',
        'theme_primary_color', 'theme_accent_color', 'hero_background', 'welcome_message',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'starts_at' => 'date',
            'ends_at' => 'date',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function weeks(): HasMany
    {
        return $this->hasMany(Week::class)->orderBy('number');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function accessPasses(): HasMany
    {
        return $this->hasMany(ClassroomAccessPass::class);
    }

    public function getEnrollmentCountAttribute(): int
    {
        return $this->enrollments()->where('is_active', true)->count();
    }
}
