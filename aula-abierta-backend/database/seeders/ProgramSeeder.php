<?php

namespace Database\Seeders;

use App\Models\Level;
use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            [
                'name' => 'Basic English for Kids', 'code' => 'BEFK',
                'level_count' => 5, 'weeks_per_level' => 14,
                'levels' => ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
            ],
            [
                'name' => 'Fast English for Students', 'code' => 'FES',
                'level_count' => 3, 'weeks_per_level' => 16,
                'levels' => ['Step 1', 'Step 2', 'Step 3'],
            ],
            [
                'name' => 'Teen English for Students', 'code' => 'TES',
                'level_count' => 5, 'weeks_per_level' => 14,
                'levels' => ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'],
            ],
            [
                'name' => 'CoLab Programación', 'code' => 'COLAB',
                'level_count' => 5, 'weeks_per_level' => 12,
                'levels' => ['Scratch', 'HTML/CSS', 'JavaScript', 'Python Basics', 'Python Projects'],
            ],
        ];

        foreach ($programs as $pd) {
            $program = Program::firstOrCreate(
                ['code' => $pd['code']],
                [
                    'name' => $pd['name'],
                    'level_count' => $pd['level_count'],
                    'weeks_per_level' => $pd['weeks_per_level'],
                    'is_active' => true,
                ],
            );

            foreach ($pd['levels'] as $order => $levelName) {
                Level::firstOrCreate(
                    ['program_id' => $program->id, 'order' => $order + 1],
                    ['name' => $levelName],
                );
            }
        }
    }
}
