<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateRubricCriterion extends Model
{
    protected $fillable = ['template_rubric_id', 'name', 'description', 'max_score', 'order'];

    public function templateRubric(): BelongsTo
    {
        return $this->belongsTo(TemplateRubric::class);
    }
}
