<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Template extends Model
{
    use SoftDeletes;

    protected $fillable = ['level_id', 'created_by', 'title', 'cover_image_path', 'cover_image_mime', 'is_frozen'];

    protected $hidden = ['cover_image_path'];

    protected function casts(): array
    {
        return ['is_frozen' => 'boolean'];
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class);
    }

    public function weeks(): HasMany
    {
        return $this->hasMany(TemplateWeek::class)->orderBy('number');
    }

    public function getWeeksCountAttribute(): int
    {
        return $this->weeks()->count();
    }
}
