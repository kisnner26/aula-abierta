<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateRubric extends Model
{
    protected $fillable = ['template_course_task_id', 'title'];

    public function templateCourseTask(): BelongsTo
    {
        return $this->belongsTo(TemplateCourseTask::class);
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(TemplateRubricCriterion::class)->orderBy('order');
    }
}
