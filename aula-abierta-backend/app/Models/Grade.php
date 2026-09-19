<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grade extends Model
{
    protected $fillable = [
        'submission_id', 'graded_by', 'numeric_score',
        'letter_grade', 'feedback', 'graded_at',
    ];

    protected function casts(): array
    {
        return ['graded_at' => 'datetime'];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function gradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    public function criterionScores(): HasMany
    {
        return $this->hasMany(CriterionScore::class);
    }
}
