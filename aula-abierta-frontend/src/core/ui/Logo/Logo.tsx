import { cn } from '@core/utils'

type LogoVariant = 'vertical' | 'horizontal' | 'isotype'

interface LogoProps {
  variant?: LogoVariant
  height?: number
  className?: string
  tone?: 'default' | 'light'
}

export function Logo({ variant = 'horizontal', height = 40, className, tone = 'default' }: LogoProps) {
  const isotype = variant === 'isotype'
  const ink = tone === 'light' ? '#FFFFFF' : '#172033'

  return (
    <span
      className={cn('inline-flex items-center gap-2', isotype ? 'justify-center rounded-xl bg-brand-blue' : '', className)}
      style={{ height, width: isotype ? height : 'auto' }}
      aria-label="Aula Abierta"
    >
      <svg viewBox="0 0 44 44" aria-hidden="true" className="shrink-0" style={{ width: isotype ? height * .62 : height * .72, height: height * .72 }}>
        <path d="M5 10.5C12 7 17.7 8 22 12.5V36c-4.7-4.1-10.3-5.2-17-2.2V10.5Z" fill="#1D95FB" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M39 10.5C32 7 26.3 8 22 12.5V36c4.7-4.1 10.3-5.2 17-2.2V10.5Z" fill="#FED401" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M22 12.5V36" stroke={ink} strokeWidth="2.2" />
        <path d="M12 16.5h5M27 16.5h5" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      </svg>
      {!isotype && (
        <span className={cn('font-display text-xl font-extrabold leading-none', variant === 'vertical' && 'max-w-[5ch] text-center', tone === 'light' ? 'text-white' : 'text-neutral-900')}>
          Aula <span className="text-brand-red">Abierta</span>
        </span>
      )}
    </span>
  )
}
