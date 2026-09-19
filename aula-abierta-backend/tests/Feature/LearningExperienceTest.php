<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\CourseTask;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Program;
use App\Models\Template;
use App\Models\User;
use App\Models\Week;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LearningExperienceTest extends TestCase
{
    use DatabaseTransactions;

    public function test_trainer_can_schedule_week_session_and_student_receives_journey_state(): void
    {
        [$trainer, $student, $classroom, $firstWeek, $secondWeek] = $this->learningContext();

        $this->actingAs($trainer, 'sanctum')
            ->patchJson("/api/v1/classrooms/{$classroom->id}/weeks/{$firstWeek->id}/session", [
                'session_scheduled_at' => now()->addDay()->toISOString(),
                'meet_link' => 'https://meet.google.com/abc-defg-hij',
                'session_is_live' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.provider', 'google_meet')
            ->assertJsonPath('data.meet_link', 'https://meet.google.com/abc-defg-hij')
            ->assertJsonPath('data.session_is_live', true);

        $this->actingAs($student, 'sanctum')
            ->getJson("/api/v1/student/classrooms/{$classroom->id}/journey")
            ->assertOk()
            ->assertJsonPath('data.weeks.0.state', 'current')
            ->assertJsonPath('data.weeks.1.state', 'locked')
            ->assertJsonPath('data.progress.total_weeks', 14)
            ->assertJsonPath('data.motivation.pending_tasks', 2)
            ->assertJsonPath('data.weeks.0.session.session_is_live', true);
    }

    public function test_coordinator_can_create_one_time_qr_pass_and_student_can_redeem_it_once(): void
    {
        [, $student, $classroom] = $this->learningContext();
        Role::findOrCreate('admin', 'web');
        $coordinator = User::create(['sis_id' => 'TEST-COORD-QR', 'name' => 'Coordinator', 'password' => 'secret-password']);
        $coordinator->assignRole('admin');

        $response = $this->actingAs($coordinator, 'sanctum')
            ->postJson("/api/v1/classrooms/{$classroom->id}/access-passes", ['student_id' => $student->id])
            ->assertCreated();

        $token = $response->json('data.token');
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/v1/auth/qr-access', ['token' => $token])
            ->assertOk()
            ->assertJsonPath('data.user.id', $student->id)
            ->assertJsonPath('data.classroom_id', $classroom->id);

        $this->postJson('/api/v1/auth/qr-access', ['token' => $token])->assertUnprocessable();
    }

    private function learningContext(): array
    {
        Role::findOrCreate('teacher', 'web');
        Role::findOrCreate('student', 'web');
        $trainer = User::create(['sis_id' => 'TEST-TRAINER-LEARN', 'name' => 'Trainer', 'password' => 'secret-password']);
        $trainer->assignRole('teacher');
        $student = User::create(['sis_id' => 'TEST-STUDENT-LEARN', 'name' => 'Student', 'password' => 'secret-password']);
        $student->assignRole('student');
        $program = Program::create(['name' => 'Basic English', 'code' => 'BEFK-TEST', 'weeks_per_level' => 14]);
        $level = Level::create(['program_id' => $program->id, 'name' => 'Level 1', 'order' => 1]);
        $template = Template::create(['level_id' => $level->id, 'created_by' => $trainer->id, 'title' => 'Template', 'is_frozen' => true]);
        $classroom = Classroom::create(['template_id' => $template->id, 'level_id' => $level->id, 'trainer_id' => $trainer->id, 'name' => 'Group A', 'academic_period' => 'TEST', 'is_active' => true]);
        Enrollment::create(['student_id' => $student->id, 'classroom_id' => $classroom->id, 'is_active' => true, 'enrolled_at' => now()]);
        $firstWeek = Week::create(['classroom_id' => $classroom->id, 'number' => 1, 'title' => 'Harbor', 'vocabulary' => 'hello:hola']);
        $secondWeek = Week::create(['classroom_id' => $classroom->id, 'number' => 2, 'title' => 'Cove', 'vocabulary' => 'blue:azul']);
        foreach ([$firstWeek, $secondWeek] as $week) {
            CourseTask::create(['week_id' => $week->id, 'title' => "Mission {$week->number}", 'description' => 'Practice', 'deadline' => now()->addWeek(), 'is_open' => true]);
        }

        return [$trainer, $student, $classroom, $firstWeek, $secondWeek];
    }
}
