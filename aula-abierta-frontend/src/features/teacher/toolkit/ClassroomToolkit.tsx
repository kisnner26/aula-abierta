/**
 * ClassroomToolkit — teacher live-class overlay
 *
 * A large centered modal (fixed inset-0 z-50, framer-motion AnimatePresence,
 * backdrop) with four tabbed tools:
 *   1. Random Student Picker
 *   2. Countdown Timer
 *   3. Team Randomizer
 *   4. Noise Meter
 *
 * Self-contained — no external data fetch. Students come via props.
 * Respects prefers-reduced-motion. Full dark-mode support.
 */

import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Dices,
  Mic,
  MicOff,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Timer,
  Users,
  Volume2,
  X,
} from 'lucide-react'
import { cn } from '@core/utils'
import { Button } from '@core/ui'
import { celebrate, EASE_OUT, SPRING_POP } from '@core/motion'
import { useSound } from '@core/hooks/useSound'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Student {
  id: number
  name: string
  sis_id: string
}

export interface ClassroomToolkitProps {
  open: boolean
  onClose: () => void
  students: Student[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'picker', label: 'Student Picker', icon: Dices },
  { id: 'timer', label: 'Timer', icon: Timer },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'noise', label: 'Noise Meter', icon: Volume2 },
] as const

type TabId = (typeof TABS)[number]['id']

