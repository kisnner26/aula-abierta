<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    protected $fillable = ['program_id', 'name', 'order'];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function templates(): HasMany
    {
        return $this->hasMany(Template::class);
    }

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class);
    }

    public function learningVideos(): HasMany
    {
        return $this->hasMany(LearningVideo::class);
    }
}
