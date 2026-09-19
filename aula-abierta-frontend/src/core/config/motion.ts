import type { Variants } from 'framer-motion'

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export const cardContainerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const cardItemVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } },
}

export const buttonSpring = {
  whileTap: { scale: 0.95 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 18 },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
}

export const slideUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.14 } },
}
