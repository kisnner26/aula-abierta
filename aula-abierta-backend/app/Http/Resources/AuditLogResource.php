<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $causer = $this->causer;

        return [
            'id' => $this->id,
            'user_id' => $this->causer_id,
            'user_name' => $causer?->name ?? 'System',
            'category' => $this->log_name ?? 'default',
            'action' => $this->description,
            'entity_type' => class_basename($this->subject_type ?? ''),
            'entity_id' => $this->subject_id,
            'metadata' => $this->properties->toArray(),
            'ip_address' => $this->properties->get('ip', '—'),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
