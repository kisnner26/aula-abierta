import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { login } from '../api'
import { useAuthStore } from '@core/auth/authStore'
import { storeTokens } from '@core/api/interceptors'
import { toast } from '@core/ui'
import { ROUTES } from '@router/routes'
import type { LoginCredentials } from '../types'
import type { AuthUser } from '@core/auth/types'
import type { Role as RoleType } from '@core/types/roles'

const dashboardByRole: Record<RoleType, string> = {
  student:     ROUTES.student.dashboard,
  teacher:     ROUTES.teacher.dashboard,
  admin:       ROUTES.coordinator.dashboard,
  super_admin: ROUTES.admin.dashboard,
  family:      ROUTES.family.dashboard,
}

function getLoginErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'The Aula Abierta API is not running. Start the backend and try again.'
    }

    return err.response.data?.message ?? 'Invalid credentials. Please try again.'
  }

  return 'Invalid credentials. Please try again.'
}

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const setUser    = useAuthStore((s) => s.setUser)
  const navigate   = useNavigate()
  const queryClient = useQueryClient()

  const submit = async (credentials: LoginCredentials) => {
    setLoading(true)
    setError(null)
    try {
      const res = await login(credentials)
      const { user: u, access_token, refresh_token } = res.data

      queryClient.clear()
      storeTokens(access_token, refresh_token, u.preferences.keep_signed_in)

      const authUser: AuthUser = {
        id:            u.id,
        sis_id:        u.sis_id,
        name:          u.name,
        role:          u.role as RoleType,
        avatar_url:    u.avatar_url,
        has_signed_nda: u.has_signed_nda,
        preferences:    u.preferences,
      }
      setUser(authUser)
      window.localStorage.setItem('aula_theme', authUser.preferences.theme)
      const dark = authUser.preferences.theme === 'dark'
        || (authUser.preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', dark)

      const destination = dashboardByRole[authUser.role] ?? ROUTES.login
      navigate(destination, { replace: true })
    } catch (err: unknown) {
      const msg = getLoginErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, error }
}
