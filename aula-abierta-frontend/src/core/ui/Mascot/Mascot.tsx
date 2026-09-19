import { motion, useReducedMotion, type TargetAndTransition, type Transition } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@core/utils'

export type MascotMood = 'idle' | 'cheer' | 'sleep' | 'point' | 'think' | 'wave'
type MascotSize = 'sm' | 'md' | 'lg' | 'xl'

interface MascotProps {
  mood?: MascotMood
  size?: MascotSize
  className?: string
  flip?: boolean
}

const sizeMap: Record<MascotSize, string> = { sm: 'h-16', md: 'h-24', lg: 'h-36', xl: 'h-52' }
const bodyAnim: Record<MascotMood, { animate: TargetAndTransition; transition: Transition }> = {
  idle: { animate: { y: [0, -5, 0], rotate: [-1, 1, -1] }, transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } },
  cheer: { animate: { y: [0, -10, 0], rotate: [-3, 3, -3] }, transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } },
  sleep: { animate: { rotate: [-2, 0, -2] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
  point: { animate: { rotate: [0, 2, 0] }, transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
  think: { animate: { y: [0, -3, 0] }, transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } },
  wave: { animate: { rotate: [-2, 4, -2] }, transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
}

export function Mascot({ mood = 'idle', size = 'md', className, flip = false }: MascotProps) {
  const prefersReduced = useReducedMotion()
  const body = bodyAnim[mood]
  return (
    <div className={cn('relative inline-block select-none', className)} aria-hidden="true">
      <span className="absolute inset-x-2 bottom-1 h-3 rounded-full bg-brand-ink/15 blur-md dark:bg-black/40" />
      <motion.svg viewBox="0 0 180 210" className={cn('relative w-auto', sizeMap[size], flip && '-scale-x-100')} animate={prefersReduced ? undefined : body.animate} transition={prefersReduced ? undefined : body.transition} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M36 74C36 34 62 13 90 13s54 21 54 61v70c0 31-22 52-54 52s-54-21-54-52V74Z" fill="#F8FBFF" stroke="#25354A" strokeWidth="7" />
        <path d="M39 71C24 52 21 35 31 28c13-9 28 8 39 28" fill="#1D95FB" stroke="#25354A" strokeWidth="7" strokeLinecap="round" />
        <path d="M141 71c15-19 18-36 8-43-13-9-28 8-39 28" fill="#FED401" stroke="#25354A" strokeWidth="7" strokeLinecap="round" />
        <circle cx="69" cy="91" r="16" fill="#EAF6FF" stroke="#25354A" strokeWidth="6" />
        <circle cx="111" cy="91" r="16" fill="#EAF6FF" stroke="#25354A" strokeWidth="6" />
        <circle cx="69" cy="91" r="5" fill="#25354A" /><circle cx="111" cy="91" r="5" fill="#25354A" />
        <path d="M82 115h16l-8 14-8-14Z" fill="#D31A2A" stroke="#25354A" strokeWidth="4" strokeLinejoin="round" />
        <path d="M62 157c16 12 40 12 56 0" stroke="#25354A" strokeWidth="6" strokeLinecap="round" />
        <path d="M45 146c-20 7-27 20-18 30 9 10 23-1 34-15M135 146c20 7 27 20 18 30-9 10-23-1-34-15" stroke="#25354A" strokeWidth="7" strokeLinecap="round" />
        <path d="M67 198v9M113 198v9" stroke="#25354A" strokeWidth="8" strokeLinecap="round" />
      </motion.svg>
      {mood === 'cheer' && !prefersReduced && <Sparkles className="absolute -right-1 top-1 text-brand-yellow" size={18} aria-hidden="true" />}
      {mood === 'point' && <span className="absolute -bottom-1 right-0 flex size-7 items-center justify-center rounded-full bg-brand-yellow text-brand-ink shadow-sm">→</span>}
    </div>
  )
}
