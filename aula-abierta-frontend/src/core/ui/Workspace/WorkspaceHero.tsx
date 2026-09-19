import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@core/utils'
import { IllustrationPlaceholder } from '@core/ui/IllustrationPlaceholder'

interface WorkspaceHeroProps {
  eyebrow: string
  title: string
  description: string
  image?: string
  imageAlt: string
  actions?: ReactNode
  metric?: ReactNode
  tone?: 'blue' | 'red' | 'neutral'
  imagePosition?: string
}

const tones = {
  blue: 'bg-brand-blue text-white',
  red: 'bg-brand-red text-white',
  neutral: 'bg-white text-neutral-900 dark:bg-surface-card dark:text-white',
}

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  actions,
  metric,
  tone = 'neutral',
  imagePosition = 'object-center',
}: WorkspaceHeroProps) {
  const colored = tone !== 'neutral'
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card dark:border-white/10 dark:bg-surface-card"
    >
      <div className="grid min-h-[220px] md:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <div className={cn('relative z-10 flex min-w-0 flex-col justify-center overflow-hidden border-b-4 border-brand-yellow p-5 sm:p-6 md:border-b-0 md:border-r-4 lg:p-7', tones[tone])}>
          {/* Soft brand mesh adds depth behind the copy without fighting it. */}
          {!colored && <span aria-hidden="true" className="mesh-joy pointer-events-none absolute inset-0 opacity-70" />}
          {colored && <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/10 blur-2xl" />}
          <div className="relative">
            <p className={cn('inline-flex w-fit items-center gap-2 text-xs font-extrabold', colored ? 'text-brand-yellow' : 'text-brand-red')}>
              <span className="relative flex size-2" aria-hidden="true">
                {!prefersReducedMotion && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-75', colored ? 'bg-brand-yellow' : 'bg-brand-red')} />}
                <span className={cn('relative inline-flex size-2 rounded-full', colored ? 'bg-brand-yellow' : 'bg-brand-red')} />
              </span>
              {eyebrow}
            </p>
            <h1 className={cn('mt-2 max-w-2xl font-display text-3xl font-extrabold leading-tight text-balance lg:text-4xl', colored ? 'text-white' : 'text-neutral-950 dark:text-white')}>
              {title}
            </h1>
            <p className={cn('mt-2 max-w-xl text-sm font-semibold leading-6 text-pretty', colored ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-300')}>
              {description}
            </p>
            {(actions || metric) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {actions}
                {metric}
              </div>
            )}
          </div>
        </div>
        <div className="relative min-h-44 overflow-hidden bg-brand-cream dark:bg-surface-overlay">
          <motion.div
            className={cn('absolute inset-0', imagePosition)}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.12 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={prefersReducedMotion ? undefined : { duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <IllustrationPlaceholder variant={image ?? imageAlt} size="scene" className="size-full" />
          </motion.div>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          {/* Tone-aware blend along the panel edge so the photo melts into the copy panel. */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b to-transparent md:inset-x-auto md:inset-y-0 md:left-0 md:h-auto md:w-16 md:bg-gradient-to-r',
              tone === 'blue' && 'from-brand-blue/25',
              tone === 'red' && 'from-brand-red/25',
              tone === 'neutral' && 'from-brand-cream/70 dark:from-black/30',
            )}
          />
        </div>
      </div>
    </motion.header>
  )
}

interface SectionHeaderProps {
  eyebrow: string
  title: string
  titleId?: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({ eyebrow, title, titleId, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-neutral-200 pb-3 dark:border-white/10 sm:flex-row sm:items-end">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-1 h-10 w-1 shrink-0 rounded-full bg-brand-red" aria-hidden="true" />
        <div>
          <p className="text-xs font-bold text-brand-blue">{eyebrow}</p>
          <h2 id={titleId} className="mt-1 font-display text-2xl font-extrabold text-neutral-900 text-balance dark:text-white">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-neutral-500 text-pretty dark:text-neutral-400">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
