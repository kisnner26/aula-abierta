<?php

namespace App\Http\Requests\Week;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWeekSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // Only Google Meet links are accepted — Jitsi and other providers are rejected.
            'meet_link' => ['nullable', 'url', 'max:2048', 'regex:#^https://meet\.google\.com/#i'],
            'session_scheduled_at' => ['nullable', 'date'],
            'session_is_live' => ['sometimes', 'boolean'],
            'create_google_meet' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'meet_link.regex' => 'The link must be a Google Meet URL (https://meet.google.com/...).',
        ];
    }
}
