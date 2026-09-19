import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@core/utils'
import { SPRING_POP } from '@core/motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

// "Candy button" treatment — gradient fill, an inset top highlight, and a
// colored bottom-edge lip (via layered box-shadow) give every CTA tactile depth.
const variantClasses: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-red shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_4px_0_-1px_#A50F1E,0_10px_20px_-8px_rgba(211,26,42,0.55)] hover:brightness-[1.05] active:translate-y-[2px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_0_-1px_#A50F1E] disabled:bg-none disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none disabled:translate-y-0',
  secondary:
    'bg-white text-neutral-800 border border-neutral-300 hover:border-brand-blue hover:text-brand-blue hover:shadow-soft active:bg-brand-sky/20 disabled:border-neutral-300 disabled:text-neutral-400 shadow-sm dark:bg-white/[.04] dark:text-white dark:border-white/15',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 disabled:text-neutral-400 dark:text-neutral-200 dark:hover:bg-white/[.06]',
  danger:
    'text-white bg-gradient-red shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_4px_0_-1px_#A50F1E,0_10px_20px_-8px_rgba(211,26,42,0.55)] hover:brightness-[1.05] active:translate-y-[2px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_0_-1px_#A50F1E] disabled:bg-none disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none disabled:translate-y-0',
}

// Variants that get the sweeping glare/shine on hover.
const sheenVariants: Variant[] = ['primary', 'danger']

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-10 px-3 text-sm gap-1.5 rounded-input',
  md: 'min-h-11 px-5 text-sm gap-2 rounded-input',
  lg: 'h-12 px-6 text-base gap-2  rounded-input',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading
    const prefersReduced = useReducedMotion()
    const showSheen = sheenVariants.includes(variant) && !isDisabled

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled || prefersReduced ? undefined : { scale: 0.96 }}
        transition={SPRING_POP}
        disabled={isDisabled}
        className={cn(
          'group/btn relative inline-flex items-center justify-center overflow-hidden font-body font-semibold',
          'transition-[filter,transform,box-shadow,background-color,border-color,color] duration-150 select-none whitespace-nowrap',
          'disabled:cursor-not-allowed disabled:shadow-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...(rest as object)}
      >
        {showSheen && !prefersReduced && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-3 w-1/3 -translate-x-[250%] skew-x-[-18deg] bg-white/30 blur-[2px] transition-transform duration-700 ease-out group-hover/btn:translate-x-[450%]"
          />
        )}
        {loading ? (
          <Loader2 className="relative shrink-0 animate-spin" size={size === 'sm' ? 14 : 16} />
        ) : (
          leftIcon && <span className="relative shrink-0">{leftIcon}</span>
        )}
        {children != null && <span className="relative">{children}</span>}
        {!loading && rightIcon && <span className="relative shrink-0">{rightIcon}</span>}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
