import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { Mic, Play, Square, Volume2 } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Button, EmptyState, Mascot, Skeleton } from '@core/ui'
import { celebrate } from '@core/motion'
import { useSound } from '@core/hooks/useSound'
import { studentApi } from '../api'
import { cn } from '@core/utils'

interface WordPair { word: string; translation: string }

function parseVocabulary(raw: string | undefined | null): WordPair[] {
  if (!raw) return []
  return raw.split(',').map((pair) => {
    const [word, translation] = pair.split(':')
    return { word: (word ?? '').trim(), translation: (translation ?? '').trim() }
  }).filter((p) => p.word.length > 0)
}

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* ignore */ }
}

export default function PronunciationPage() {
  const { play } = useSound()
  const prefersReduced = useReducedMotion()
  const { data: dashboard, isLoading } = useQuery({ queryKey: ['student', 'dashboard'], queryFn: studentApi.getDashboard })

  const words = useMemo<WordPair[]>(() => {
    const weeks = dashboard?.journey?.weeks ?? []
    const map = new Map<string, WordPair>()
    for (const week of weeks) for (const p of parseVocabulary(week.vocabulary)) map.set(p.word.toLowerCase(), p)
    return [...map.values()]
  }, [dashboard])

  const [index, setIndex] = useState(0)
  const [shadow, setShadow] = useState(false)
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [bars, setBars] = useState<number[]>(Array(24).fill(4))

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const word = words[index]

  const cleanup = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(() => () => { cleanup(); if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])

  // Reset recording state when the word changes.
  useEffect(() => {
    setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
    setBars(Array(24).fill(4))
  }, [index])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const step = Math.max(1, Math.floor(data.length / 24))
        setBars(Array.from({ length: 24 }, (_, i) => Math.max(4, Math.round(((data[i * step] ?? 0) / 255) * 44))))
        animRef.current = requestAnimationFrame(tick)
      }
      tick()

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        cleanup()
        setBars(Array(24).fill(4))
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
      }
      mediaRef.current = recorder
      recorder.start()
      setRecording(true)
      play('tap')
    } catch { /* mic denied */ }
  }

  const stopRecording = () => { mediaRef.current?.stop(); setRecording(false) }

  const listen = () => { if (word) speak(word.word) }
  const shadowListen = () => {
    if (!word) return
    speak(word.word)
    if (shadow) setTimeout(() => { if (!recording) startRecording() }, 900)
  }

  const assess = (level: 'again' | 'good' | 'perfect') => {
    play(level === 'again' ? 'error' : 'success')
    if (level === 'perfect') celebrate({ y: 0.4 })
    if (index + 1 >= words.length) {
      celebrate({ y: 0.3 })
      setIndex(0)
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (isLoading) return <AppShell><div className="page-container flex flex-col gap-4 py-8"><Skeleton.Line width={280} height={40} /><Skeleton.Card /></div></AppShell>

  if (!word) {
    return <AppShell><div className="page-container py-10"><EmptyState mood="sleep" title="No words to practice yet" description="Pronunciation practice unlocks as your trainer adds vocabulary." /></div></AppShell>
  }

  const progress = Math.round(((index) / words.length) * 100)

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-6 py-6 sm:py-8">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-red p-6 text-white shadow-red-soft sm:p-8">
          <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15"><Mic size={24} aria-hidden="true" /></span>
              <div>
                <p className="text-xs font-extrabold text-brand-yellow">SPEAK WITH CONFIDENCE</p>
                <h1 className="font-display text-3xl font-extrabold text-white">Pronunciation</h1>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold">
              <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} className="accent-brand-yellow" />
              Shadow mode
            </label>
          </div>
          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-brand-yellow transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        </section>

        <div className="mx-auto w-full max-w-xl rounded-[24px] border-2 border-neutral-900/[0.07] bg-white p-6 text-center shadow-soft dark:border-white/10 dark:bg-surface-card sm:p-8">
          <p className="text-xs font-extrabold text-brand-blue">{index + 1} / {words.length}</p>
          <p className="mt-3 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">{word.word}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">{word.translation}</p>

          <button type="button" onClick={shadow ? shadowListen : listen} className="mx-auto mt-6 flex size-16 items-center justify-center rounded-full bg-gradient-blue text-white shadow-glow-blue transition-transform duration-150 hover:scale-105 motion-reduce:hover:scale-100" aria-label="Listen to the model pronunciation">
            <Volume2 size={26} aria-hidden="true" />
          </button>
          <p className="mt-2 text-xs font-semibold text-neutral-400">{shadow ? 'Listen, then repeat right after' : 'Tap to hear the model'}</p>

          {/* Waveform */}
          <div className="mt-6 flex h-14 items-center justify-center gap-[3px]">
            {bars.map((h, i) => (
              <motion.span key={i} className={cn('w-1.5 rounded-full', recording ? 'bg-brand-red' : audioUrl ? 'bg-brand-blue' : 'bg-neutral-200 dark:bg-white/10')} style={{ height: prefersReduced ? 6 : h }} />
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-3">
            {!recording ? (
              <Button variant="danger" onClick={startRecording} leftIcon={<Mic size={16} aria-hidden="true" />}>Record</Button>
            ) : (
              <Button onClick={stopRecording} leftIcon={<Square size={15} aria-hidden="true" />} className="!bg-neutral-900">Stop</Button>
            )}
            {audioUrl && !recording && (
              <Button variant="secondary" onClick={() => new Audio(audioUrl).play()} leftIcon={<Play size={16} aria-hidden="true" />}>Play yours</Button>
            )}
          </div>

          {audioUrl && !recording && (
            <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-white/10">
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">How did it sound?</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => assess('again')} className="min-h-11 rounded-xl border-2 border-neutral-200 text-sm font-bold text-neutral-600 hover:border-brand-red hover:text-brand-red dark:border-white/10 dark:text-neutral-300">Again</button>
                <button type="button" onClick={() => assess('good')} className="min-h-11 rounded-xl border-2 border-neutral-200 text-sm font-bold text-neutral-600 hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-neutral-300">Good</button>
                <button type="button" onClick={() => assess('perfect')} className="min-h-11 rounded-xl bg-gradient-yellow text-sm font-extrabold text-brand-ink">Perfect!</button>
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto flex items-center gap-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          <Mascot mood="cheer" size="sm" />
          Keep going — every word you say out loud makes you faster.
        </div>
      </div>
    </AppShell>
  )
}
