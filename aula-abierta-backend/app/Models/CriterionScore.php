<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CriterionScore extends Model
{
    protected $fillable = ['grade_id', 'criterion_id', 'score'];

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(RubricCriterion::class, 'criterion_id');
    }
}
