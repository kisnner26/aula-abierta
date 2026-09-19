import { useCallback } from 'react'
import { usePreferencesStore } from '@core/store/preferencesStore'
import { playSound, type SoundName } from './useSoundEngine'

export { playSound } from './useSoundEngine'

type SoundType = SoundName | 'notification'

const TONE_MAP: Record<SoundType, SoundName> = {
  tap: 'tap',
  focus: 'focus',
  success: 'success',
  error: 'error',
  notification: 'message',
  message: 'message',
  achievement: 'achievement',
}

/**
 * Spec-aligned sound API. Internally delegates to the existing
 * Web Audio tones so we don't keep two synthesizers around.
 */
export function useSound() {
  const soundEnabled = usePreferencesStore((s) => s.soundEnabled)
  const setSoundEnabled = usePreferencesStore((s) => s.setSoundEnabled)

  const play = useCallback((type: SoundType) => {
    if (!soundEnabled) return
    playSound(TONE_MAP[type])
  }, [soundEnabled])

  const toggle = useCallback(() => setSoundEnabled(!soundEnabled), [setSoundEnabled, soundEnabled])

  return { play, soundEnabled, isEnabled: soundEnabled, toggle }
}
