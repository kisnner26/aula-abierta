<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WeekResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'classroom_id' => $this->classroom_id,
            'number' => $this->number,
            'title' => $this->title,
            'vocabulary' => $this->vocabulary,
            'session' => [
                'week_id' => $this->id,
                'meet_link' => $this->meet_link,
                'provider' => $this->session_provider ?: 'google_meet',
                'google_event_id' => $request->user()?->hasAnyRole(['teacher', 'admin', 'super_admin']) ? $this->google_event_id : null,
                'google_calendar_url' => $request->user()?->hasAnyRole(['teacher', 'admin', 'super_admin']) ? $this->google_calendar_url : null,
                'session_scheduled_at' => $this->session_scheduled_at?->toISOString(),
                'session_is_live' => (bool) $this->session_is_live,
            ],
            'materials' => MaterialResource::collection($this->whenLoaded('materials')),
            'tasks' => CourseTaskResource::collection($this->whenLoaded('courseTasks')),
        ];
    }
}
