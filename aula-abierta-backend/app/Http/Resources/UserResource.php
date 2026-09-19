<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sis_id' => $this->sis_id,
            'name' => $this->name,
            'role' => $this->getRoleNames()->first(),
            'avatar_url' => $this->resolvedAvatarUrl(),
            'preferences' => array_merge($this->defaultPreferences(), $this->preferences ?? []),
            'has_signed_nda' => $this->whenLoaded('teacherProfile', fn () => $this->teacherProfile?->has_signed_nda),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
