import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { apiClient } from '@core/api'
import { storeTokens } from '@core/api/interceptors'
import { useAuthStore } from '@core/auth/authStore'
import { Logo } from '@core/ui'
import { ROUTES } from '@router/routes'
import type { AuthUser } from '@core/auth/types'

interface QrAccessResponse {
  data: {
    user: AuthUser
    access_token: string
    refresh_token: string
    classroom_id: number
  }
}

export default function QrAccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const token = params.get('token') ?? ''
  const access = useQuery({
    queryKey: ['qr-access', token],
    queryFn: () => apiClient.post<QrAccessResponse>('/auth/qr-access', { token }).then((response) => response.data.data),
    enabled: token.length === 64,
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!access.data) return
    storeTokens(access.data.access_token, access.data.refresh_token, false)
    setUser(access.data.user)
    navigate(ROUTES.student.classroom(access.data.classroom_id), { replace: true })
  }, [access.data, navigate, setUser])

  if (!token) return <Navigate to={ROUTES.login} replace />

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-red px-5 py-10">
      <section className="w-full max-w-md rounded-[24px] bg-white p-8 text-center shadow-xl" aria-live="polite">
        <Logo variant="horizontal" height={40} />
        {access.isError ? (
          <>
            <div className="mx-auto mt-8 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-brand-red">
              <ShieldCheck size={25} aria-hidden="true" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-neutral-900 text-balance">This classroom pass has expired</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500 text-pretty">Ask your coordinator to generate a new QR code for this device.</p>
            <a href={ROUTES.login} className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red px-5 text-sm font-bold text-white no-underline hover:bg-red-700 hover:no-underline">Return to sign in</a>
          </>
        ) : (
          <>
            <LoaderCircle size={32} className="mx-auto mt-9 animate-spin text-brand-blue motion-reduce:animate-none" aria-hidden="true" />
            <h1 className="mt-5 font-display text-2xl font-extrabold text-neutral-900 text-balance">Opening your course</h1>
            <p className="mt-2 text-sm font-semibold text-neutral-500">Securely connecting this device to your classroom.</p>
          </>
        )}
      </section>
    </main>
  )
}
