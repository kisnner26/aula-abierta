import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Play, Square, Volume2 } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { Button } from '@core/ui'
import { cn } from '@core/utils'
import { SPRING_POP } from '@core/motion'
import { WaveformBars } from './WaveformBars'
import type { VocabPair } from '../utils/parseVocabulary'
import type { RecorderState } from '../hooks/useRecorder'

interface WordCardProps {
  pair: VocabPair
  index: number
  total: number
  speaking: boolean
  recorderState: RecorderState
  audioUrl: string | null
  waveformBars: number[]
  shadowMode: boolean
  onListen: () => void
  onRecord: () => void
  onStopRecord: () => void
  onPlayback: () => void
  onRate: (rating: 'again' | 'good' | 'perfect') => void
}

const RATINGS: { key: 'again' | 'good' | 'perfect'; label: string; color: string }[] = [
  { key: 'again',   label: 'Again',   color: 'bg-brand-red   text-white hover:bg-red-700' },
  { key: 'good',    label: 'Good',    color: 'bg-brand-blue  text-white hover:bg-blue-700' },
  { key: 'perfect', label: 'Perfect', color: 'bg-emerald-500 text-white hover:bg-emerald-600' },
]

export function WordCard({
  pair,
  speaking,
  recorderState,
  audioUrl,
  waveformBars,
  onListen,
  onRecord,
  onStopRecord,
  onPlayback,
  onRate,
}: WordCardProps) {
  const prefersReduced = useReducedMotion()

  const wordVariants = {
    initial: prefersReduced ? {} : { opacity: 0, scale: 0.85, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_POP },
    exit:    prefersReduced ? {} : { opacity: 0, scale: 0.9, y: -8, transition: { duration: 0.18 } },
  }

  const isRecording = recorderState === 'recording'
  const isDone      = recorderState === 'done'

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Word display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pair.word}
          variants={wordVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col items-center gap-2 text-center"
        >
          <p className="font-display text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-6xl">
            {pair.word}
          </p>
          <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">
            {pair.translation}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Listen button */}
      <motion.button
        onClick={onListen}
        aria-label={`Listen to "${pair.word}"`}
        whileTap={prefersReduced ? {} : { scale: 0.94 }}
        animate={speaking && !prefersReduced ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={speaking ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' } : SPRING_POP}
        className={cn(
          'flex items-center gap-2 rounded-2xl px-6 py-3 text-base font-bold shadow-md transition-colors',
          speaking
            ? 'bg-brand-blue text-white'
            : 'bg-brand-sky text-brand-ink hover:bg-blue-200 dark:bg-blue-900 dark:text-white dark:hover:bg-blue-800',
        )}
      >
        <Volume2 className="h-5 w-5" aria-hidden="true" />
        {speaking ? 'Playing…' : 'Listen'}
      </motion.button>

      {/* Record / waveform area */}
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={prefersReduced ? {} : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col items-center gap-3"
            >
              <WaveformBars bars={waveformBars} active={true} className="w-full" />
              <button
                onClick={onStopRecord}
                aria-label="Stop recording"
                className="flex items-center gap-2 rounded-2xl bg-brand-red px-6 py-3 text-base font-bold text-white shadow-md hover:bg-red-700 active:scale-95"
              >
                <Square className="h-4 w-4 fill-white" aria-hidden="true" />
                Stop
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="record-btn"
              onClick={onRecord}
              aria-label="Start recording"
              initial={prefersReduced ? {} : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              whileTap={prefersReduced ? {} : { scale: 0.94 }}
              className={cn(
                'flex items-center gap-2 rounded-2xl px-6 py-3 text-base font-bold shadow-md transition-colors',
                isDone
                  ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600'
                  : 'bg-brand-red text-white hover:bg-red-700',
              )}
            >
              {isDone ? (
                <>
                  <Mic className="h-5 w-5" aria-hidden="true" />
                  Re-record
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" aria-hidden="true" />
                  Record
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Playback + flat waveform after recording */}
        <AnimatePresence>
          {isDone && audioUrl && (
            <motion.div
              key="playback"
              initial={prefersReduced ? {} : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex w-full flex-col items-center gap-3 overflow-hidden"
            >
              <WaveformBars bars={waveformBars} active={false} className="w-full" />
              <button
                onClick={onPlayback}
                aria-label="Play your recording"
                className="flex items-center gap-2 rounded-2xl border-2 border-brand-blue px-5 py-2.5 text-sm font-bold text-brand-blue hover:bg-brand-sky dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                <Play className="h-4 w-4 fill-brand-blue dark:fill-blue-400" aria-hidden="true" />
                Play yours
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Self-assessment — only show after recording */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            key="rating"
            initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1, ...SPRING_POP } }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              How did it sound?
            </p>
            <div className="flex gap-3">
              {RATINGS.map(({ key, label, color }) => (
                <motion.button
                  key={key}
                  onClick={() => onRate(key)}
                  aria-label={`Rate as ${label}`}
                  whileTap={prefersReduced ? {} : { scale: 0.93 }}
                  whileHover={prefersReduced ? {} : { scale: 1.04 }}
                  className={cn(
                    'min-w-[80px] rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-colors',
                    color,
                  )}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic-off placeholder when recorder not available (SSR/blocked) */}
      {typeof navigator !== 'undefined' && !navigator.mediaDevices && (
        <p className="flex items-center gap-1.5 text-sm text-neutral-400" role="alert">
          <MicOff className="h-4 w-4" aria-hidden="true" />
          Microphone not available
        </p>
      )}
    </div>
  )
}
