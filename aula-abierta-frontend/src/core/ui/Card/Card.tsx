import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@core/utils'
import { EASE_OUT } from '@core/motion'

type CardVariant = 'default' | 'elevated' | 'interactive'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  header?: ReactNode
  footer?: ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default:     'toy-card',
  elevated:    'toy-card shadow-card',
  interactive: 'toy-card cursor-pointer transition-[box-shadow,border-color,transform] duration-300 hover:border-brand-sky hover:shadow-brand dark:hover:border-brand-blue/40',
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = 'default', padding = 'md', header, footer, children, className = '', ...rest },
    ref,
  ) => {
    const isInteractive = variant === 'interactive'
    const prefersReduced = useReducedMotion()

    const inner = (
      <div ref={ref} className={cn(variantClasses[variant], className)} {...rest}>
        {header && (
          <div className="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-white/10">{header}</div>
        )}
        <div className={header || footer ? 'p-6' : paddingClasses[padding]}>{children}</div>
        {footer && (
          <div className="px-6 py-4 pt-0 border-t border-neutral-100 bg-neutral-50/50 rounded-b-card dark:border-white/10 dark:bg-white/[.03]">
            {footer}
          </div>
        )}
      </div>
    )

    if (isInteractive && !prefersReduced) {
      return (
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
        >
          {inner}
        </motion.div>
      )
    }

    return inner
  },
)

Card.displayName = 'Card'
