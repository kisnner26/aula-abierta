import { type ElementType, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from './variants'

type RevealProps = {
  children: ReactNode
  as?: ElementType
  variants?: Variants
  /** Re-run the animation every time it scrolls into view. Default: once. */
  repeat?: boolean
  /** Fraction of the element visible before triggering. Default 0.2. */
  amount?: number
  delay?: number
  className?: string
}

/**
 * Reveals its children with a scroll-triggered entrance. Respects
 * prefers-reduced-motion (renders statically). Default motion is `fadeInUp`.
 */
export function Reveal({
  children,
  as = 'div',
  variants = fadeInUp,
  repeat = false,
  amount = 0.2,
  delay,
  className,
}: RevealProps) {
  const prefersReduced = useReducedMotion()
  const MotionTag = motion(as as ElementType)

  if (prefersReduced) {
    const Tag = as as ElementType
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: !repeat, amount }}
      transition={delay !== undefined ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  )
}

type StaggerProps = {
  children: ReactNode
  as?: ElementType
  stagger?: number
  delayChildren?: number
  amount?: number
  repeat?: boolean
  className?: string
}

/**
 * Container that cascades its <Stagger.Item> children into view.
 * Pair with `Stagger.Item` (or any child using `staggerItem` variants).
 */
export function Stagger({
  children,
  as = 'div',
  stagger = 0.07,
  delayChildren = 0.04,
  amount = 0.15,
  repeat = false,
  className,
}: StaggerProps) {
  const prefersReduced = useReducedMotion()
  const MotionTag = motion(as as ElementType)

  if (prefersReduced) {
    const Tag = as as ElementType
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: !repeat, amount }}
    >
      {children}
    </MotionTag>
  )
}

type StaggerItemProps = {
  children: ReactNode
  as?: ElementType
  variants?: Variants
  className?: string
}

function StaggerItem({ children, as = 'div', variants = staggerItem, className }: StaggerItemProps) {
  const prefersReduced = useReducedMotion()
  const MotionTag = motion(as as ElementType)

  if (prefersReduced) {
    const Tag = as as ElementType
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag className={className} variants={variants}>
      {children}
    </MotionTag>
  )
}

Stagger.Item = StaggerItem
