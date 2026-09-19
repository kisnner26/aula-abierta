import { useEffect, useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CountUp } from '@core/motion'
import { cn } from '@core/utils'

interface ProgressRingProps {
  value: number
  size?: 'sm' | 'lg'
  label?: string
  className?: string
}

export function ProgressRing({ value, size = 'lg', label, className }: ProgressRingProps) {
  const safeValue = Math.min(100, Math.max(0, value))
  const radius = size === 'lg' ? 54 : 32
  const strokeWidth = size === 'lg' ? 11 : 7
  const dimension = (radius + strokeWidth) * 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safeValue / 100) * circumference
  const gradientId = useId()
  const prefersReduced = useReducedMotion()
  const complete = safeValue >= 100

  // Draw the ring in once it scrolls into view.
  const ref = useRef<SVGSVGElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && (setInView(true), observer.disconnect()),
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const animateTo = prefersReduced ? offset : inView ? offset : circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Soft glow that intensifies near completion. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-2 rounded-full blur-xl transition-opacity duration-700',
          complete ? 'bg-brand-yellow/40 opacity-100' : 'bg-brand-blue/20 opacity-70',
        )}
      />
      <svg
        ref={ref}
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="relative -rotate-90"
        role="img"
        aria-label={`${label ?? 'Progress'}: ${safeValue}%`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1D95FB" />
            <stop offset="100%" stopColor={complete ? '#FED401' : '#38A6FF'} />
          </linearGradient>
        </defs>
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-100 dark:text-white/10"
        />
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: prefersReduced ? offset : circumference }}
          animate={{ strokeDashoffset: animateTo }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute text-center">
        <p className={cn('font-display font-extrabold tabular-nums text-neutral-900 dark:text-white', size === 'lg' ? 'text-3xl' : 'text-lg')}>
          {inView || prefersReduced ? <CountUp value={safeValue} duration={1100} onView={false} suffix="%" /> : '0%'}
        </p>
        {label && size === 'lg' && <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{label}</p>}
      </div>
    </div>
  )
}
