<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RubricCriterion extends Model
{
    protected $fillable = ['rubric_id', 'name', 'description', 'max_score', 'order'];

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(Rubric::class);
    }
}
