<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Material extends Model
{
    protected $fillable = ['week_id', 'title', 'type', 'is_protected', 'storage_path', 'external_url'];

    protected $hidden = ['storage_path']; // Never expose the raw R2 key to any response

    protected function casts(): array
    {
        return ['is_protected' => 'boolean'];
    }

    public function week(): BelongsTo
    {
        return $this->belongsTo(Week::class);
    }
}
