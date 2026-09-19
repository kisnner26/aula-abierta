/**
 * Mode 2 — Multiple choice.
 * Show the English word; pick the correct translation from 4 options.
 */
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@core/utils'
import { SPRING_POP } from '@core/motion'
import type { SrsCard } from '../srs'

// Palette cycles through 4 brand colours for answer tiles
const TILE_COLORS = [
  {
    idle: 'bg-brand-blue text-white hover:bg-blue-700',
    correct: 'bg-emerald-500 text-white',
    wrong: 'bg-neutral-200 text-neutral-400 dark:bg-white/10 dark:text-white/30',
    myWrong: 'bg-brand-red/80 text-white line-through',
  },
  {
    idle: 'bg-brand-red text-white hover:bg-red-700',
    correct: 'bg-emerald-500 text-white',
    wrong: 'bg-neutral-200 text-neutral-400 dark:bg-white/10 dark:text-white/30',
    myWrong: 'bg-brand-red/80 text-white line-through',
  },
  {
    idle: 'bg-brand-yellow text-brand-ink hover:bg-yellow-300',
    correct: 'bg-emerald-500 text-white',
    wrong: 'bg-neutral-200 text-neutral-400 dark:bg-white/10 dark:text-white/30',
    myWrong: 'bg-brand-red/80 text-white line-through',
  },
  {
    idle: 'bg-brand-sky text-brand-ink hover:bg-sky-300',
    correct: 'bg-emerald-500 text-white',
    wrong: 'bg-neutral-200 text-neutral-400 dark:bg-white/10 dark:text-white/30',
    myWrong: 'bg-brand-red/80 text-white line-through',
  },
] as const

const LABELS = ['A', 'B', 'C', 'D'] as const

interface Props {
  card: SrsCard
  /** All deck cards used to generate distractors */
  allCards: SrsCard[]
  onAnswer: (correct: boolean) => void
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function MultiChoiceMode({ card, allCards, onAnswer }: Props) {
  // Build stable set of 4 options (correct + 3 distractors) for this card
  const options = useMemo(() => {
    const distractors = allCards
      .filter((c) => c.id !== card.id)
      .map((c) => c.translation)
    const shuffledDistractors = shuffle(distractors).slice(0, 3)
    return shuffle([card.translation, ...shuffledDistractors])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  const [picked, setPicked] = useState<number | null>(null)

  function handlePick(idx: number) {
    if (picked !== null) return
    setPicked(idx)
    const isCorrect = options[idx] === card.translation
    // Delay so the user sees feedback
    setTimeout(() => onAnswer(isCorrect), 750)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Prompt */}
      <div className="flex flex-col items-center gap-2 rounded-[28px] bg-brand-blue px-8 py-7 text-center text-white shadow-soft">
        <p className="text-xs font-extrabold uppercase tracking-widest text-white/60">What does this mean?</p>
        <p className="font-display text-4xl font-extrabold text-white">{card.word}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Answer options">
        {options.map((opt, i) => {
          const palette = TILE_COLORS[i % TILE_COLORS.length]!
          const answered = picked !== null
          const isCorrect = opt === card.translation
          const isMyPick = picked === i

          const colorClass = answered
            ? isCorrect
              ? palette.correct
              : isMyPick
              ? palette.myWrong
              : palette.wrong
            : palette.idle

          return (
            <motion.button
              key={opt}
              type="button"
              whileTap={answered ? {} : { scale: 0.96 }}
              onClick={() => handlePick(i)}
              disabled={answered}
              transition={SPRING_POP}
              className={cn(
                'relative flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-[22px] p-4 text-center font-bold shadow-soft',
                'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70',
                answered ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
                colorClass,
              )}
              aria-label={`Option ${LABELS[i]}: ${opt}`}
              aria-pressed={isMyPick}
            >
              <span
                className={cn(
                  'mb-0.5 flex size-8 items-center justify-center rounded-xl text-xs font-extrabold',
                  answered && isCorrect ? 'bg-white/25' : answered ? 'bg-black/10' : 'bg-white/20',
                )}
                aria-hidden="true"
              >
                {LABELS[i]}
              </span>
              <span className="text-sm font-bold leading-5">{opt}</span>

              {answered && isCorrect && (
                <CheckCircle2 size={18} className="absolute right-3 top-3" aria-hidden="true" />
              )}
              {answered && isMyPick && !isCorrect && (
                <XCircle size={18} className="absolute right-3 top-3" aria-hidden="true" />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Inline feedback */}
      <AnimatePresence>
        {picked !== null && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'text-center text-sm font-extrabold',
              options[picked] === card.translation ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-red',
            )}
            aria-live="polite"
          >
            {options[picked] === card.translation
              ? 'Correct — learning move!'
              : `The answer was "${card.translation}"`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
