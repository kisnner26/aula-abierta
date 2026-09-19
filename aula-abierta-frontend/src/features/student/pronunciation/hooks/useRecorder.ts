import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderState = 'idle' | 'recording' | 'done'

export interface UseRecorderReturn {
  recorderState: RecorderState
  audioUrl: string | null
  waveformBars: number[]        // 0–1 amplitude per bar, updated ~60fps while recording
  startRecording: () => Promise<void>
  stopRecording: () => void
  clearRecording: () => void
}

const BAR_COUNT = 28

/**
 * MediaRecorder + AudioContext analyser for live waveform bars.
 * Cleans up all resources on unmount.
 */
export function useRecorder(): UseRecorderReturn {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(BAR_COUNT).fill(0))

  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const prevUrlRef = useRef<string | null>(null)

  // Revoke previous object URL to avoid memory leaks
  const revokeOldUrl = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
  }, [])

  const stopAnalyser = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setWaveformBars(Array(BAR_COUNT).fill(0))
  }, [])

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const closeAudioCtx = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close()
    }
    audioCtxRef.current = null
    analyserRef.current = null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalyser()
      releaseStream()
      closeAudioCtx()
      revokeOldUrl()
    }
  }, [stopAnalyser, releaseStream, closeAudioCtx, revokeOldUrl])

  const startAnalyser = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    const source = ctx.createMediaStreamSource(stream)
    source.connect(analyser)

    audioCtxRef.current = ctx
    analyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      if (!analyserRef.current) return
      analyserRef.current.getByteFrequencyData(dataArray)

      const step = Math.floor(dataArray.length / BAR_COUNT)
      const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
        const val = dataArray[i * step] ?? 0
        return val / 255
      })
      setWaveformBars(bars)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stopAnalyser()
        releaseStream()
        closeAudioCtx()

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        revokeOldUrl()
        const url = URL.createObjectURL(blob)
        prevUrlRef.current = url
        setAudioUrl(url)
        setRecorderState('done')
      }

      recorder.start()
      startAnalyser(stream)
      setRecorderState('recording')
    } catch {
      // Permission denied or device unavailable — silently stay idle
      setRecorderState('idle')
    }
  }, [startAnalyser, stopAnalyser, releaseStream, closeAudioCtx, revokeOldUrl])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const clearRecording = useCallback(() => {
    stopRecording()
    stopAnalyser()
    releaseStream()
    closeAudioCtx()
    revokeOldUrl()
    setAudioUrl(null)
    setWaveformBars(Array(BAR_COUNT).fill(0))
    setRecorderState('idle')
    chunksRef.current = []
  }, [stopRecording, stopAnalyser, releaseStream, closeAudioCtx, revokeOldUrl])

  return {
    recorderState,
    audioUrl,
    waveformBars,
    startRecording,
    stopRecording,
    clearRecording,
  }
}
