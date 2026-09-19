<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'preferences' => ['required', 'array'],
            'preferences.theme' => ['required', Rule::in(['light', 'dark', 'system'])],
            'preferences.keep_signed_in' => ['required', 'boolean'],
            'preferences.notification_messages' => ['required', 'boolean'],
            'preferences.notification_tasks' => ['required', 'boolean'],
            'preferences.notification_grades' => ['required', 'boolean'],
        ];
    }
}
