<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\CourseTask;
use App\Models\Level;
use App\Models\Program;
use App\Models\Rubric;
use App\Models\RubricCriterion;
use App\Models\Submission;
use App\Models\Template;
use App\Models\User;
use App\Models\Week;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class GradeWorkflowTest extends TestCase
{
    use DatabaseTransactions;

    public function test_assigned_trainer_can_save_complete_rubric_grade_and_notify_student(): void
    {
        Role::findOrCreate('teacher', 'web');

        $trainer = User::create([
            'sis_id' => 'TEST-TRAINER-GRADE',
            'name' => 'Grade Trainer',
            'password' => 'secret-password',
        ]);
        $trainer->assignRole('teacher');

        $student = User::create([
            'sis_id' => 'TEST-STUDENT-GRADE',
            'name' => 'Grade Student',
            'password' => 'secret-password',
        ]);

        $program = Program::create(['name' => 'Test Program', 'code' => 'GRADE-TEST']);
        $level = Level::create(['program_id' => $program->id, 'name' => 'Test Level', 'order' => 1]);
        $template = Template::create([
            'level_id' => $level->id,
            'created_by' => $trainer->id,
            'title' => 'Test Template',
            'is_frozen' => true,
        ]);
        $classroom = Classroom::create([
            'template_id' => $template->id,
            'level_id' => $level->id,
            'trainer_id' => $trainer->id,
            'name' => 'Test Classroom',
            'academic_period' => 'TEST',
        ]);
        $week = Week::create(['classroom_id' => $classroom->id, 'number' => 1, 'title' => 'Test Week']);
        $courseTask = CourseTask::create([
            'week_id' => $week->id,
            'title' => 'Speaking Mission',
            'description' => 'Submit a speaking sample.',
            'deadline' => now()->addDay(),
            'is_open' => true,
        ]);
        $rubric = Rubric::create(['course_task_id' => $courseTask->id, 'title' => 'Speaking Rubric']);
        $clarity = RubricCriterion::create([
            'rubric_id' => $rubric->id,
            'name' => 'Clarity',
            'max_score' => 10,
            'order' => 1,
        ]);
        $fluency = RubricCriterion::create([
            'rubric_id' => $rubric->id,
            'name' => 'Fluency',
            'max_score' => 10,
            'order' => 2,
        ]);
        $submission = Submission::create([
            'course_task_id' => $courseTask->id,
            'student_id' => $student->id,
            'submitted_at' => now(),
        ]);

        $this->actingAs($trainer, 'sanctum');

        $this->postJson('/api/v1/grades', [
            'submission_id' => $submission->id,
            'criterion_scores' => [
                ['criterion_id' => $clarity->id, 'score' => 9],
                ['criterion_id' => $fluency->id, 'score' => 8],
            ],
            'feedback' => 'Clear and confident work.',
        ])
            ->assertCreated()
            ->assertJsonPath('data.numeric_score', 85)
            ->assertJsonPath('data.letter_grade', 'A')
            ->assertJsonCount(2, 'data.criterion_scores');

        $this->assertDatabaseHas('grades', [
            'submission_id' => $submission->id,
            'graded_by' => $trainer->id,
            'numeric_score' => 85,
            'letter_grade' => 'A',
        ]);
        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $student->id,
            'type' => 'grade',
        ]);
    }
}
