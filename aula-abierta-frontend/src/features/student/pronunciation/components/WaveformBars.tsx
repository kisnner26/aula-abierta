import { cn } from '@core/utils'

interface WaveformBarsProps {
  bars: number[]       // 0–1 amplitude values
  active: boolean      // true while recording
  className?: string
}

/**
 * Live waveform visualiser rendered as a row of animated bars.
 * Uses CSS transitions instead of framer-motion so it stays
 * performant at ~60fps from AudioContext data.
 * Respects prefers-reduced-motion via the Tailwind class.
 */
export function WaveformBars({ bars, active, className }: WaveformBarsProps) {
  const MIN_HEIGHT = 4   // px
  const MAX_HEIGHT = 48  // px

  return (
    <div
      aria-hidden="true"
      className={cn('flex items-center justify-center gap-[3px]', className)}
    >
      {bars.map((amp, i) => {
        const height = active
          ? MIN_HEIGHT + amp * (MAX_HEIGHT - MIN_HEIGHT)
          : MIN_HEIGHT
        return (
          <span
            key={i}
            className={cn(
              'rounded-full motion-reduce:transition-none',
              active ? 'bg-brand-red' : 'bg-neutral-300 dark:bg-neutral-600',
            )}
            style={{
              width: 4,
              height,
              transition: active ? 'height 80ms ease-out' : 'height 200ms ease-out',
            }}
          />
        )
      })}
    </div>
  )
}
