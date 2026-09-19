<?php

namespace App\Http\Requests\Template;

use Illuminate\Foundation\Http\FormRequest;

class UploadTemplateMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'type' => ['required', 'in:slide,document,audio,vocabulary'],
            'is_protected' => ['sometimes', 'boolean'],
            'file' => ['required', 'file', 'mimes:pdf,ppt,pptx,doc,docx,jpg,jpeg,png,webp,mp3,m4a,ogg', 'max:51200'],
        ];
    }
}
