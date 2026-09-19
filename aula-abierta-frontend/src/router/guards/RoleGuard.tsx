import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@core/auth/authStore'
import type { Role } from '@core/types/roles'
import { ROUTES } from '../routes'

interface RoleGuardProps {
  allowed: Role[]
}

export function RoleGuard({ allowed }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={ROUTES.login} replace />
  }

  return <Outlet />
}
