import { motion, useReducedMotion } from 'framer-motion'
import { Flame, Lock, type LucideIcon } from 'lucide-react'
import { CountUp, EASE_OUT, SPRING_POP } from '@core/motion'
import { cn } from '@core/utils'

// ── Streak flame ─────────────────────────────────────────────────────────────
interface StreakFlameProps {
  days: number
  className?: string
  compact?: boolean
}

/** A glowing streak flame — burns hotter (more glow) the longer the streak. */
export function StreakFlame({ days, className, compact = false }: StreakFlameProps) {
  const prefersReduced = useReducedMotion()
  const hot = days >= 7

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex items-center justify-center">
        <span className={cn('absolute inset-0 rounded-full blur-md', hot ? 'bg-orange-500/50' : 'bg-orange-400/30')} aria-hidden="true" />
        <motion.span
          className="relative text-orange-500"
          animate={prefersReduced ? undefined : { scale: [1, 1.12, 0.96, 1.08, 1], rotate: [0, -3, 3, -2, 0] }}
          transition={prefersReduced ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame size={compact ? 18 : 22} className="fill-orange-400" aria-hidden="true" />
        </motion.span>
      </span>
      <span className="leading-none">
        <span className={cn('font-display font-extrabold tabular-nums text-neutral-900 dark:text-white', compact ? 'text-base' : 'text-xl')}>
          <CountUp value={days} />
        </span>
        {!compact && <span className="ml-1 text-xs font-bold text-neutral-500 dark:text-neutral-400">day streak</span>}
      </span>
    </div>
  )
}

// ── XP / level bar ───────────────────────────────────────────────────────────
interface XPBarProps {
  /** Current XP within the level (0..max). */
  xp: number
  max: number
  level: number
  className?: string
  label?: string
}

/** Animated XP bar with level chip — the "Learning meter". */
export function XPBar({ xp, max, level, className, label = 'Learning XP' }: XPBarProps) {
  const prefersReduced = useReducedMotion()
  const pct = max > 0 ? Math.min(100, Math.round((xp / max) * 100)) : 0

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-sunrise text-xs font-extrabold text-white shadow-sm">
            {level}
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</span>
        </span>
        <span className="text-xs font-bold tabular-nums text-neutral-500 dark:text-neutral-400">
          <CountUp value={xp} /> / {max}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-white/10">
        <motion.div
          className="relative h-full rounded-full bg-gradient-sunrise"
          style={{ backgroundSize: '200% auto', width: prefersReduced ? `${pct}%` : undefined }}
          initial={prefersReduced ? false : { width: 0 }}
          animate={prefersReduced ? undefined : { width: `${pct}%`, backgroundPosition: ['0% 50%', '100% 50%'] }}
          transition={{ width: { duration: 1, ease: EASE_OUT }, backgroundPosition: { duration: 4, repeat: Infinity, ease: 'linear' } }}
        >
          <span aria-hidden="true" className="absolute inset-0 animate-sheen bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </motion.div>
      </div>
    </div>
  )
}

// ── Achievement badge ────────────────────────────────────────────────────────
interface AchievementBadgeProps {
  icon: LucideIcon
  label: string
  unlocked?: boolean
  tone?: 'blue' | 'red' | 'yellow' | 'green'
  className?: string
}

const badgeTones = {
  blue: 'bg-gradient-blue shadow-glow-blue',
  red: 'bg-gradient-red shadow-glow-red',
  yellow: 'bg-gradient-yellow shadow-glow-yellow',
  green: 'bg-[linear-gradient(135deg,#4ADE80_0%,#10B981_100%)]',
}

/** A collectible achievement medal — greyed + locked, or gradient + glowing. */
export function AchievementBadge({ icon: Icon, label, unlocked = false, tone = 'yellow', className }: AchievementBadgeProps) {
  return (
    <div className={cn('flex w-20 shrink-0 flex-col items-center gap-1.5 text-center', className)}>
      <motion.div
        initial={false}
        whileHover={unlocked ? { scale: 1.08, rotate: -4 } : undefined}
        transition={SPRING_POP}
        className={cn(
          'relative flex size-14 items-center justify-center rounded-2xl text-white',
          unlocked ? badgeTones[tone] : 'bg-neutral-200 text-neutral-400 dark:bg-white/[.06] dark:text-neutral-600',
        )}
      >
        <Icon size={24} className={unlocked ? 'fill-white/20' : ''} aria-hidden="true" />
        {!unlocked && (
          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-neutral-400 text-white ring-2 ring-white dark:bg-neutral-600 dark:ring-surface-card">
            <Lock size={11} aria-hidden="true" />
          </span>
        )}
      </motion.div>
      <span className={cn('text-[11px] font-bold leading-tight', unlocked ? 'text-neutral-700 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500')}>
        {label}
      </span>
    </div>
  )
}
