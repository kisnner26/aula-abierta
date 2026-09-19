<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseTask extends Model
{
    use SoftDeletes;

    protected $fillable = ['week_id', 'title', 'description', 'deadline', 'is_open'];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'deadline' => 'datetime',
        ];
    }

    public function week(): BelongsTo
    {
        return $this->belongsTo(Week::class);
    }

    public function rubric(): HasOne
    {
        return $this->hasOne(Rubric::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function isClosed(): bool
    {
        return ! $this->is_open || $this->deadline->isPast();
    }
}
