import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle2, ClipboardCheck, MessageSquareQuote, Sparkles } from 'lucide-react'
import { Button, EmptyState, toast } from '@core/ui'
import { teacherApi } from '../api'
import { numericToLetter, letterColor } from '@core/utils/gradeLabel'
import { cn } from '@core/utils'
import { useSound } from '@core/hooks/useSound'
import type { Submission, RubricCriterion } from '@core/types/models'

interface RubricGraderProps {
  submission: Submission
  criteria: RubricCriterion[]
  classroomId: number
  onDone: () => void
}

export function RubricGrader({ submission, criteria, classroomId, onDone }: RubricGraderProps) {
  const queryClient = useQueryClient()
  const { play } = useSound()
  const [scores, setScores] = useState<Record<number, number>>(() => Object.fromEntries(criteria.map((criterion) => [criterion.id, 0])))
  const [feedback, setFeedback] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const totalMax = criteria.reduce((sum, criterion) => sum + criterion.max_score, 0)
  const totalScored = Object.values(scores).reduce((sum, value) => sum + value, 0)
  const percentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0
  const letter = numericToLetter(percentage)

  const grade = useMutation({
    mutationFn: () => teacherApi.gradeSubmission(submission.id, {
      criterion_scores: criteria.map((criterion) => ({ criterion_id: criterion.id, score: scores[criterion.id] ?? 0 })),
      feedback: feedback || undefined,
    }),
    onSuccess: () => {
      play('achievement')
      toast.success('Grade saved successfully.')
      queryClient.invalidateQueries({ queryKey: ['trainer', 'classroom', classroomId, 'submissions'] })
      onDone()
    },
    onError: (error) => {
      play('error')
      const response = axios.isAxiosError(error) ? error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined : undefined
      const firstValidationError = response?.errors ? Object.values(response.errors)[0]?.[0] : undefined
      const message = firstValidationError ?? response?.message ?? 'The grade could not be saved. Please try again.'
      setFormError(message)
      toast.error(message)
    },
  })

  if (criteria.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck size={22} />}
        title="Rubric unavailable"
        description="This task does not have rubric criteria. Ask coordination to review the classroom copy."
      />
    )
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section aria-labelledby="rubric-score-title" className="min-w-0">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-brand-red">SCORE BY CRITERION</p>
            <h3 id="rubric-score-title" className="mt-1 font-display text-xl font-extrabold text-neutral-900">Rubric</h3>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {criteria.map((criterion) => {
            const value = scores[criterion.id] ?? 0
            return (
              <fieldset key={criterion.id} className="min-w-0 rounded-[18px] border border-neutral-200 bg-neutral-50 p-4">
                <legend className="sr-only">Score {criterion.name}</legend>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-neutral-800">{criterion.name}</p>
                    {criterion.description && <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">{criterion.description}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold tabular-nums text-brand-blue shadow-soft">
                    {value} / {criterion.max_score}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: criterion.max_score + 1 }, (_, index) => index).map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => {
                        play('tap')
                        setFormError(null)
                        setScores((current) => ({ ...current, [criterion.id]: score }))
                      }}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition-colors duration-150',
                        value === score
                          ? 'border-brand-blue bg-brand-blue text-white'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-blue hover:text-brand-blue',
                      )}
                      aria-label={`${criterion.name}: ${score} out of ${criterion.max_score}`}
                      aria-pressed={value === score}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </fieldset>
            )
          })}
        </div>
      </section>

      <aside className="sticky top-0 overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-sm" aria-label="Grade summary">
        <div className="bg-brand-blue p-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <p className="text-xs font-bold text-brand-yellow">LIVE RESULT</p>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-5xl font-extrabold tabular-nums text-white">{percentage}%</p>
              <p className="mt-1 text-xs font-semibold text-white/70">{totalScored} of {totalMax} points</p>
            </div>
            <span className={cn('flex size-16 items-center justify-center rounded-[20px] bg-white font-display text-2xl font-extrabold', letterColor(letter))}>{letter}</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2">
            <MessageSquareQuote size={16} className="text-brand-red" aria-hidden="true" />
            <label htmlFor="trainer-feedback" className="text-sm font-bold text-neutral-700">Feedback for student</label>
          </div>
          <p id="trainer-feedback-help" className="mt-1 text-xs font-medium leading-5 text-neutral-500">Specific feedback helps the next attempt.</p>
          <textarea
            id="trainer-feedback"
            value={feedback}
            onChange={(event) => {
              setFormError(null)
              setFeedback(event.target.value)
            }}
            placeholder="Write clear, encouraging feedback..."
            rows={5}
            aria-describedby={cn('trainer-feedback-help', formError && 'grade-form-error')}
            aria-invalid={Boolean(formError)}
            className="mt-3 w-full resize-none rounded-xl border border-neutral-300 p-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue"
          />

          {formError && (
            <p id="grade-form-error" role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold leading-5 text-brand-red">
              {formError}
            </p>
          )}

          <Button
            onClick={() => grade.mutate()}
            loading={grade.isPending}
            leftIcon={<CheckCircle2 size={17} aria-hidden="true" />}
            size="lg"
            fullWidth
            variant="danger"
            className="mt-4"
          >
            Save and send grade
          </Button>
          <p className="mt-3 text-center text-xs font-semibold text-neutral-400">The student will receive a notification.</p>
        </div>
      </aside>
    </div>
  )
}
