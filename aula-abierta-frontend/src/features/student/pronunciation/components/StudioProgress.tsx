import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@core/utils'

interface StudioProgressProps {
  current: number   // 0-based index of current word
  total: number
  weekTitle?: string
}

export function StudioProgress({ current, total, weekTitle }: StudioProgressProps) {
  const prefersReduced = useReducedMotion()
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-neutral-600 dark:text-neutral-400">
          {weekTitle ? `Week: ${weekTitle}` : 'Pronunciation Studio'}
        </span>
        <span className="font-bold text-brand-blue">
          {current} / {total}
        </span>
      </div>

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Word progress"
        className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
      >
        <motion.div
          className="h-full rounded-full bg-brand-blue"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              i < current
                ? 'bg-brand-blue'
                : i === current
                  ? 'bg-brand-yellow ring-2 ring-brand-yellow/40'
                  : 'bg-neutral-300 dark:bg-neutral-600',
            )}
          />
        ))}
      </div>
    </div>
  )
}
