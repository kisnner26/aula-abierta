import { useEffect, useState } from 'react'
import type { ThemePreference } from '@core/auth/types'

function resolveDark(theme: ThemePreference) {
  return theme === 'dark'
    || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

export function applyTheme(theme: ThemePreference) {
  window.localStorage.setItem('aula_theme', theme)
  document.documentElement.classList.toggle('dark', resolveDark(theme))
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() => (
    (window.localStorage.getItem('aula_theme') as ThemePreference | null) ?? 'system'
  ))
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      setSystemDark(media.matches)
      if (theme === 'system') applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next: ThemePreference) => {
    setThemeState(next)
    applyTheme(next)
  }

  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  return { theme, isDark, setTheme }
}
