/**
 * Mode 1 — Flashcard flip.
 * Shows the English word; tap to reveal translation; self-rate Again / Got it.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '@core/utils'
import { SPRING_POP, EASE_OUT } from '@core/motion'
import type { SrsCard } from '../srs'

interface Props {
  card: SrsCard
  onAnswer: (correct: boolean) => void
}

export function FlashcardMode({ card, onAnswer }: Props) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card */}
      <div className="perspective-[1200px] w-full max-w-sm">
        <motion.div
          className="relative h-52 w-full cursor-pointer"
          onClick={() => !flipped && setFlipped(true)}
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[28px] bg-brand-blue p-8 text-center text-white shadow-soft"
            style={{ backfaceVisibility: 'hidden' }}
            aria-hidden={flipped}
          >
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/60">English word</p>
            <p className="font-display text-4xl font-extrabold leading-tight text-white">{card.word}</p>
            <span className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white/70">
              <Eye size={13} aria-hidden="true" /> Tap to reveal
            </span>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[28px] bg-brand-yellow p-8 text-center shadow-soft"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            aria-hidden={!flipped}
          >
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand-ink/50">Translation</p>
            <p className="font-display text-4xl font-extrabold leading-tight text-brand-ink">{card.translation}</p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons — only show after flip */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING_POP}
            className="flex w-full max-w-sm gap-4"
          >
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-[20px] border-2 border-brand-red/30 bg-red-50 py-4',
                'text-sm font-extrabold text-brand-red transition-all duration-150',
                'hover:bg-brand-red hover:text-white hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
                'dark:border-brand-red/40 dark:bg-brand-red/10 dark:text-brand-red dark:hover:bg-brand-red dark:hover:text-white',
              )}
              aria-label="I got it wrong — review again"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Again
              <ThumbsDown size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onAnswer(true)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-[20px] border-2 border-emerald-300 bg-emerald-50 py-4',
                'text-sm font-extrabold text-emerald-700 transition-all duration-150',
                'hover:bg-emerald-500 hover:text-white hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
                'dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white',
              )}
              aria-label="I got it right — move to next box"
            >
              <ThumbsUp size={14} aria-hidden="true" />
              Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
