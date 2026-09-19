/**
 * Mode 4 — Listen and pick.
 * Uses window.speechSynthesis to speak the English word; student picks the
 * matching English word from four options.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Volume2, XCircle } from 'lucide-react'
import { cn } from '@core/utils'
import { SPRING_POP } from '@core/motion'
import type { SrsCard } from '../srs'

const LABELS = ['A', 'B', 'C', 'D'] as const

interface Props {
  card: SrsCard
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

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function ListenPickMode({ card, allCards, onAnswer }: Props) {
  const options = useMemo(() => {
    const distractors = allCards
      .filter((c) => c.id !== card.id)
      .map((c) => c.word)
    const picked = shuffle(distractors).slice(0, 3)
    return shuffle([card.word, ...picked])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  const [selected, setSelected] = useState<number | null>(null)

  const playWord = useCallback(() => speak(card.word), [card.word])

  // Auto-speak on mount and whenever card changes
  useEffect(() => {
    playWord()
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    }
  }, [playWord])

  function handlePick(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const isCorrect = options[idx] === card.word
    setTimeout(() => onAnswer(isCorrect), 750)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Listen prompt */}
      <div className="flex flex-col items-center gap-4 rounded-[28px] bg-brand-sky px-8 py-8 text-center shadow-soft dark:bg-brand-sky/20">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-ink/50 dark:text-white/50">
          Listen and pick the word you hear
        </p>
        <button
          type="button"
          onClick={playWord}
          className={cn(
            'flex size-20 items-center justify-center rounded-full bg-brand-blue text-white shadow-soft',
            'transition-all duration-150 hover:scale-105 hover:bg-blue-600 motion-reduce:hover:scale-100',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/40',
          )}
          aria-label={`Play audio: ${card.word}`}
        >
          <Volume2 size={32} aria-hidden="true" />
        </button>
        <p className="text-xs font-semibold text-brand-ink/40 dark:text-white/40">Tap to hear again</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Word options">
        {options.map((opt, i) => {
          const answered = selected !== null
          const isCorrect = opt === card.word
          const isMyPick = selected === i

          return (
            <motion.button
              key={opt}
              type="button"
              whileTap={answered ? {} : { scale: 0.96 }}
              onClick={() => handlePick(i)}
              disabled={answered}
              transition={SPRING_POP}
              className={cn(
                'relative flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-[22px] p-4 text-center font-bold shadow-soft',
                'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70',
                answered
                  ? isCorrect
                    ? 'bg-emerald-500 text-white'
                    : isMyPick
                    ? 'bg-brand-red/80 text-white'
                    : 'bg-neutral-100 text-neutral-300 dark:bg-white/5 dark:text-white/20'
                  : 'cursor-pointer bg-white text-neutral-900 hover:bg-brand-cream hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
              )}
              aria-label={`Option ${LABELS[i]}: ${opt}`}
              aria-pressed={isMyPick}
            >
              <span
                className={cn(
                  'mb-0.5 flex size-7 items-center justify-center rounded-lg text-xs font-extrabold',
                  answered && isCorrect ? 'bg-white/30' : answered ? 'bg-black/10' : 'bg-neutral-100 dark:bg-white/10',
                )}
                aria-hidden="true"
              >
                {LABELS[i]}
              </span>
              <span className="text-sm font-bold leading-5">{opt}</span>

              {answered && isCorrect && (
                <CheckCircle2 size={16} className="absolute right-3 top-3 text-white" aria-hidden="true" />
              )}
              {answered && isMyPick && !isCorrect && (
                <XCircle size={16} className="absolute right-3 top-3 text-white" aria-hidden="true" />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {selected !== null && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'text-center text-sm font-extrabold',
              options[selected] === card.word ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-red',
            )}
            aria-live="polite"
          >
            {options[selected] === card.word
              ? 'You heard it perfectly!'
              : `The word was "${card.word}"`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
