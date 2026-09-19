<?php

namespace App\Http\Requests\Grade;

use Illuminate\Foundation\Http\FormRequest;

class StoreGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'submission_id' => ['required', 'integer', 'exists:submissions,id'],
            'criterion_scores' => ['required', 'array', 'min:1'],
            'criterion_scores.*' => ['required', 'array:criterion_id,score'],
            'criterion_scores.*.criterion_id' => ['required', 'integer', 'distinct', 'exists:rubric_criteria,id'],
            'criterion_scores.*.score' => ['required', 'integer', 'min:0'],
            'feedback' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
