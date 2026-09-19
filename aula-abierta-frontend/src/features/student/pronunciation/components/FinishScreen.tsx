import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { Mascot } from '@core/ui'
import { celebrate } from '@core/motion'
import { cn } from '@core/utils'

interface FinishScreenProps {
  wordCount: number
  scores: Array<'again' | 'good' | 'perfect'>
  onRestart: () => void
}

const SCORE_COLOR: Record<'again' | 'good' | 'perfect', string> = {
  again:   'bg-brand-red   text-white',
  good:    'bg-brand-blue  text-white',
  perfect: 'bg-emerald-500 text-white',
}

export function FinishScreen({ wordCount, scores, onRestart }: FinishScreenProps) {
  const prefersReduced = useReducedMotion()
  const celebratedRef = useRef(false)

  const perfectCount = scores.filter((s) => s === 'perfect').length
  const goodCount    = scores.filter((s) => s === 'good').length
  const againCount   = scores.filter((s) => s === 'again').length

  useEffect(() => {
    if (celebratedRef.current || prefersReduced) return
    celebratedRef.current = true
    // Fire confetti from the center of the screen
    celebrate({ x: window.innerWidth / 2, y: window.innerHeight / 3 })
  }, [prefersReduced])

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-6 py-4 text-center"
    >
      <Mascot mood="cheer" size="xl" aria-hidden="true" />

      <div className="flex flex-col gap-1">
        <h2 className="font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
          Amazing work!
        </h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400">
          You practiced {wordCount} word{wordCount !== 1 ? 's' : ''} today.
          <br />
          Keep it up, learning!
        </p>
      </div>

      {/* Score summary */}
      <div className="flex items-center justify-center gap-4">
        {[
          { label: 'Perfect', count: perfectCount, cls: 'bg-emerald-500 text-white' },
          { label: 'Good',    count: goodCount,    cls: 'bg-brand-blue  text-white' },
          { label: 'Again',   count: againCount,   cls: 'bg-brand-red   text-white' },
        ].map(({ label, count, cls }) => (
          <div key={label} className={cn('flex flex-col items-center rounded-2xl px-5 py-3 shadow-sm', cls)}>
            <span className="text-2xl font-extrabold">{count}</span>
            <span className="text-xs font-semibold opacity-90">{label}</span>
          </div>
        ))}
      </div>

      {/* Per-word legend */}
      {scores.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2" aria-label="Per-word scores">
          {scores.map((s, i) => (
            <span
              key={i}
              className={cn('rounded-full px-3 py-1 text-xs font-bold', SCORE_COLOR[s])}
            >
              #{i + 1} {s}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={onRestart}
        className="mt-2 flex items-center gap-2 rounded-2xl bg-brand-yellow px-6 py-3 text-base font-bold text-brand-ink shadow-md hover:bg-yellow-300 active:scale-95"
      >
        <RotateCcw className="h-5 w-5" aria-hidden="true" />
        Practice again
      </button>
    </motion.div>
  )
}
