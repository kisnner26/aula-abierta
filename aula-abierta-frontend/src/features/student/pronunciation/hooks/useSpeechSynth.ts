import { useCallback, useRef, useState } from 'react'

/**
 * Thin wrapper around the browser SpeechSynthesis API.
 * Plays the word in en-US and exposes `speaking` state for animation.
 */
export function useSpeechSynth() {
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    utter.rate = 0.85
    utter.pitch = 1

    // Prefer an en-US voice if available
    const voices = window.speechSynthesis.getVoices()
    const enUs = voices.find(
      (v) => v.lang === 'en-US' && v.localService,
    ) ?? voices.find((v) => v.lang.startsWith('en'))
    if (enUs) utter.voice = enUs

    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)

    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
    setSpeaking(true)
  }, [])

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { speak, cancel, speaking }
}
