<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentFingerprint extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'material_id',
        'user_id',
        'user_reference',
        'material_reference',
        'role',
        'session_hash',
        'pixel_tag',
        'payload_hash',
        'signed_payload',
        'mime_type',
        'storage_path',
        'accessed_at',
        'expires_at',
    ];

    protected $hidden = ['session_hash', 'signed_payload', 'storage_path'];

    protected function casts(): array
    {
        return [
            'accessed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
