<?php

namespace App\Http\Requests\LearningVideo;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLearningVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'super_admin']) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:1000'],
            'youtube_url' => ['sometimes', 'url', 'max:2048', 'regex:/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
