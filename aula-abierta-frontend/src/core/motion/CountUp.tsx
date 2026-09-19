import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { EASE_OUT } from './variants'

type CountUpProps = {
  value: number
  /** Animation length in ms. Default 900. */
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  /** Only animate when scrolled into view. Default true. */
  onView?: boolean
}

const easeOut = (t: number) => {
  // Cubic-bezier EASE_OUT sampled — smooth deceleration matching the motion system.
  const [, , , p3] = EASE_OUT
  return 1 - Math.pow(1 - t, 2 + p3)
}

/**
 * Counts a number up from 0 to `value` on mount (or when scrolled into view).
 * Respects prefers-reduced-motion (snaps to final value).
 */
export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  onView = true,
}: CountUpProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(prefersReduced ? value : 0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value)
      return
    }

    let raf = 0
    const run = () => {
      if (startedRef.current) return
      startedRef.current = true
      const start = performance.now()
      const tick = (now: number) => {
        // rAF timestamps can precede the captured start time by a frame — clamp
        // to zero so the first paint never shows a negative value ("-0 days").
        const t = Math.min(1, Math.max(0, (now - start) / duration))
        setDisplay(value * easeOut(t))
        if (t < 1) raf = requestAnimationFrame(tick)
        else setDisplay(value)
      }
      raf = requestAnimationFrame(tick)
    }

    if (!onView) {
      run()
      return () => cancelAnimationFrame(raf)
    }

    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run()
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration, prefersReduced, onView])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
