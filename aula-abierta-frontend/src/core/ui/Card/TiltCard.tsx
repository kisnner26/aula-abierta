import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { cn } from '@core/utils'

type TiltCardProps = {
  children: ReactNode
  className?: string
  /** Max tilt in degrees. Default 7. */
  intensity?: number
  /** Lift on hover, px. Default 6. */
  lift?: number
}

/**
 * A tactile "toy card" wrapper that tilts in 3D toward the cursor and lifts on
 * hover, then springs back on leave. Respects prefers-reduced-motion (static).
 * Pair the `.toy-card` class via `className` for the full effect.
 */
export function TiltCard({ children, className, intensity = 7, lift = 6 }: TiltCardProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), { stiffness: 240, damping: 18 })
  const ry = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), { stiffness: 240, damping: 18 })

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  const onLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={{ y: -lift }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={cn('toy-tilt will-change-transform', className)}
    >
      {/* Inner layer sits slightly forward for depth. */}
      <div style={{ transform: 'translateZ(20px)' }} className="h-full">
        {children}
      </div>
    </motion.div>
  )
}
