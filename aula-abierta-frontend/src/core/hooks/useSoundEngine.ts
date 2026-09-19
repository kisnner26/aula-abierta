import { useCallback, useState } from 'react'

export type SoundName = 'tap' | 'focus' | 'success' | 'message' | 'achievement' | 'error'

const tones: Record<SoundName, { notes: number[]; duration: number; gain: number }> = {
  tap: { notes: [520], duration: 0.045, gain: 0.025 },
  focus: { notes: [660], duration: 0.04, gain: 0.018 },
  success: { notes: [660, 880], duration: 0.075, gain: 0.024 },
  message: { notes: [620, 760], duration: 0.06, gain: 0.018 },
  achievement: { notes: [523, 659, 784], duration: 0.09, gain: 0.022 },
  error: { notes: [260, 220], duration: 0.07, gain: 0.018 },
}

let audioContext: AudioContext | null = null

function getContext() {
  audioContext ??= new AudioContext()
  return audioContext
}

function readPreference() {
  return typeof window !== 'undefined' && window.localStorage.getItem('aula-sound') !== 'off'
}

export function playSound(name: SoundName = 'tap') {
  if (!readPreference() || typeof window === 'undefined') return

  const tone = tones[name]
  const context = getContext()

  // Browsers suspend AudioContext until a user gesture; resume before scheduling.
  if (context.state === 'suspended') {
    context.resume().catch(() => {})
  }

  const start = context.currentTime

  tone.notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const noteStart = start + index * tone.duration * 0.72

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, noteStart)
    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.linearRampToValueAtTime(tone.gain, noteStart + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + tone.duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(noteStart)
    oscillator.stop(noteStart + tone.duration)
  })
}

export function useSound() {
  const [isEnabled, setIsEnabled] = useState(readPreference)

  const play = useCallback((name: SoundName = 'tap') => {
    if (!isEnabled) return
    playSound(name)
  }, [isEnabled])

  const toggle = useCallback(() => {
    setIsEnabled((current) => {
      const next = !current
      window.localStorage.setItem('aula-sound', next ? 'on' : 'off')
      if (next) window.setTimeout(() => playSound('success'), 0)
      return next
    })
  }, [])

  return { isEnabled, play, toggle }
}
