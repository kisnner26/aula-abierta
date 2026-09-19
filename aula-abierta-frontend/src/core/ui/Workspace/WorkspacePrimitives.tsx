import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@core/utils'
import { CountUp, EASE_OUT } from '@core/motion'

export function PageCanvas({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('page-container flex w-full flex-col gap-6 py-4 sm:py-5 lg:py-6', className)} {...props}>{children}</div>
}

type MetricTone = 'blue' | 'red' | 'yellow' | 'green' | 'neutral'

const metricTones: Record<MetricTone, string> = {
  blue: 'bg-gradient-blue text-white',
  red: 'bg-gradient-red text-white',
  yellow: 'bg-gradient-yellow text-neutral-950',
  green: 'bg-[linear-gradient(135deg,#4ADE80_0%,#10B981_100%)] text-white',
  neutral: 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950',
}

const metricGlow: Record<MetricTone, string> = {
  blue: 'group-hover/metric:shadow-glow-blue',
  red: 'group-hover/metric:shadow-glow-red',
  yellow: 'group-hover/metric:shadow-glow-yellow',
  green: 'group-hover/metric:shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_10px_30px_-6px_rgba(16,185,129,0.5)]',
  neutral: '',
}

const metricSheen: Record<MetricTone, string> = {
  blue: 'from-brand-blue/60',
  red: 'from-brand-red/60',
  yellow: 'from-brand-yellow/70',
  green: 'from-emerald-400/60',
  neutral: 'from-neutral-400/40',
}

interface MetricCardProps {
  label: string
  value: ReactNode
  detail?: ReactNode
  icon: LucideIcon
  tone?: MetricTone
  loading?: boolean
  /** Optional suffix appended after the counted value (e.g. "%"). */
  suffix?: string
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'blue', loading = false, suffix }: MetricCardProps) {
  // Count up when the metric is a plain number; otherwise render the node as-is.
  const numeric = typeof value === 'number' ? value : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      className="group/metric relative grid min-h-28 grid-cols-[auto_1fr] items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-lift dark:border-white/10 dark:bg-surface-card"
    >
      <span aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent', metricSheen[tone])} />
      <span className={cn('flex size-12 items-center justify-center rounded-xl shadow-sm transition-shadow duration-300', metricTones[tone], metricGlow[tone])}>
        <Icon size={21} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <div className="relative h-7 w-16 overflow-hidden rounded-lg bg-neutral-200 dark:bg-white/10"><span className="shimmer-overlay" /></div>
        ) : (
          <p className="font-display text-2xl font-extrabold tabular-nums text-neutral-950 dark:text-white">
            {numeric !== null ? <CountUp value={numeric} suffix={suffix ?? ''} /> : value}
          </p>
        )}
        <p className="mt-1 truncate text-sm font-bold text-neutral-600 dark:text-neutral-300">{label}</p>
        {detail && <p className="mt-1 truncate text-xs font-semibold text-neutral-400 dark:text-neutral-500">{detail}</p>}
      </div>
    </motion.article>
  )
}

export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
}

interface ContentPanelProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string
  title?: string
  action?: ReactNode
  children: ReactNode
}

export function ContentPanel({ eyebrow, title, action, children, className, ...props }: ContentPanelProps) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-card', className)} {...props}>
      {(eyebrow || title || action) && (
        <header className="flex items-end justify-between gap-4 border-b border-neutral-100 px-5 py-4 dark:border-white/10 sm:px-6">
          <div>
            {eyebrow && <p className="text-xs font-bold text-brand-red">{eyebrow}</p>}
            {title && <h2 className="mt-1 font-display text-xl font-extrabold text-neutral-950 dark:text-white">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

interface ActionTileProps {
  icon: LucideIcon
  title: string
  description?: string
  accent?: 'blue' | 'red' | 'yellow'
  children?: ReactNode
}

const actionAccents = {
  blue: 'bg-gradient-blue text-white group-hover/tile:shadow-glow-blue',
  red: 'bg-gradient-red text-white group-hover/tile:shadow-glow-red',
  yellow: 'bg-gradient-yellow text-neutral-950 group-hover/tile:shadow-glow-yellow',
}

export function ActionTile({ icon: Icon, title, description, accent = 'blue', children }: ActionTileProps) {
  return (
    <article className="group/tile flex min-h-36 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-sky hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-surface-card dark:hover:border-brand-blue/40">
      <div className="flex items-start gap-3">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-[transform,box-shadow] duration-300 group-hover/tile:-rotate-6 group-hover/tile:scale-110 motion-reduce:group-hover/tile:transform-none', actionAccents[accent])}><Icon size={19} aria-hidden="true" /></span>
        <div><h3 className="font-display text-lg font-extrabold text-neutral-950 dark:text-white">{title}</h3>{description && <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500 dark:text-neutral-400">{description}</p>}</div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </article>
  )
}
