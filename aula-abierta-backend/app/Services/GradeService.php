<?php

namespace App\Services;

use App\Models\CriterionScore;
use App\Models\Grade;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class GradeService
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function grade(Submission $submission, User $grader, array $criterionScores, ?string $feedback): Grade
    {
        $grade = DB::transaction(function () use ($submission, $grader, $criterionScores, $feedback) {
            $rubric = $submission->courseTask->rubric;
            $criteria = $rubric?->criteria ?? collect();

            if ($criteria->isEmpty()) {
                throw ValidationException::withMessages([
                    'criterion_scores' => ['This task does not have an active rubric.'],
                ]);
            }

            $criteriaById = $criteria->keyBy('id');
            $submittedCriterionIds = collect($criterionScores)->pluck('criterion_id')->sort()->values();
            $rubricCriterionIds = $criteria->pluck('id')->sort()->values();

            if ($submittedCriterionIds->all() !== $rubricCriterionIds->all()) {
                throw ValidationException::withMessages([
                    'criterion_scores' => ['Every rubric criterion must receive exactly one score.'],
                ]);
            }

            foreach ($criterionScores as $criterionScore) {
                $criterion = $criteriaById->get($criterionScore['criterion_id']);
                if (! $criterion || $criterionScore['score'] > $criterion->max_score) {
                    throw ValidationException::withMessages([
                        'criterion_scores' => ['Each score must belong to this rubric and stay within its maximum.'],
                    ]);
                }
            }

            $totalMax = $criteria->sum('max_score');
            $totalScored = collect($criterionScores)->sum('score');

            $numericScore = $totalMax > 0
                ? (int) round(($totalScored / $totalMax) * 100)
                : 0;

            $letterGrade = $this->toLetterGrade($numericScore);

            $grade = Grade::updateOrCreate(
                ['submission_id' => $submission->id],
                [
                    'graded_by' => $grader->id,
                    'numeric_score' => $numericScore,
                    'letter_grade' => $letterGrade,
                    'feedback' => $feedback,
                    'graded_at' => now(),
                ],
            );

            $grade->criterionScores()->delete();

            foreach ($criterionScores as $cs) {
                CriterionScore::create([
                    'grade_id' => $grade->id,
                    'criterion_id' => $cs['criterion_id'],
                    'score' => $cs['score'],
                ]);
            }

            return $grade->load('criterionScores');
        });

        $submission->loadMissing(['student', 'courseTask']);

        try {
            $this->notificationService->send(
                $submission->student,
                'grade',
                'A new rubric grade is ready',
                "{$submission->courseTask->title}: {$grade->numeric_score}% ({$grade->letter_grade})",
                "/student/tasks/{$submission->course_task_id}",
                ['submission_id' => $submission->id, 'grade_id' => $grade->id],
            );
        } catch (\Throwable $exception) {
            Log::warning('Grade saved, but its student notification could not be created.', [
                'grade_id' => $grade->id,
                'submission_id' => $submission->id,
                'exception' => $exception->getMessage(),
            ]);
        }

        return $grade;
    }

    private function toLetterGrade(int $score): string
    {
        return match (true) {
            $score >= 90 => 'A+',
            $score >= 80 => 'A',
            $score >= 70 => 'B',
            default => 'C',
        };
    }
}
