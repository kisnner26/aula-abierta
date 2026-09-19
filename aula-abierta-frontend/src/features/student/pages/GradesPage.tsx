import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, BarChart3, MessageSquareQuote, Sparkles, TrendingUp } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { AppShell } from '@core/ui/Layout'
import { EmptyState, Skeleton, WorkspaceHero } from '@core/ui'
import { studentApi } from '../api'
import { formatDate } from '@core/utils/date'
import { numericToLetter, letterColor, letterBg } from '@core/utils/gradeLabel'
import { ProgressRing } from '../components/ProgressRing'
import { CountUp, EASE_OUT, SPRING_POP, celebrate, staggerContainer } from '@core/motion'
import { cn } from '@core/utils'

const gradeBands = [
  { label: 'A+', min: 90, className: 'bg-brand-blue' },
  { label: 'A', min: 80, className: 'bg-emerald-500' },
  { label: 'B', min: 70, className: 'bg-brand-yellow' },
  { label: 'C', min: 0, className: 'bg-brand-red' },
] as const

export default function GradesPage() {
  const prefersReduced = useReducedMotion()
  const { data: grades, isLoading } = useQuery({
    queryKey: ['student', 'grades'],
    queryFn: studentApi.getGrades,
  })

  const gradeList = grades ?? []
  const average = gradeList.length
    ? Math.round(gradeList.reduce((sum, grade) => sum + grade.numeric_score, 0) / gradeList.length)
    : 0
  const highest = gradeList.length ? Math.max(...gradeList.map((grade) => grade.numeric_score)) : 0

  const distribution = gradeBands.map((band) => ({
    ...band,
    count: gradeList.filter((grade) => numericToLetter(grade.numeric_score) === band.label).length,
  }))

  // Celebrate once when an A-band average is revealed — the joyful payoff moment.
  const celebratedRef = useRef(false)
  useEffect(() => {
    if (!isLoading && average >= 80 && !celebratedRef.current) {
      celebratedRef.current = true
      const timer = setTimeout(() => celebrate({ y: 0.28 }), 600)
      return () => clearTimeout(timer)
    }
  }, [isLoading, average])

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="YOUR PROGRESS"
          title="Grades and feedback"
          description="Every grade combines a numeric score, a letter result, and your trainer's rubric feedback."
          image="placeholder"
          imageAlt="Aula Abierta illustration celebrating learning progress"
          tone="neutral"
        />

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton.Card />
            <Skeleton.Card />
            <Skeleton.Card />
          </div>
        ) : gradeList.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={23} />}
            title="Your first grade is on its way"
            description="Once your trainer reviews a submission, the rubric result will appear here."
          />
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
              <div className="grid gap-4 rounded-[26px] bg-brand-blue p-6 text-white shadow-soft sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
                <div className="rounded-full bg-white p-2">
                  <ProgressRing value={average} label="average" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-yellow">CURRENT AVERAGE</p>
                  <h2 className="mt-2 font-display text-3xl font-extrabold text-white">
                    Your progress is growing
                  </h2>
                  <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/80">
                    You have {gradeList.length} graded {gradeList.length === 1 ? 'activity' : 'activities'} and a highest score of <CountUp value={highest} suffix="%" />.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-bold">
                    <Award size={16} aria-hidden="true" />
                    Current level: {numericToLetter(average)}
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-neutral-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-cream text-brand-red">
                    <TrendingUp size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-display text-xl font-extrabold text-neutral-900">Grade map</p>
                    <p className="text-xs font-semibold text-neutral-500">Distribution across rubric results</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-4">
                  {distribution.map((band, index) => {
                    const percentage = gradeList.length ? Math.round((band.count / gradeList.length) * 100) : 0
                    return (
                      <div key={band.label} className="grid grid-cols-[32px_1fr_42px] items-center gap-3">
                        <span className="text-sm font-extrabold text-neutral-700 dark:text-neutral-200">{band.label}</span>
                        <div className="relative h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                          <motion.div
                            className={cn('relative h-full rounded-full', band.className)}
                            initial={prefersReduced ? false : { width: 0 }}
                            whileInView={prefersReduced ? undefined : { width: `${percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 + index * 0.08 }}
                            style={prefersReduced ? { width: `${percentage}%` } : undefined}
                          >
                            <span aria-hidden="true" className="absolute inset-0 animate-sheen bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                          </motion.div>
                        </div>
                        <span className="text-right text-xs font-bold tabular-nums text-neutral-500 dark:text-neutral-400">{band.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            <section aria-labelledby="grade-history-title">
              <div className="mb-4">
                <p className="text-xs font-bold text-brand-blue">RUBRIC HISTORY</p>
                <h2 id="grade-history-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900">Every result, clearly explained</h2>
              </div>
              <motion.div
                className="grid gap-4 lg:grid-cols-2"
                variants={prefersReduced ? undefined : staggerContainer(0.08)}
                initial={prefersReduced ? undefined : 'hidden'}
                whileInView={prefersReduced ? undefined : 'show'}
                viewport={{ once: true, amount: 0.1 }}
              >
                {gradeList.map((grade) => {
                  const letter = numericToLetter(grade.numeric_score)
                  return (
                    <motion.article
                      key={grade.id}
                      variants={prefersReduced ? undefined : { hidden: { opacity: 0, y: 18, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: SPRING_POP } }}
                      className="group overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-soft transition-shadow duration-300 hover:shadow-card dark:border-white/10 dark:bg-surface-card"
                    >
                      <div className="flex items-start gap-4 p-5">
                        <div className={cn('flex size-16 shrink-0 flex-col items-center justify-center rounded-[18px] border transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:transform-none', letterBg(letter))}>
                          <span className={cn('font-display text-2xl font-extrabold', letterColor(letter))}>{letter}</span>
                          <span className="text-[11px] font-bold tabular-nums text-neutral-500">{grade.numeric_score}%</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg font-extrabold leading-6 text-neutral-900 text-pretty dark:text-white">
                            {grade.task_title ?? `Task ${grade.submission_id}`}
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            {grade.classroom_name ? `${grade.classroom_name} · ` : ''}{formatDate(grade.graded_at)}
                          </p>
                        </div>
                        <Sparkles size={17} className="shrink-0 text-brand-yellow group-hover:animate-wiggle motion-reduce:group-hover:animate-none" aria-hidden="true" />
                      </div>
                      <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-white/10 dark:bg-white/[.03]">
                        <div className="flex items-start gap-3">
                          <MessageSquareQuote size={17} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
                          <div>
                            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">TRAINER FEEDBACK</p>
                            <p className="mt-1 text-sm font-medium leading-6 text-neutral-700 text-pretty dark:text-neutral-300">
                              {grade.feedback ?? 'Your trainer has not added written feedback yet.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  )
                })}
              </motion.div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
