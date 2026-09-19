import { motion, useReducedMotion } from 'framer-motion'
import { Flame, Map, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { CountUp } from '@core/motion'
import { IllustrationPlaceholder } from '@core/ui'

interface StudentIslandProps {
  firstName: string
  streakDays: number
  weeklyProgressPercent: number
  actions?: ReactNode
}

export function StudentIsland({ firstName, streakDays, weeklyProgressPercent, actions }: StudentIslandProps) {
  const reduceMotion = useReducedMotion()
  const progress = Math.max(0, Math.min(weeklyProgressPercent, 100))

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative min-h-[380px] overflow-hidden rounded-2xl border border-sky-200 bg-brand-sky shadow-sm dark:border-white/10 dark:bg-brand-night"
      aria-labelledby="student-progress-title"
    >
      <IllustrationPlaceholder variant="course progress" size="scene" className="absolute inset-0 size-full" />
      <div className="absolute inset-x-0 bottom-0 h-[74%] bg-brand-red sm:inset-y-0 sm:left-0 sm:h-auto sm:w-[56%] lg:w-[52%] xl:w-[50%]" aria-hidden="true" />
      {/* Soft blends so the red panel melts into the unit photo instead of a hard seam. */}
      <div className="absolute inset-x-0 bottom-[74%] h-24 bg-gradient-to-t from-brand-red to-transparent sm:hidden" aria-hidden="true" />
      <div className="absolute inset-y-0 left-[56%] hidden w-28 bg-gradient-to-r from-brand-red to-transparent sm:block lg:left-[52%] xl:left-[50%]" aria-hidden="true" />
      <div className="relative flex min-h-[400px] max-w-[560px] flex-col justify-end p-5 pt-32 text-white sm:min-h-[380px] sm:justify-center sm:pt-7 sm:p-7 lg:max-w-[520px] lg:p-8 xl:max-w-[560px]">
        <p className="flex items-center gap-2 text-xs font-extrabold text-brand-yellow drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"><Sparkles size={15} aria-hidden="true" /> TODAY'S PRACTICE</p>
        <h1 id="student-progress-title" className="mt-2 max-w-[12ch] font-display text-3xl font-extrabold leading-tight text-white text-balance sm:text-4xl">Welcome back, {firstName}.</h1>
        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/85 text-pretty">Your next unit is ready. Complete an activity today and keep your course progress moving.</p>

        <div className="mt-4 grid max-w-md grid-cols-2 items-start gap-2">
          <div className="min-w-0 rounded-xl border border-white/25 bg-white/10 p-3">
            <div className="flex items-center gap-2">
              <motion.span
                animate={reduceMotion ? undefined : { scale: [1, 1.18, 0.95, 1.1, 1], rotate: [0, -4, 4, -3, 0] }}
                transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="shrink-0"
              >
                <Flame size={17} className="fill-orange-400 text-brand-yellow" aria-hidden="true" />
              </motion.span>
              <span className="truncate text-[10px] font-bold tracking-wide text-white/75">LEARNING STREAK</span>
            </div>
            <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-white sm:text-2xl"><CountUp value={Math.min(streakDays, 99)} /> days</p>
          </div>
          <div className="min-w-0 rounded-xl border border-white/25 bg-white/10 p-3">
            <div className="flex items-center gap-2"><Map size={17} className="shrink-0 text-brand-yellow" aria-hidden="true" /><span className="truncate text-[10px] font-bold tracking-wide text-white/75">LEVEL PROGRESS</span></div>
            <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-white sm:text-2xl"><CountUp value={progress} suffix="%" /></p>
          </div>
        </div>

        <div className="mt-4 h-2.5 max-w-md overflow-hidden rounded-full bg-white/20" aria-label={`${progress}% level progress`}>
          <motion.div className="h-full origin-left rounded-full bg-brand-yellow" initial={reduceMotion ? { scaleX: progress / 100 } : { scaleX: 0 }} animate={{ scaleX: progress / 100 }} transition={{ duration: .5, ease: 'easeOut' }} />
        </div>
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </motion.section>
  )
}
