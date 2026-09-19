<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LevelResource;
use App\Http\Resources\ProgramResource;
use App\Models\Level;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function index(): JsonResponse
    {
        $programs = Program::withCount('levels')->orderBy('name')->get();

        return response()->json(['data' => ProgramResource::collection($programs)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'code' => ['required', 'string', 'max:20', 'unique:programs,code'],
            'level_count' => ['required', 'integer', 'min:1', 'max:20'],
            'weeks_per_level' => ['required', 'integer', 'min:1', 'max:52'],
        ]);

        $program = Program::create([...$data, 'is_active' => true]);

        // Auto-create levels
        for ($i = 1; $i <= $program->level_count; $i++) {
            Level::create(['program_id' => $program->id, 'name' => "Level {$i}", 'order' => $i]);
        }

        return response()->json(['data' => new ProgramResource($program->load('levels'))], 201);
    }

    public function levels(Program $program): JsonResponse
    {
        return response()->json(['data' => LevelResource::collection($program->levels)]);
    }
}
