import { useEffect, useRef, useState } from 'react'
import { Mic, RotateCcw, Square } from 'lucide-react'
import { cn } from '@core/utils'

type RecorderState = 'idle' | 'recording' | 'recorded'

interface VoiceRecorderProps {
  onRecord: (blob: Blob) => void
  onClear: () => void
}

export function VoiceRecorder({ onRecord, onClear }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [bars, setBars] = useState<number[]>(Array(28).fill(3))

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const animateBars = (analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const step = Math.floor(data.length / 28)
      setBars(
        Array.from({ length: 28 }, (_, i) => {
          const val = data[i * step] ?? 0
          return Math.max(3, Math.round((val / 255) * 40))
        }),
      )
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const context = new AudioContext()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyserRef.current = analyser
      animateBars(analyser)

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        if (animRef.current) cancelAnimationFrame(animRef.current)
        setBars(Array(28).fill(3))
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onRecord(blob)
        setState('recorded')
      }

      mediaRef.current = recorder
      recorder.start()
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      // User denied microphone — stay idle
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRef.current?.stop()
  }

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setSeconds(0)
    setBars(Array(28).fill(3))
    onClear()
    setState('idle')
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white dark:border-white/10 dark:bg-surface-raised">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-white/10">
        <div>
          <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
            {state === 'idle' && 'Voice recording'}
            {state === 'recording' && (
              <span className="flex items-center gap-2">
                <span className="inline-block size-2 animate-pulse rounded-full bg-brand-red" />
                Recording…
              </span>
            )}
            {state === 'recorded' && 'Recording saved'}
          </p>
          <p className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {state === 'idle' && 'Tap the button below to answer in English.'}
            {state === 'recording' && fmt(seconds)}
            {state === 'recorded' && `${fmt(seconds)} · listen before submitting`}
          </p>
        </div>

        {state === 'recorded' && (
          <button
            type="button"
            onClick={reset}
            className="flex size-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors duration-150 hover:border-brand-red hover:text-brand-red dark:border-white/10 dark:text-neutral-400"
            aria-label="Record again"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Waveform */}
      <div className="flex h-12 items-center justify-center gap-[3px] px-5 py-3">
        {bars.map((h, i) => (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full transition-all duration-75',
              state === 'recording'
                ? 'bg-brand-red'
                : state === 'recorded'
                  ? 'bg-brand-blue'
                  : 'bg-neutral-200 dark:bg-neutral-700',
            )}
            style={{ height: h }}
          />
        ))}
      </div>

      {/* Action */}
      <div className="px-5 pb-5">
        {state === 'idle' && (
          <button
            type="button"
            onClick={startRecording}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-red py-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-red-700 active:scale-[0.98]"
            aria-label="Start recording"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-white/20">
              <Mic size={17} aria-hidden="true" />
            </span>
            Start recording
          </button>
        )}

        {state === 'recording' && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-neutral-800 active:scale-[0.98] dark:bg-neutral-700 dark:hover:bg-neutral-600"
            aria-label="Stop recording"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-white/10">
              <Square size={15} fill="currentColor" aria-hidden="true" />
            </span>
            Stop recording
          </button>
        )}

        {state === 'recorded' && audioUrl && (
          <audio controls src={audioUrl} className="w-full rounded-xl" />
        )}
      </div>
    </div>
  )
}
