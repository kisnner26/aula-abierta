<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvidenceFile extends Model
{
    protected $fillable = ['submission_id', 'filename', 'mime_type', 'storage_path', 'size_bytes'];

    protected $hidden = ['storage_path']; // Raw R2 key never leaves the server

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }
}
