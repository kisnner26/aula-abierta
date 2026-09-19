import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Brain, Check, RotateCcw, Volume2, X } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Button, EmptyState, Mascot, Skeleton } from '@core/ui'
import { CountUp, EASE_OUT, celebrate } from '@core/motion'
import { useAuth } from '@core/auth/useAuth'
import { useSound } from '@core/hooks/useSound'
import { studentApi } from '../api'
import { cn } from '@core/utils'
import { getDeck, dueCards, review, type WordPair, type SrsCard } from './srs'

type Mode = 'flashcard' | 'choice' | 'type' | 'listen'
const MODES: Mode[] = ['flashcard', 'choice', 'type', 'listen']

function parseVocabulary(raw: string | undefined | null): WordPair[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((pair) => {
      const [word, translation] = pair.split(':')
      return { word: (word ?? '').trim(), translation: (translation ?? '').trim() }
    })
    .filter((p) => p.word.length > 0 && p.translation.length > 0)
}

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    // speechSynthesis unavailable — silently ignore
  }
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-záéíóúñü0-9 ]/gi, '')

export default function WordLabPage() {
  const { user } = useAuth()
  const userId = user?.id ?? 0
  const { play } = useSound()
  const prefersReduced = useReducedMotion()

  const { data: dashboard, isLoading } = useQuery({ queryKey: ['student', 'dashboard'], queryFn: studentApi.getDashboard })

  const allWords = useMemo<WordPair[]>(() => {
    const weeks = dashboard?.journey?.weeks ?? []
    const map = new Map<string, WordPair>()
    for (const week of weeks) {
      for (const pair of parseVocabulary(week.vocabulary)) {
        map.set(pair.word.toLowerCase(), pair)
      }
    }
    return [...map.values()]
  }, [dashboard])

  // Session: the cards due right now, captured once when the session starts.
  const [session, setSession] = useState<SrsCard[] | null>(null)
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const startSession = () => {
    const due = dueCards(userId, allWords)
    if (due.length === 0) return
    setSession(due)
    setIndex(0)
    setCorrectCount(0)
    setDone(false)
  }

  const dueNow = useMemo(() => (allWords.length ? dueCards(userId, allWords).length : 0), [allWords, userId, session, done])
  const total = allWords.length ? getDeck(userId, allWords).length : 0

  if (isLoading) {
    return <AppShell><div className="page-container flex flex-col gap-4 py-8"><Skeleton.Line width={280} height={40} /><Skeleton.Card /></div></AppShell>
  }

  if (allWords.length === 0) {
    return (
      <AppShell>
        <div className="page-container py-10">
          <EmptyState mood="sleep" title="No vocabulary yet" description="Word Lab fills up as your trainer adds vocabulary to your weeks. Check back soon!" />
        </div>
      </AppShell>
    )
  }

  // ── Session finished ────────────────────────────────────────────────────────
  if (session && done) {
    return (
      <AppShell>
        <div className="page-container flex flex-col items-center gap-5 py-12 text-center">
          <Mascot mood="cheer" size="xl" />
          <div>
            <p className="text-xs font-extrabold text-brand-red">REVIEW COMPLETE</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">Great work!</h1>
            <p className="mt-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              You reviewed <CountUp value={session.length} /> words — <CountUp value={correctCount} /> correct on the first try.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setSession(null); setDone(false) }}>Back to Word Lab</Button>
            {dueNow > 0 && <Button onClick={startSession}>Review {dueNow} more</Button>}
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Active review session ───────────────────────────────────────────────────
  if (session && session[index]) {
    const card = session[index]
    const mode = MODES[index % MODES.length] ?? 'flashcard'
    const progress = Math.round((index / session.length) * 100)

    const advance = (correct: boolean) => {
      review(userId, card.id, correct)
      if (correct) { setCorrectCount((c) => c + 1); play('success') } else { play('error') }
      if (index + 1 >= session.length) {
        setDone(true)
        celebrate({ y: 0.3 })
      } else {
        setIndex((i) => i + 1)
      }
    }

    return (
      <AppShell>
        <div className="page-container flex flex-col gap-6 py-6 sm:py-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => { setSession(null); setDone(false) }} className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:border-brand-red hover:text-brand-red dark:border-white/10 dark:text-neutral-400" aria-label="Exit review">
              <X size={18} aria-hidden="true" />
            </button>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
              <motion.div className="h-full rounded-full bg-gradient-sunrise" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: EASE_OUT }} style={{ backgroundSize: '200% auto' }} />
            </div>
            <span className="text-sm font-bold tabular-nums text-neutral-500 dark:text-neutral-400">{index + 1}/{session.length}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${card.id}-${index}`}
              initial={prefersReduced ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {mode === 'flashcard' && <Flashcard card={card} onAnswer={advance} />}
              {mode === 'choice' && <ChoiceCard card={card} pool={allWords} onAnswer={advance} />}
              {mode === 'type' && <TypeCard card={card} onAnswer={advance} />}
              {mode === 'listen' && <ListenCard card={card} pool={allWords} onAnswer={advance} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </AppShell>
    )
  }

  // ── Lobby ───────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-blue p-6 text-white shadow-brand sm:p-8">
          <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15"><Brain size={24} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-extrabold text-brand-yellow">SPACED REPETITION</p>
              <h1 className="font-display text-3xl font-extrabold text-white">Word Lab</h1>
            </div>
          </div>
          <p className="relative mt-3 max-w-md text-sm font-semibold text-white/85">Review the right words at the right time, so they stick for good.</p>
          <div className="relative mt-5 flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-white/15 px-4 py-2"><span className="font-display text-2xl font-extrabold tabular-nums"><CountUp value={dueNow} /></span><span className="ml-1 text-xs font-bold text-white/75">due now</span></div>
            <div className="rounded-xl bg-white/15 px-4 py-2"><span className="font-display text-2xl font-extrabold tabular-nums"><CountUp value={total} /></span><span className="ml-1 text-xs font-bold text-white/75">words</span></div>
          </div>
        </section>

        {dueNow > 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-neutral-900/[0.07] bg-white p-8 text-center shadow-soft dark:border-white/10 dark:bg-surface-card">
            <Mascot mood="point" size="lg" />
            <p className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{dueNow} words are ready to review</p>
            <Button size="lg" onClick={() => { play('focus'); startSession() }} leftIcon={<Brain size={18} aria-hidden="true" />}>Start daily review</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-neutral-900/[0.07] bg-white p-8 text-center shadow-soft dark:border-white/10 dark:bg-surface-card">
            <Mascot mood="sleep" size="lg" />
            <p className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">All caught up!</p>
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">No words are due right now. Come back later to keep your memory sharp.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ── Card modes ────────────────────────────────────────────────────────────────
function CardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-xl rounded-[24px] border-2 border-neutral-900/[0.07] bg-white p-6 shadow-soft dark:border-white/10 dark:bg-surface-card sm:p-8">{children}</div>
}

function Flashcard({ card, onAnswer }: { card: SrsCard; onAnswer: (c: boolean) => void }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <CardShell>
      <p className="text-center text-xs font-extrabold text-brand-blue">TAP TO REVEAL</p>
      <button type="button" onClick={() => setRevealed(true)} className="mt-4 flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-brand-cream p-6 dark:bg-white/[.05]">
        <span className="font-display text-3xl font-extrabold text-neutral-900 dark:text-white">{card.word}</span>
        {revealed && <span className="text-lg font-bold text-brand-red">{card.translation}</span>}
      </button>
      {revealed ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => onAnswer(false)} leftIcon={<RotateCcw size={16} aria-hidden="true" />}>Again</Button>
          <Button onClick={() => onAnswer(true)} leftIcon={<Check size={16} aria-hidden="true" />}>Got it</Button>
        </div>
      ) : (
        <p className="mt-5 text-center text-xs font-semibold text-neutral-400">Think of the meaning, then reveal.</p>
      )}
    </CardShell>
  )
}

function buildOptions(card: SrsCard, pool: WordPair[], key: 'word' | 'translation'): string[] {
  const correct = card[key === 'word' ? 'word' : 'translation']
  const others = pool.filter((p) => p.translation !== card.translation).map((p) => p[key])
  const picks = new Set<string>([correct])
  for (const o of others.sort(() => Math.random() - 0.5)) {
    if (picks.size >= 4) break
    picks.add(o)
  }
  return [...picks].sort(() => Math.random() - 0.5)
}

function ChoiceCard({ card, pool, onAnswer }: { card: SrsCard; pool: WordPair[]; onAnswer: (c: boolean) => void }) {
  const options = useMemo(() => buildOptions(card, pool, 'translation'), [card, pool])
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <CardShell>
      <p className="text-center text-xs font-extrabold text-brand-blue">CHOOSE THE MEANING</p>
      <p className="mt-3 text-center font-display text-3xl font-extrabold text-neutral-900 dark:text-white">{card.word}</p>
      <div className="mt-6 grid gap-3">
        {options.map((opt) => {
          const isCorrect = opt === card.translation
          const state = picked == null ? 'idle' : isCorrect ? 'correct' : opt === picked ? 'wrong' : 'idle'
          return (
            <button
              key={opt}
              type="button"
              disabled={picked != null}
              onClick={() => { setPicked(opt); setTimeout(() => onAnswer(isCorrect), 700) }}
              className={cn(
                'min-h-12 rounded-xl border-2 px-4 text-sm font-bold transition-colors duration-150',
                state === 'idle' && 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-blue dark:border-white/10 dark:bg-surface-raised dark:text-neutral-200',
                state === 'correct' && 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                state === 'wrong' && 'border-brand-red bg-red-50 text-brand-red dark:bg-red-500/15 dark:text-red-300',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </CardShell>
  )
}

function TypeCard({ card, onAnswer }: { card: SrsCard; onAnswer: (c: boolean) => void }) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const check = () => {
    const correct = normalize(value) === normalize(card.translation)
    setResult(correct)
    setTimeout(() => onAnswer(correct), 900)
  }
  return (
    <CardShell>
      <p className="text-center text-xs font-extrabold text-brand-blue">TYPE THE MEANING</p>
      <p className="mt-3 text-center font-display text-3xl font-extrabold text-neutral-900 dark:text-white">{card.word}</p>
      <form className="mt-6 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (result == null && value.trim()) check() }}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={result != null}
          placeholder="Your answer…"
          className={cn(
            'h-14 rounded-xl border-2 px-4 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-surface-raised dark:text-white',
            result == null && 'border-neutral-300 dark:border-white/15',
            result === true && 'border-emerald-500 text-emerald-700',
            result === false && 'border-brand-red text-brand-red',
          )}
        />
        {result === false && <p className="text-center text-sm font-bold text-neutral-500 dark:text-neutral-400">Answer: <span className="text-brand-red">{card.translation}</span></p>}
        {result == null && <Button type="submit" disabled={!value.trim()}>Check</Button>}
      </form>
    </CardShell>
  )
}

function ListenCard({ card, pool, onAnswer }: { card: SrsCard; pool: WordPair[]; onAnswer: (c: boolean) => void }) {
  const options = useMemo(() => buildOptions(card, pool, 'word'), [card, pool])
  const [picked, setPicked] = useState<string | null>(null)
  useEffect(() => { speak(card.word) }, [card.word])
  return (
    <CardShell>
      <p className="text-center text-xs font-extrabold text-brand-blue">LISTEN AND PICK</p>
      <button type="button" onClick={() => speak(card.word)} className="mx-auto mt-4 flex size-20 items-center justify-center rounded-full bg-gradient-blue text-white shadow-glow-blue transition-transform duration-150 hover:scale-105 motion-reduce:hover:scale-100" aria-label="Play the word again">
        <Volume2 size={30} aria-hidden="true" />
      </button>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrect = opt === card.word
          const state = picked == null ? 'idle' : isCorrect ? 'correct' : opt === picked ? 'wrong' : 'idle'
          return (
            <button
              key={opt}
              type="button"
              disabled={picked != null}
              onClick={() => { setPicked(opt); setTimeout(() => onAnswer(isCorrect), 700) }}
              className={cn(
                'min-h-12 rounded-xl border-2 px-4 text-sm font-bold transition-colors duration-150',
                state === 'idle' && 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-blue dark:border-white/10 dark:bg-surface-raised dark:text-neutral-200',
                state === 'correct' && 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                state === 'wrong' && 'border-brand-red bg-red-50 text-brand-red dark:bg-red-500/15 dark:text-red-300',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </CardShell>
  )
}
