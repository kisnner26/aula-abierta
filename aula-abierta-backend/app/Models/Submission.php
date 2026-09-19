<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Submission extends Model
{
    protected $fillable = ['course_task_id', 'student_id', 'notes', 'link_url', 'submitted_at'];

    protected function casts(): array
    {
        return ['submitted_at' => 'datetime'];
    }

    public function courseTask(): BelongsTo
    {
        return $this->belongsTo(CourseTask::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function evidenceFiles(): HasMany
    {
        return $this->hasMany(EvidenceFile::class);
    }

    public function grade(): HasOne
    {
        return $this->hasOne(Grade::class);
    }
}
