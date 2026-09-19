import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './authStore'
import { clearTokens } from '../api/interceptors'
import { apiClient, EP } from '../api'

export function useAuth() {
  const queryClient     = useQueryClient()
  const user            = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasRole         = useAuthStore((s) => s.hasRole)
  const setUser         = useAuthStore((s) => s.setUser)
  const clearSession    = useAuthStore((s) => s.clearSession)

  const logout = async () => {
    try {
      await apiClient.post(EP.auth.logout)
    } catch {
      // token may already be invalid — proceed with local cleanup
    } finally {
      clearTokens()
      clearSession()
      queryClient.clear()
    }
  }

  return { user, isAuthenticated, hasRole, setUser, clearSession, logout }
}
