import type { Transition, Variants } from 'framer-motion'

/**
 * Aula Abierta motion system — the single source of truth for animation timing.
 *
 * One easing scale, one duration scale, one elevation feel so every surface
 * shares the same physical language. Import these instead of hand-writing
 * transitions per component.
 */

// ── Easing & duration scales ────────────────────────────────────────────────
/** Smooth, confident deceleration (easeOutExpo-ish). The default for entrances. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
/** Gentle in-out for loops and reversible motion. */
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1]
/** Snappy anticipation for playful, kid-friendly pops. */
export const EASE_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

export const DURATION = {
  fast: 0.18,
  base: 0.32,
  slow: 0.5,
  xslow: 0.8,
} as const

/** Playful spring used for cards, badges, and celebratory pops. */
export const SPRING_POP: Transition = { type: 'spring', stiffness: 420, damping: 26, mass: 0.7 }
/** Soft spring for layout shifts and drawers. */
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 30 }

// ── Entrance variants ───────────────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_OUT } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -18 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: SPRING_POP },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: SPRING_POP },
}

// ── Stagger containers ──────────────────────────────────────────────────────
/** Parent for a list/grid — children using `fadeInUp`/`scaleIn` cascade in. */
export const staggerContainer = (stagger = 0.07, delayChildren = 0.04): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

/** Default child for stagger containers. */
export const staggerItem: Variants = fadeInUp

// ── Hover / tap micro-interactions ──────────────────────────────────────────
export const hoverLift = {
  whileHover: { y: -4, transition: { duration: DURATION.fast, ease: EASE_OUT } },
  whileTap: { scale: 0.98 },
}

export const hoverPop = {
  whileHover: { scale: 1.04, transition: SPRING_POP },
  whileTap: { scale: 0.96 },
}

// ── Page transition (used by AppShell route changes) ────────────────────────
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
  exit: { opacity: 0, y: -6, transition: { duration: DURATION.fast, ease: EASE_OUT } },
}
