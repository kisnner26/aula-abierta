import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type AccentColor = 'blue' | 'celeste'

interface PreferencesState {
  soundEnabled: boolean
  setSoundEnabled: (value: boolean) => void
  reduceMotion: boolean
  setReduceMotion: (value: boolean) => void
  accentColor: AccentColor
  setAccentColor: (value: AccentColor) => void
}

/**
 * Source of truth for UX-only preferences (sound, motion, accent).
 * `soundEnabled` mirrors the existing `aula-sound` localStorage key so
 * the older useSound hook keeps reading the right value.
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      soundEnabled: typeof window === 'undefined' ? true : window.localStorage.getItem('aula-sound') !== 'off',
      setSoundEnabled: (value) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('aula-sound', value ? 'on' : 'off')
        }
        set({ soundEnabled: value })
      },
      reduceMotion: false,
      setReduceMotion: (value) => set({ reduceMotion: value }),
      accentColor: 'blue',
      setAccentColor: (value) => set({ accentColor: value }),
    }),
    {
      name: 'aula_preferences',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (s) => ({ reduceMotion: s.reduceMotion, accentColor: s.accentColor }),
    },
  ),
)
