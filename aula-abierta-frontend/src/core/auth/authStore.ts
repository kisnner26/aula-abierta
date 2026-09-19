import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthUser } from './types'
import type { Role } from '../types/roles'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  clearSession: () => void
  hasRole: (...roles: Role[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearSession: () => set({ user: null, isAuthenticated: false }),

      hasRole: (...roles) => {
        const { user } = get()
        return user !== null && roles.includes(user.role)
      },
    }),
    {
      name: 'aula_auth',
      storage: createJSONStorage(() => (
        window.localStorage.getItem('aula_keep_session') === 'off'
          ? window.sessionStorage
          : window.localStorage
      )),
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
)
