<?php

namespace App\Services;

use App\Models\Classroom;
use App\Models\CourseTask;
use App\Models\Rubric;
use App\Models\Week;
use App\Models\Template;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class ClassroomService
{
    public function cloneFromTemplate(Template $template, array $data): Classroom
    {
        return DB::transaction(function () use ($template, $data) {
            $template->loadMissing([
                'weeks.materials',
                'weeks.courseTasks.rubric.criteria',
            ]);

            $classroom = Classroom::create([
                'template_id' => $template->id,
                'level_id' => $template->level_id,
                'trainer_id' => $data['trainer_id'] ?? null,
                'name' => $data['classroom_name'],
                'academic_period' => $data['academic_period'],
                'starts_at' => $data['starts_at'] ?? null,
                'ends_at' => $data['ends_at'] ?? null,
                'is_active' => true,
            ]);

            $start = isset($data['starts_at'])
                ? CarbonImmutable::parse($data['starts_at'])
                : CarbonImmutable::now();

            foreach ($template->weeks as $templateWeek) {
                $week = Week::create([
                    'classroom_id' => $classroom->id,
                    'number' => $templateWeek->number,
                    'title' => $templateWeek->title,
                    'vocabulary' => $templateWeek->vocabulary,
                    'session_provider' => 'google_meet',
                    'meet_link' => null,
                    'session_is_live' => false,
                ]);

                foreach ($templateWeek->materials as $material) {
                    $week->materials()->create([
                        'title' => $material->title,
                        'type' => $material->type,
                        'is_protected' => $material->is_protected,
                        'storage_path' => $material->storage_path,
                        'external_url' => $material->external_url,
                    ]);
                }

                foreach ($templateWeek->courseTasks as $templateTask) {
                    $task = CourseTask::create([
                        'week_id' => $week->id,
                        'title' => $templateTask->title,
                        'description' => $templateTask->description,
                        'deadline' => $start->addDays($templateTask->deadline_offset_days),
                        'is_open' => $templateTask->is_open,
                    ]);

                    if ($templateTask->rubric) {
                        $rubric = Rubric::create([
                            'course_task_id' => $task->id,
                            'title' => $templateTask->rubric->title,
                        ]);

                        foreach ($templateTask->rubric->criteria as $criterion) {
                            $rubric->criteria()->create([
                                'name' => $criterion->name,
                                'description' => $criterion->description,
                                'max_score' => $criterion->max_score,
                                'order' => $criterion->order,
                            ]);
                        }
                    }
                }
            }

            activity()
                ->performedOn($classroom)
                ->withProperties([
                    'template_id' => $template->id,
                    'weeks_cloned' => $template->weeks->count(),
                ])
                ->log('classroom_created_from_template');

            return $classroom->fresh(['level.program']);
        });
    }

    public function assignTrainer(Classroom $classroom, int $trainerId): Classroom
    {
        $classroom->update(['trainer_id' => $trainerId]);

        return $classroom->fresh();
    }
}
