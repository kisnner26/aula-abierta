<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\CourseTask;
use App\Models\CriterionScore;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Level;
use App\Models\LearningVideo;
use App\Models\Message;
use App\Models\Rubric;
use App\Models\RubricCriterion;
use App\Models\Submission;
use App\Models\Template;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\Week;
use Illuminate\Database\Seeder;

class ClassroomSeeder extends Seeder
{
    public function run(): void
    {
        $coordinator = User::where('sis_id', 'CO-0001')->first();
        $trainer = User::where('sis_id', 'TR-0001')->first();
        $students = User::role('student')->get();

        $befkL1 = Level::whereHas('program', fn ($q) => $q->where('code', 'BEFK'))
            ->where('order', 1)->first();

        if (! $befkL1) {
            return;
        }

        $template = Template::firstOrCreate(
            ['title' => 'BEFK Level 1 — Template 2026'],
            ['level_id' => $befkL1->id, 'created_by' => $coordinator->id, 'is_frozen' => false],
        );

        $classroom = Classroom::firstOrCreate(
            ['name' => 'BEFK L1 — Group A'],
            [
                'template_id' => $template->id,
                'level_id' => $befkL1->id,
                'trainer_id' => $trainer->id,
                'academic_period' => '2026-I',
                'starts_at' => '2026-01-20',
                'ends_at' => '2026-05-16',
                'is_active' => true,
            ],
        );

        // Enroll all students
        foreach ($students as $student) {
            Enrollment::firstOrCreate(
                ['student_id' => $student->id, 'classroom_id' => $classroom->id],
                ['is_active' => true, 'enrolled_at' => now()],
            );
        }

        $weekContent = [
            1 => ['Unit 1: Greetings', 'hello:hola, goodbye:adiós, morning:mañana, afternoon:tarde, please:por favor, thanks:gracias, friend:amigo, name:nombre, welcome:bienvenido, smile:sonrisa'],
            2 => ['Unit 2: Colors', 'red:rojo, blue:azul, green:verde, yellow:amarillo, orange:naranja, purple:morado, pink:rosado, black:negro, white:blanco, color:color'],
            3 => ['Unit 3: Family', 'mother:madre, father:padre, sister:hermana, brother:hermano, grandmother:abuela, grandfather:abuelo, family:familia, home:hogar, love:amor, together:juntos'],
            4 => ['Unit 4: Animals', 'bird:ave, cat:gato, dog:perro, fish:pez, rabbit:conejo, turtle:tortuga, lion:león, monkey:mono, elephant:elefante, animal:animal'],
            5 => ['Unit 5: Numbers', 'one:uno, two:dos, three:tres, four:cuatro, five:cinco, six:seis, seven:siete, eight:ocho, nine:nueve, ten:diez'],
            6 => ['Unit 6: Food', 'apple:manzana, banana:banano, bread:pan, milk:leche, water:agua, rice:arroz, chicken:pollo, fruit:fruta, hungry:hambriento, delicious:delicioso'],
            7 => ['Unit 7: Actions', 'run:correr, jump:saltar, read:leer, write:escribir, sing:cantar, dance:bailar, play:jugar, listen:escuchar, speak:hablar, learn:aprender'],
            8 => ['Unit 8: Weather', 'sunny:soleado, rainy:lluvioso, cloudy:nublado, windy:ventoso, hot:caliente, cold:frío, sky:cielo, weather:clima, today:hoy, umbrella:paraguas'],
            9 => ['Unit 9: School', 'teacher:docente, student:estudiante, book:libro, pencil:lápiz, desk:escritorio, classroom:salón, school:escuela, question:pregunta, answer:respuesta, study:estudiar'],
            10 => ['Unit 10: Feelings', 'happy:feliz, excited:emocionado, calm:tranquilo, proud:orgulloso, tired:cansado, surprised:sorprendido, kind:amable, brave:valiente, feeling:sentimiento, today:hoy'],
            11 => ['Unit 11: Body', 'head:cabeza, shoulders:hombros, knees:rodillas, toes:dedos, eyes:ojos, ears:orejas, mouth:boca, nose:nariz, hands:manos, feet:pies'],
            12 => ['Unit 12: Clothes', 'shirt:camisa, pants:pantalones, dress:vestido, shoes:zapatos, hat:sombrero, socks:calcetines, jacket:chaqueta, wear:vestir, favorite:favorito, clothes:ropa'],
            13 => ['Unit 13: Stories', 'beginning:inicio, middle:medio, ending:final, character:personaje, place:lugar, problem:problema, idea:idea, imagine:imaginar, tell:contar, story:historia'],
            14 => ['Unit 14: Review', 'discover:descubrir, create:crear, practice:practicar, improve:mejorar, share:compartir, challenge:reto, review:repasar, confidence:confianza, celebrate:celebrar'],
        ];

        foreach ($weekContent as $weekNumber => [$title, $vocabulary]) {
            $templateWeek = $template->weeks()->firstOrCreate(
                ['number' => $weekNumber],
                ['title' => $title, 'vocabulary' => $vocabulary],
            );

            $templateWeek->materials()->firstOrCreate(
                ['title' => "{$title} Slides"],
                [
                    'type' => 'slide',
                    'is_protected' => true,
                    // PRODUCTION: replace with the real private R2 key when uploading official slides.
                    'storage_path' => "templates/befk-l1/week-{$weekNumber}/slides.pdf",
                ],
            );

            $templateWeek->materials()->firstOrCreate(
                ['title' => "{$title} Practice Link"],
                [
                    'type' => 'link',
                    'is_protected' => false,
                    'external_url' => 'https://learnenglishkids.britishcouncil.org/',
                ],
            );

            $templateTask = $templateWeek->courseTasks()->firstOrCreate(
                ['title' => "Week {$weekNumber} Activity: Speak and Create"],
                [
                    'description' => 'Create a short spoken answer using this week vocabulary and one original sentence.',
                    'deadline_offset_days' => 7 * $weekNumber,
                    'is_open' => true,
                ],
            );

            if (! $templateTask->rubric) {
                $templateRubric = $templateTask->rubric()->create(['title' => 'Activity Rubric']);
                $templateRubric->criteria()->createMany([
                    ['name' => 'Vocabulary', 'description' => 'Uses the target weekly vocabulary.', 'max_score' => 10, 'order' => 1],
                    ['name' => 'Clarity', 'description' => 'Speaks or writes clearly for the activity.', 'max_score' => 10, 'order' => 2],
                    ['name' => 'Creativity', 'description' => 'Adds personal ideas and effort.', 'max_score' => 10, 'order' => 3],
                ]);
            }
        }

        // PRODUCTION: classroom copies receive these values from the frozen template service.
        for ($w = 1; $w <= 14; $w++) {
            $week = Week::updateOrCreate(
                ['classroom_id' => $classroom->id, 'number' => $w],
                ['title' => $weekContent[$w][0], 'vocabulary' => $weekContent[$w][1]],
            );

            $week->materials()->firstOrCreate(
                ['title' => "{$weekContent[$w][0]} Slides"],
                [
                    'type' => 'slide',
                    'is_protected' => true,
                    // PRODUCTION: replace with the real private R2 key when uploading official classroom slides.
                    'storage_path' => "classrooms/{$classroom->id}/week-{$w}/slides.pdf",
                ],
            );

            $week->materials()->firstOrCreate(
                ['title' => "{$weekContent[$w][0]} Practice Link"],
                [
                    'type' => 'link',
                    'is_protected' => false,
                    'external_url' => 'https://learnenglishkids.britishcouncil.org/',
                ],
            );

            $task = CourseTask::firstOrCreate(
                ['week_id' => $week->id, 'title' => "Week {$w} Task: My First Sentences"],
                [
                    'description' => 'Record a short video (1-2 min) introducing yourself using the vocabulary from this week. Use at least 5 new words.',
                    'deadline' => now()->addDays(7 * $w),
                    'is_open' => true,
                ],
            );

            if (! $task->rubric) {
                $rubric = Rubric::create(['course_task_id' => $task->id, 'title' => 'Speaking Rubric']);
                RubricCriterion::insert([
                    ['rubric_id' => $rubric->id, 'name' => 'Pronunciation',  'max_score' => 10, 'order' => 1, 'description' => 'Clarity and accuracy of sounds', 'created_at' => now(), 'updated_at' => now()],
                    ['rubric_id' => $rubric->id, 'name' => 'Vocabulary',     'max_score' => 10, 'order' => 2, 'description' => 'Use of target vocabulary', 'created_at' => now(), 'updated_at' => now()],
                    ['rubric_id' => $rubric->id, 'name' => 'Fluency',        'max_score' => 5,  'order' => 3, 'description' => 'Natural flow of speech', 'created_at' => now(), 'updated_at' => now()],
                    ['rubric_id' => $rubric->id, 'name' => 'Creativity',     'max_score' => 5,  'order' => 4, 'description' => 'Original and engaging presentation', 'created_at' => now(), 'updated_at' => now()],
                ]);
            }

            if ($w === 1) {
                $week->update([
                    'jitsi_room_id' => null,
                    'session_provider' => 'google_meet',
                    // No seeded link — trainers create a Google Meet from the panel.
                    'meet_link' => null,
                    'session_scheduled_at' => now()->addDay()->setTime(15, 0),
                    'session_is_live' => false,
                    'session_password' => 'discover',
                ]);
            }
        }

        LearningVideo::firstOrCreate(
            ['level_id' => $befkL1->id, 'youtube_url' => 'https://www.youtube.com/watch?v=0LDArAJf7-c'],
            [
                'program_id' => $befkL1->program_id,
                'added_by' => $coordinator->id,
                'title' => 'Greetings and introductions',
                'description' => 'A short English warm-up for greeting friends and introducing yourself.',
                'sort_order' => 1,
                'is_active' => true,
            ],
        );
        LearningVideo::firstOrCreate(
            ['level_id' => $befkL1->id, 'youtube_url' => 'https://www.youtube.com/watch?v=tkpfg-1FJLU'],
            [
                'program_id' => $befkL1->program_id,
                'added_by' => $coordinator->id,
                'title' => 'Colors in English',
                'description' => 'Practice basic colors through repetition and visual examples.',
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        $alondra = User::where('sis_id', 'ST-0001')->first();
        $secondStudent = User::where('sis_id', 'ST-0002')->first();
        $tasks = CourseTask::whereHas('week', fn ($query) => $query->where('classroom_id', $classroom->id))
            ->with('rubric.criteria')
            ->orderBy('id')
            ->get();

        if ($alondra && $tasks->isNotEmpty()) {
            $gradedSubmission = Submission::firstOrCreate(
                ['course_task_id' => $tasks->first()->id, 'student_id' => $alondra->id],
                ['notes' => 'I practiced the sentences before recording.', 'submitted_at' => now()->subDays(4)],
            );

            $grade = Grade::updateOrCreate(
                ['submission_id' => $gradedSubmission->id],
                [
                    'graded_by' => $trainer->id,
                    'numeric_score' => 93,
                    'letter_grade' => 'A+',
                    'feedback' => 'Clear pronunciation and confident vocabulary. Keep the same pace in your next recording.',
                    'graded_at' => now()->subDays(2),
                ],
            );

            $scores = [9, 10, 4, 5];
            foreach ($tasks->first()->rubric?->criteria ?? [] as $index => $criterion) {
                CriterionScore::updateOrCreate(
                    ['grade_id' => $grade->id, 'criterion_id' => $criterion->id],
                    ['score' => min($scores[$index] ?? $criterion->max_score, $criterion->max_score)],
                );
            }

            Message::firstOrCreate(
                [
                    'classroom_id' => $classroom->id,
                    'sender_id' => $trainer->id,
                    'recipient_id' => $alondra->id,
                    'body' => 'Hi Alondra, your first recording was clear and confident. I left rubric feedback in Grades.',
                ],
                ['read_at' => null],
            );
            Message::firstOrCreate(
                [
                    'classroom_id' => $classroom->id,
                    'sender_id' => $alondra->id,
                    'recipient_id' => $trainer->id,
                    'body' => 'Thank you. I will practice the new vocabulary before the next task.',
                ],
                ['read_at' => now()],
            );

            UserNotification::firstOrCreate(
                ['user_id' => $alondra->id, 'type' => 'grade', 'title' => 'Your rubric grade is ready'],
                [
                    'body' => 'Your first speaking activity has a saved grade and trainer feedback.',
                    'action_url' => "/student/tasks/{$tasks->first()->id}",
                    'metadata' => ['grade_id' => $grade->id],
                ],
            );
            UserNotification::firstOrCreate(
                ['user_id' => $alondra->id, 'type' => 'task', 'title' => 'Your next activity is approaching'],
                [
                    'body' => $tasks->get(1)?->title ?? $tasks->first()->title,
                    'action_url' => '/student/calendar',
                    'metadata' => ['course_task_id' => $tasks->get(1)?->id ?? $tasks->first()->id],
                ],
            );
            UserNotification::firstOrCreate(
                ['user_id' => $alondra->id, 'type' => 'message', 'title' => 'New message from Sofia Rodriguez'],
                [
                    'body' => 'Your trainer left feedback about your first recording.',
                    'action_url' => "/student/classrooms/{$classroom->id}/messages",
                    'metadata' => ['classroom_id' => $classroom->id],
                ],
            );
        }

        if ($secondStudent && $tasks->count() > 1) {
            $pendingSubmission = Submission::firstOrCreate(
                ['course_task_id' => $tasks->get(1)->id, 'student_id' => $secondStudent->id],
                ['notes' => 'My second-week speaking practice is ready for review.', 'submitted_at' => now()->subDay()],
            );

            UserNotification::firstOrCreate(
                ['user_id' => $trainer->id, 'type' => 'submission', 'title' => 'New submission to review'],
                [
                    'body' => "{$secondStudent->name} submitted {$tasks->get(1)->title}.",
                    'action_url' => "/trainer/classrooms/{$classroom->id}/grading",
                    'metadata' => ['submission_id' => $pendingSubmission->id],
                ],
            );
        }
    }
}
