import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react'
import { cn } from '@core/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, helperText, error, leftIcon, rightIcon, fullWidth = false, className = '', id, ...rest },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const hasError = Boolean(error)

    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold leading-none text-neutral-700 dark:text-neutral-200"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-4 text-brand-blue">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'form-input min-h-12 w-full font-body text-sm font-semibold text-neutral-900 placeholder:font-medium placeholder:text-neutral-400',
              'rounded-xl border bg-white shadow-sm transition-colors duration-150 dark:bg-surface-card dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue',
              hasError
                ? 'border-brand-red focus:ring-brand-red/30 focus:border-brand-red'
                : 'border-neutral-300 hover:border-neutral-400',
              leftIcon  ? 'pl-11' : 'pl-4',
              rightIcon ? 'pr-11' : 'pr-4',
              'py-3',
              'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...rest}
          />

          {rightIcon && (
            <span className="pointer-events-none absolute right-4 text-neutral-400">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-brand-red font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
