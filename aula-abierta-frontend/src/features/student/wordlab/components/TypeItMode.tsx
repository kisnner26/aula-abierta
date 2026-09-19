/**
 * Mode 3 — Type it.
 * Student types the translation; answer is compared with normalised string equality.
 */
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Keyboard, XCircle } from 'lucide-react'
import { cn } from '@core/utils'
import { SPRING_POP } from '@core/motion'
import { Input } from '@core/ui'
import type { SrsCard } from '../srs'

interface Props {
  card: SrsCard
  onAnswer: (correct: boolean) => void
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function TypeItMode({ card, onAnswer }: Props) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitted || !value.trim()) return

    const isCorrect = normalize(value) === normalize(card.translation)
    setCorrect(isCorrect)
    setSubmitted(true)
    setTimeout(() => onAnswer(isCorrect), 900)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Prompt */}
      <div className="flex flex-col items-center gap-2 rounded-[28px] bg-brand-yellow px-8 py-7 text-center shadow-soft">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-ink/50">
          Type the translation
        </p>
        <p className="font-display text-4xl font-extrabold text-brand-ink">{card.word}</p>
        <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-ink/50">
          <Keyboard size={13} aria-hidden="true" /> Type it in Spanish
        </span>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-label="Type the translation">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => !submitted && setValue(e.target.value)}
          placeholder="Write the translation…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={submitted}
          aria-label="Your answer"
          className={cn(
            'text-center text-base font-bold transition-colors duration-200',
            submitted && correct === true
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : submitted && correct === false
              ? 'border-brand-red/60 bg-red-50 text-brand-red dark:bg-brand-red/10'
              : '',
          )}
        />

        {!submitted && (
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            transition={SPRING_POP}
            disabled={!value.trim()}
            className={cn(
              'flex min-h-12 items-center justify-center rounded-[18px] text-sm font-extrabold transition-all duration-150',
              value.trim()
                ? 'bg-brand-blue text-white hover:bg-blue-600 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0'
                : 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-white/10 dark:text-white/30',
            )}
          >
            Check answer
          </motion.button>
        )}
      </form>

      {/* Feedback */}
      <AnimatePresence>
        {submitted && correct !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING_POP}
            className={cn(
              'flex items-center justify-center gap-2 rounded-[20px] py-4 text-sm font-extrabold',
              correct
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-red-50 text-brand-red dark:bg-brand-red/10',
            )}
            aria-live="polite"
          >
            {correct ? (
              <>
                <CheckCircle2 size={17} aria-hidden="true" />
                Correct! You nailed it.
              </>
            ) : (
              <>
                <XCircle size={17} aria-hidden="true" />
                The answer is &ldquo;{card.translation}&rdquo;
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
