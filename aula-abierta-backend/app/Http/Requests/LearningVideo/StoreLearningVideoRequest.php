<?php

namespace App\Http\Requests\LearningVideo;

use Illuminate\Foundation\Http\FormRequest;

class StoreLearningVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'super_admin']) ?? false;
    }

    public function rules(): array
    {
        return [
            'program_id' => ['required', 'integer', 'exists:programs,id'],
            'level_id' => ['required', 'integer', 'exists:levels,id'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:1000'],
            'youtube_url' => ['required', 'url', 'max:2048', 'regex:/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
