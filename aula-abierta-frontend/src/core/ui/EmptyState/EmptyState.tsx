import type { ReactNode } from 'react'
import { Mascot, type MascotMood } from '../Mascot'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  /** Mascot mood for the illustration. Default 'sleep' (nothing here yet). */
  mood?: MascotMood
}

export function EmptyState({ icon, title, description, action, className = '', mood = 'sleep' }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center',
        'gap-4 px-6 py-12',
        className,
      ].join(' ')}
    >
      <div className="relative">
        <Mascot mood={mood} size="md" />
        {icon && (
          <span className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-2xl bg-gradient-red text-white shadow-red-soft ring-4 ring-white dark:ring-surface-card">
            {icon}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 max-w-xs">
        <p className="font-display text-lg font-extrabold text-neutral-800 dark:text-white">{title}</p>
        {description && (
          <p className="text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
