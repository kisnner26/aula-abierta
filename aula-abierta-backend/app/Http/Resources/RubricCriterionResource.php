<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RubricCriterionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rubric_id' => $this->rubric_id,
            'name' => $this->name,
            'description' => $this->description,
            'max_score' => $this->max_score,
            'order' => $this->order,
        ];
    }
}
