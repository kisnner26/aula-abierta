<?php

namespace App\Http\Requests\Template;

use Illuminate\Foundation\Http\FormRequest;

class UploadTemplateCoverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['cover' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:6144']];
    }
}
