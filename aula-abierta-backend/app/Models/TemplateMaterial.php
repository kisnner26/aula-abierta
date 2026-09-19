<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateMaterial extends Model
{
    protected $fillable = ['template_week_id', 'title', 'type', 'is_protected', 'storage_path', 'external_url'];

    protected $hidden = ['storage_path'];

    protected function casts(): array
    {
        return ['is_protected' => 'boolean'];
    }

    public function templateWeek(): BelongsTo
    {
        return $this->belongsTo(TemplateWeek::class);
    }
}
