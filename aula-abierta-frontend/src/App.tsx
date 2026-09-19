import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { ToastContainer } from './core/ui'
import { attachInterceptors } from './core/api/interceptors'
import { apiClient } from './core/api/client'
import { useAuthStore } from './core/auth/authStore'
import { usePreferencesStore } from './core/store/preferencesStore'
import { useEffect } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 5,
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
})

attachInterceptors(apiClient, () => {
  useAuthStore.getState().clearSession()
  window.location.href = '/login'
})

export default function App() {
  const reduceMotion = usePreferencesStore((state) => state.reduceMotion)

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [reduceMotion])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <ToastContainer />
    </QueryClientProvider>
  )
}
