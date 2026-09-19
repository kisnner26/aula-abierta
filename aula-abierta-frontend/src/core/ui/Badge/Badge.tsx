type BadgeStatus =
  | 'active'
  | 'pending'
  | 'submitted'
  | 'graded'
  | 'overdue'
  | 'closed'
  | 'draft'
  | 'info'

interface BadgeProps {
  status: BadgeStatus
  label?: string
  dot?: boolean
  className?: string
}

const statusConfig: Record<BadgeStatus, { label: string; classes: string; dot: string; pulse?: boolean }> = {
  active:    { label: 'Active',    classes: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',       dot: 'bg-green-500', pulse: true },
  pending:   { label: 'Pending',   classes: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30', dot: 'bg-brand-yellow', pulse: true },
  submitted: { label: 'Submitted', classes: 'bg-brand-sky/40 text-blue-800 border-brand-sky dark:bg-brand-blue/15 dark:text-brand-sky dark:border-brand-blue/30',  dot: 'bg-brand-blue' },
  graded:    { label: 'Graded',    classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30', dot: 'bg-purple-500' },
  overdue:   { label: 'Overdue',   classes: 'bg-red-50 text-brand-red border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',                 dot: 'bg-brand-red', pulse: true },
  closed:    { label: 'Closed',    classes: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-white/[.06] dark:text-neutral-300 dark:border-white/10',    dot: 'bg-neutral-400' },
  draft:     { label: 'Draft',     classes: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-white/[.04] dark:text-neutral-400 dark:border-white/10',     dot: 'bg-neutral-300' },
  info:      { label: 'Info',      classes: 'bg-brand-sky/30 text-brand-blue border-brand-sky dark:bg-brand-blue/15 dark:text-brand-sky dark:border-brand-blue/30', dot: 'bg-brand-blue' },
}

export function Badge({ status, label, dot = true, className = '' }: BadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'text-xs font-semibold rounded-full border',
        config.classes,
        className,
      ].join(' ')}
    >
      {dot && (
        <span className="relative flex size-1.5 shrink-0">
          {config.pulse && (
            <span className={['absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none', config.dot].join(' ')} />
          )}
          <span className={['relative inline-flex size-1.5 rounded-full', config.dot].join(' ')} />
        </span>
      )}
      {label ?? config.label}
    </span>
  )
}
