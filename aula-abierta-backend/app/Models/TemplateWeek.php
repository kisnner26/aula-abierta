<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateWeek extends Model
{
    protected $fillable = ['template_id', 'number', 'title', 'vocabulary'];

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(TemplateMaterial::class);
    }

    public function courseTasks(): HasMany
    {
        return $this->hasMany(TemplateCourseTask::class);
    }
}
