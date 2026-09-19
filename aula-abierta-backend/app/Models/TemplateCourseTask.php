<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TemplateCourseTask extends Model
{
    protected $fillable = ['template_week_id', 'title', 'description', 'deadline_offset_days', 'is_open'];

    protected function casts(): array
    {
        return ['is_open' => 'boolean'];
    }

    public function templateWeek(): BelongsTo
    {
        return $this->belongsTo(TemplateWeek::class);
    }

    public function rubric(): HasOne
    {
        return $this->hasOne(TemplateRubric::class);
    }
}
