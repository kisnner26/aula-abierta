<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Week extends Model
{
    protected $fillable = [
        'classroom_id', 'number', 'title', 'vocabulary', 'meet_link',
        'session_provider', 'google_event_id', 'google_calendar_url',
        'session_scheduled_at', 'session_is_live', 'session_password',
    ];

    protected function casts(): array
    {
        return [
            'session_scheduled_at' => 'datetime',
            'session_is_live' => 'boolean',
            'session_password' => 'encrypted',
        ];
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }

    public function courseTasks(): HasMany
    {
        return $this->hasMany(CourseTask::class);
    }
}
