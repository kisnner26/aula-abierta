import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@core/auth/authStore'
import { ROUTES } from '../routes'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  return <Outlet />
}