const TEAM_COLORS: readonly { bg: string; text: string; accent: string }[] = [
  { bg: 'bg-brand-blue/10 border-brand-blue/30', text: 'text-brand-blue', accent: 'bg-brand-blue' },
  { bg: 'bg-brand-red/10 border-brand-red/30', text: 'text-brand-red', accent: 'bg-brand-red' },
  { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500' },
  { bg: 'bg-brand-yellow/10 border-brand-yellow/40', text: 'text-amber-700 dark:text-yellow-300', accent: 'bg-brand-yellow' },
]

const TIMER_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

function splitIntoTeams<T>(items: T[], numTeams: number): T[][] {
  const shuffled = shuffle(items)
  const teams: T[][] = Array.from({ length: numTeams }, () => [])
  shuffled.forEach((item, i) => {
    const teamIndex = i % numTeams
    ;(teams[teamIndex] as T[]).push(item)
  })
  return teams
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Sub-panel: Random Student Picker ────────────────────────────────────────

function StudentPicker({ students }: { students: Student[] }) {
  const { play } = useSound()
  const prefersReduced = useReducedMotion()
  const [picked, setPicked] = useState<Student | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [display, setDisplay] = useState<string>('???')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const spin = useCallback(() => {
    if (students.length === 0) return
    setSpinning(true)
    setPicked(null)
    play('tap')

    if (prefersReduced) {
      // Skip animation in reduced-motion mode — pick immediately
      const winner = students[Math.floor(Math.random() * students.length)] ?? students[0]
      if (winner) {
        setPicked(winner)
        setDisplay(winner.name)
        setSpinning(false)
        play('success')
        celebrate({ x: 0.5, y: 0.4 })
      }
      return
    }

    // Fast-cycle names for 1.8 s then settle
    const names = shuffle(students.map((s) => s.name))
    let i = 0
    intervalRef.current = setInterval(() => {
      setDisplay(names[i % names.length] ?? '???')
      i++
    }, 80)

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const winner = students[Math.floor(Math.random() * students.length)]
      if (winner) {
        setPicked(winner)
        setDisplay(winner.name)
        setSpinning(false)
        play('success')
        celebrate({ x: 0.5, y: 0.4 })
      }
    }, 1800)
  }, [students, play, prefersReduced])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const nameId = useId()

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Users size={40} className="text-neutral-300" aria-hidden="true" />
        <p className="text-sm font-semibold text-neutral-500">No students in this classroom yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Display ring */}
      <div
        className={cn(
          'relative flex size-56 items-center justify-center rounded-full border-4 shadow-xl transition-colors duration-300',
          spinning
            ? 'border-brand-blue bg-brand-blue/10 dark:bg-brand-blue/15'
            : picked
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
              : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-surface-raised',
        )}
        aria-live="polite"
        aria-label="Picked student"
      >
        {/* Rotating border pulse while spinning */}
        {spinning && !prefersReduced && (
          <motion.span
            className="absolute inset-0 rounded-full border-4 border-brand-blue/40"
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.2, 0.7] }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        )}
        <AnimatePresence mode="wait">
          <motion.p
            key={display}
            id={nameId}
            className={cn(
              'max-w-[10rem] text-center font-display text-2xl font-extrabold leading-tight',
              spinning ? 'text-brand-blue' : picked ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400',
            )}
            initial={prefersReduced ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0, scale: 1.1 }}
            transition={SPRING_POP}
          >
            {display}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Student SIS tag */}
      {picked && !spinning && (
        <motion.p
          className="text-xs font-extrabold uppercase tracking-widest text-neutral-400"
          initial={prefersReduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          SIS {picked.sis_id}
        </motion.p>
      )}

      <div className="flex gap-3">
        <Button
          onClick={spin}
          disabled={spinning}
          loading={spinning}
          leftIcon={<Dices size={16} aria-hidden="true" />}
          size="lg"
        >
          {spinning ? 'Picking…' : picked ? 'Pick again' : 'Spin!'}
        </Button>
        {picked && !spinning && (
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<RefreshCw size={16} aria-hidden="true" />}
            onClick={() => { setPicked(null); setDisplay('???') }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Roster pill list */}
      <div className="flex max-w-sm flex-wrap justify-center gap-2">
        {students.map((s) => (
          <span
            key={s.id}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              picked?.id === s.id
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-400',
            )}
          >
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Sub-panel: Countdown Timer ───────────────────────────────────────────────

type TimerState = { remaining: number; running: boolean; initial: number }
type TimerAction =
  | { type: 'SET'; seconds: number }
  | { type: 'TICK' }
  | { type: 'TOGGLE' }
  | { type: 'RESET' }

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'SET':
      return { remaining: action.seconds, running: false, initial: action.seconds }
    case 'TICK':
      return { ...state, remaining: Math.max(0, state.remaining - 1) }
    case 'TOGGLE':
      return { ...state, running: state.remaining > 0 ? !state.running : false }
    case 'RESET':
      return { ...state, remaining: state.initial, running: false }
    default:
      return state
  }
}

function CountdownTimer() {
  const { play } = useSound()
  const prefersReduced = useReducedMotion()
  const [state, dispatch] = useReducer(timerReducer, { remaining: 300, running: false, initial: 300 })
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!state.running) return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [state.running])

  useEffect(() => {
    if (state.remaining === 0 && state.running === false && finishedRef.current === false) return
    if (state.remaining === 0 && !finishedRef.current) {
      finishedRef.current = true
      play('message')
      dispatch({ type: 'TOGGLE' }) // stop
    }
    if (state.remaining > 0) {
      finishedRef.current = false
    }
  }, [state.remaining, state.running, play])

  const pct = state.initial > 0 ? state.remaining / state.initial : 0
  const isDanger = state.remaining <= 10 && state.remaining > 0
  const isDone = state.remaining === 0

  const timeColor = isDone
    ? 'text-neutral-400'
    : isDanger
      ? 'text-brand-red'
      : 'text-neutral-900 dark:text-white'

  // SVG ring
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)
  const ringColor = isDone ? '#e5e7eb' : isDanger ? '#D31A2A' : '#1D95FB'

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* SVG circular progress ring */}
      <div className="relative" aria-hidden="true">
        <svg width={200} height={200} viewBox="0 0 200 200">
          <circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            className="text-neutral-100 dark:text-white/10"
          />
          <motion.circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ rotate: -90, originX: '100px', originY: '100px' }}
            animate={{ strokeDashoffset: offset, stroke: ringColor }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT }}
          />
        </svg>

        {/* mm:ss display inside ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn('font-display text-4xl font-extrabold tabular-nums', timeColor)}
            animate={
              isDanger && !prefersReduced && state.running
                ? { scale: [1, 1.06, 1], transition: { repeat: Infinity, duration: 0.6 } }
                : { scale: 1 }
            }
            aria-live="polite"
            aria-label={`${formatTime(state.remaining)} remaining`}
          >
            {formatTime(state.remaining)}
          </motion.span>
          {isDone && (
            <motion.span
              className="mt-1 text-xs font-extrabold uppercase tracking-widest text-neutral-400"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Time&apos;s up!
            </motion.span>
          )}
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2" role="group" aria-label="Timer presets">
        {TIMER_PRESETS.map((p) => (
          <button
            key={p.seconds}
            type="button"
            onClick={() => { dispatch({ type: 'SET', seconds: p.seconds }); finishedRef.current = false }}
            className={cn(
              'rounded-xl border px-3 py-2 text-sm font-bold transition-colors',
              state.initial === p.seconds && !isDone
                ? 'border-brand-blue bg-brand-blue text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-blue dark:border-white/10 dark:bg-surface-card dark:text-neutral-300',
            )}
            aria-pressed={state.initial === p.seconds}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          onClick={() => dispatch({ type: 'TOGGLE' })}
          disabled={isDone}
          leftIcon={state.running ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          size="lg"
        >
          {state.running ? 'Pause' : 'Start'}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => { dispatch({ type: 'RESET' }); finishedRef.current = false }}
          leftIcon={<RotateCcw size={16} aria-hidden="true" />}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}

// ─── Sub-panel: Team Randomizer ───────────────────────────────────────────────

function TeamRandomizer({ students }: { students: Student[] }) {
  const { play } = useSound()
  const prefersReduced = useReducedMotion()
  const [numTeams, setNumTeams] = useState<2 | 3 | 4>(2)
  const [teams, setTeams] = useState<Student[][]>([])

  const randomize = () => {
    setTeams(splitIntoTeams(students, numTeams))
    play('tap')
    if (!prefersReduced) celebrate({ x: 0.5, y: 0.5, count: 60 })
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Teams:</span>
          <div className="flex gap-1" role="group" aria-label="Number of teams">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setNumTeams(n); setTeams([]) }}
                aria-pressed={numTeams === n}
                className={cn(
                  'size-10 rounded-xl border text-sm font-extrabold transition-colors',
                  numTeams === n
                    ? 'border-brand-blue bg-brand-blue text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-blue dark:border-white/10 dark:bg-surface-card dark:text-neutral-300',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={randomize}
          disabled={students.length === 0}
          leftIcon={<Shuffle size={16} aria-hidden="true" />}
        >
          {teams.length > 0 ? 'Reshuffle' : 'Randomize'}
        </Button>
      </div>

      {/* Team cards */}
      {teams.length > 0 && (
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial={prefersReduced ? false : 'hidden'}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {teams.map((team, idx) => {
            const color = TEAM_COLORS[idx % TEAM_COLORS.length] ?? TEAM_COLORS[0]!
            return (
              <motion.div
                key={idx}
                className={cn(
                  'rounded-2xl border-2 p-5 shadow-sm',
                  color.bg,
                )}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.96 },
                  show: { opacity: 1, y: 0, scale: 1, transition: SPRING_POP },
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn('size-3 rounded-full', color.accent)} aria-hidden="true" />
                  <h4 className={cn('font-display text-base font-extrabold', color.text)}>
                    Team {idx + 1}
                  </h4>
                  <span className="ml-auto text-xs font-bold text-neutral-400">
                    {team.length} {team.length === 1 ? 'student' : 'students'}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {team.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm font-semibold text-neutral-800 dark:bg-black/20 dark:text-neutral-200"
                    >
                      <span className={cn('size-2 shrink-0 rounded-full', color.accent)} aria-hidden="true" />
                      {s.name}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {teams.length === 0 && students.length > 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Shuffle size={36} className="text-neutral-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-neutral-400">
            Press Randomize to split {students.length} students into {numTeams} balanced teams.
          </p>
        </div>
      )}

      {students.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Users size={36} className="text-neutral-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-neutral-400">No students in this classroom yet.</p>
        </div>
      )}
    </div>
  )
}

// ─── Sub-panel: Noise Meter ───────────────────────────────────────────────────

const NOISE_THRESHOLD = 0.65 // 0–1 normalized; over this = too loud

function NoiseMeter() {
  const prefersReduced = useReducedMotion()
  const { play } = useSound()
  const [active, setActive] = useState(false)
  const [level, setLevel] = useState(0) // 0–1 normalized
  const [tooLoud, setTooLoud] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const tooLoudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    analyserRef.current = null
    setActive(false)
    setLevel(0)
    setTooLoud(false)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      ctx.createMediaStreamSource(stream).connect(analyser)

      const data = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        analyser.getByteFrequencyData(data)
        // RMS-ish: average the bins and normalize to 0–1
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += (data[i] ?? 0) ** 2
        const rms = Math.sqrt(sum / data.length) / 255
        setLevel(rms)
        if (rms >= NOISE_THRESHOLD) {
          setTooLoud(true)
          if (tooLoudTimeoutRef.current) clearTimeout(tooLoudTimeoutRef.current)
          tooLoudTimeoutRef.current = setTimeout(() => setTooLoud(false), 1200)
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      setActive(true)
    } catch {
      setError('Microphone access denied. Please allow mic in your browser settings.')
    }
  }, [play])

  // Clean up on unmount
  useEffect(() => {
    return stop
  }, [stop])

  // Derive bar color class
  const barColor =
    level >= NOISE_THRESHOLD
      ? 'bg-brand-red'
      : level >= 0.35
        ? 'bg-brand-yellow'
        : 'bg-emerald-500'

  const barLabel =
    level >= NOISE_THRESHOLD
      ? 'Too loud!'
      : level >= 0.35
        ? 'Getting loud'
        : 'Good level'

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Main level display */}
      <div className="w-full max-w-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">
            Noise Level
          </span>
          <AnimatePresence>
            {active && (
              <motion.span
                key={barLabel}
                className={cn(
                  'rounded-full px-3 py-0.5 text-xs font-extrabold text-brand-ink',
                  level >= NOISE_THRESHOLD
                    ? 'bg-brand-red text-white'
                    : level >= 0.35
                      ? 'bg-brand-yellow'
                      : 'bg-emerald-400 text-white',
                )}
                initial={prefersReduced ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING_POP}
              >
                {barLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Level bar track */}
        <div
          className="relative h-10 overflow-hidden rounded-2xl bg-neutral-100 dark:bg-white/10"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level * 100)}
          aria-label="Classroom noise level"
        >
          <motion.div
            className={cn('absolute inset-y-0 left-0 rounded-2xl transition-colors duration-200', barColor)}
            style={{ width: `${Math.round(level * 100)}%` }}
            animate={{ width: `${Math.round(level * 100)}%` }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.08, ease: 'linear' }}
          />
          {/* Threshold marker */}
          <div
            className="absolute inset-y-0 w-0.5 bg-brand-red/60"
            style={{ left: `${NOISE_THRESHOLD * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="mt-1.5 text-right text-xs font-bold tabular-nums text-neutral-400">
          {active ? `${Math.round(level * 100)}%` : '—'}
        </p>
      </div>

      {/* Too loud wobble */}
      <AnimatePresence>
        {tooLoud && !prefersReduced && (
          <motion.div
            className="flex items-center gap-2 rounded-2xl bg-brand-red px-5 py-3 text-sm font-extrabold text-white shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.9, 1.05, 0.97, 1.03, 1],
              opacity: 1,
              transition: { duration: 0.5 },
            }}
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
          >
            <Volume2 size={18} aria-hidden="true" />
            Too loud — shh!
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="rounded-xl bg-brand-red/10 px-4 py-3 text-center text-sm font-semibold text-brand-red">
          {error}
        </p>
      )}

      {/* Start / Stop */}
      {!active ? (
        <Button
          onClick={() => void start()}
          leftIcon={<Mic size={16} aria-hidden="true" />}
          size="lg"
        >
          Start Noise Meter
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={stop}
          leftIcon={<MicOff size={16} aria-hidden="true" />}
          size="lg"
        >
          Stop
        </Button>
      )}

      {!active && !error && (
        <p className="max-w-xs text-center text-xs font-semibold leading-5 text-neutral-400">
          Your browser will ask for microphone permission. Audio is processed locally — nothing is recorded or sent.
        </p>
      )}
    </div>
  )
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────

export default function ClassroomToolkit({ open, onClose, students }: ClassroomToolkitProps) {
  const prefersReduced = useReducedMotion()
  const [activeTab, setActiveTab] = useState<TabId>('picker')
  const panelId = useId()

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Trap scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const backdropVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  }

  const panelVariants = {
    hidden: { opacity: 0, scale: prefersReduced ? 1 : 0.93, y: prefersReduced ? 0 : 24 },
    show: { opacity: 1, scale: 1, y: 0, transition: SPRING_POP },
    exit: { opacity: 0, scale: prefersReduced ? 1 : 0.95, y: prefersReduced ? 0 : 12, transition: { duration: 0.18, ease: EASE_OUT } },
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="toolkit-backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="toolkit-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Classroom Toolkit"
            className="fixed inset-x-4 inset-y-6 z-50 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-surface-raised sm:inset-x-8 sm:inset-y-12"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="flex shrink-0 items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-white/10">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue text-white shadow-sm">
                <Dices size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-blue">
                  LIVE CLASS
                </p>
                <h2 className="font-display text-xl font-extrabold leading-tight text-neutral-900 dark:text-white">
                  Classroom Toolkit
                </h2>
              </div>
              <button
                type="button"
                className="ml-auto flex size-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue dark:hover:bg-white/[.07]"
                onClick={onClose}
                aria-label="Close toolkit"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {/* Tab bar */}
            <div
              className="flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-100 px-4 py-2 dark:border-white/10"
              role="tablist"
              aria-label="Toolkit tools"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    id={`toolkit-tab-${tab.id}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${panelId}-${tab.id}`}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors',
                      isActive
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-white/[.06] dark:hover:text-white',
                    )}
                  >
                    <Icon size={15} aria-hidden="true" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab content — scrollable */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  id={`${panelId}-${activeTab}`}
                  role="tabpanel"
                  aria-labelledby={`toolkit-tab-${activeTab}`}
                  initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReduced ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                >
                  {activeTab === 'picker' && <StudentPicker students={students} />}
                  {activeTab === 'timer' && <CountdownTimer />}
                  {activeTab === 'teams' && <TeamRandomizer students={students} />}
                  {activeTab === 'noise' && <NoiseMeter />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
