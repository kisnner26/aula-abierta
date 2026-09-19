import { Repeat2 } from 'lucide-react'
import { cn } from '@core/utils'

interface ShadowToggleProps {
  enabled: boolean
  onToggle: () => void
}

/**
 * Shadow-mode: auto-plays the model pronunciation then arms recording.
 * Displayed as a pill toggle with accessible role="switch".
 */
export function ShadowToggle({ enabled, onToggle }: ShadowToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label="Shadow mode — listens then records automatically"
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors',
        enabled
          ? 'bg-brand-yellow text-brand-ink shadow-md'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
      )}
    >
      <Repeat2 className="h-4 w-4" aria-hidden="true" />
      Shadow mode
      {/* Visual toggle pill */}
      <span
        aria-hidden="true"
        className={cn(
          'ml-1 inline-flex h-5 w-9 items-center rounded-full transition-colors',
          enabled ? 'bg-brand-ink/20' : 'bg-neutral-300 dark:bg-neutral-600',
        )}
      >
        <span
          className={cn(
            'h-4 w-4 rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}
