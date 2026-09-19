<?php

namespace Tests\Feature;

use App\Models\Level;
use App\Models\Program;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TemplateClassroomCopyTest extends TestCase
{
    use DatabaseTransactions;

    public function test_coordinator_builds_template_and_trainer_personalizes_classroom_copy(): void
    {
        Role::findOrCreate('admin', 'web');
        Role::findOrCreate('teacher', 'web');

        $coordinator = User::create(['sis_id' => 'TEST-COORD-TPL', 'name' => 'Coordinator', 'password' => 'secret-password']);
        $coordinator->assignRole('admin');
        $trainer = User::create(['sis_id' => 'TEST-TRAINER-TPL', 'name' => 'Trainer', 'password' => 'secret-password']);
        $trainer->assignRole('teacher');

        $program = Program::create(['name' => 'Template Program', 'code' => 'TPL']);
        $level = Level::create(['program_id' => $program->id, 'name' => 'Level 1', 'order' => 1]);
        $template = Template::create([
            'level_id' => $level->id,
            'created_by' => $coordinator->id,
            'title' => 'Official Level 1 Template',
            'is_frozen' => false,
        ]);

        $this->actingAs($coordinator, 'sanctum')
            ->postJson("/api/v1/templates/{$template->id}/weeks", [
                'number' => 1,
                'title' => 'Greetings Harbor',
                'vocabulary' => 'hello:hola, friend:amigo',
                'materials' => [
                    ['title' => 'Official slides', 'type' => 'slide', 'is_protected' => true],
                    ['title' => 'Practice game', 'type' => 'link', 'is_protected' => false, 'external_url' => 'https://example.com/game'],
                ],
                'tasks' => [
                    ['title' => 'Greeting mission', 'description' => 'Record a short greeting.', 'deadline_offset_days' => 7],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.weeks.0.title', 'Greetings Harbor')
            ->assertJsonCount(2, 'data.weeks.0.materials');

        $classroomId = $this->actingAs($coordinator, 'sanctum')
            ->postJson("/api/v1/templates/{$template->id}/clone", [
                'classroom_name' => 'TPL Level 1 Group A',
                'academic_period' => 'TEST',
                'trainer_id' => $trainer->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.trainer_id', $trainer->id)
            ->json('data.id');

        $this->assertDatabaseHas('weeks', ['classroom_id' => $classroomId, 'number' => 1, 'title' => 'Greetings Harbor']);
        $this->assertDatabaseHas('materials', ['title' => 'Official slides', 'is_protected' => true]);
        $this->assertDatabaseHas('course_tasks', ['title' => 'Greeting mission']);

        $this->actingAs($trainer, 'sanctum')
            ->patchJson("/api/v1/classrooms/{$classroomId}/theme", [
                'theme_primary_color' => '#D31A2A',
                'theme_accent_color' => '#1D95FB',
                'hero_background' => 'coding-lab',
                'welcome_message' => 'Today we build confidence with English and code.',
            ])
            ->assertOk()
            ->assertJsonPath('data.theme.hero_background', 'coding-lab');

        $this->assertDatabaseHas('templates', ['id' => $template->id, 'title' => 'Official Level 1 Template']);
        $this->assertDatabaseHas('classrooms', ['id' => $classroomId, 'hero_background' => 'coding-lab']);
    }
}
