<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LearningVideoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'program_id' => $this->program_id,
            'level_id' => $this->level_id,
            'title' => $this->title,
            'description' => $this->description,
            'youtube_url' => $this->youtube_url,
            'embed_url' => $this->embedUrl(),
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }

    private function embedUrl(): string
    {
        $parts = parse_url($this->youtube_url);
        $videoId = null;

        if (($parts['host'] ?? '') === 'youtu.be') {
            $videoId = trim($parts['path'] ?? '', '/');
        } else {
            parse_str($parts['query'] ?? '', $query);
            $videoId = $query['v'] ?? null;
            if (! $videoId && str_contains($parts['path'] ?? '', '/embed/')) {
                $videoId = basename($parts['path']);
            }
        }

        return 'https://www.youtube-nocookie.com/embed/'.rawurlencode((string) $videoId).'?rel=0';
    }
}
