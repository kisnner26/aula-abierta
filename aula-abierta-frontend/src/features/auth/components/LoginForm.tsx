import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, IdCard, KeyRound, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@core/ui'
import { useSound } from '@core/hooks/useSound'
import { cn } from '@core/utils'
import { useLogin } from '../hooks/useLogin'

export function LoginForm() {
  const { submit, loading, error } = useLogin()
  const [sisId, setSisId] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const sound = useSound()

  const displayError = localError ?? error
  const canSubmit = useMemo(() => sisId.trim().length > 0 && password.length > 0, [password, sisId])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sound.play('tap')

    if (!canSubmit) {
      setLocalError('Enter your ID and password to continue.')
      return
    }

    setLocalError(null)
    submit({ sis_id: sisId.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="sis-id" className="mb-2 block text-sm font-extrabold text-neutral-800 dark:text-neutral-100">
          Aula Abierta ID
        </label>
        <div
          className={cn(
            'group flex min-h-[60px] items-center gap-3 rounded-2xl border bg-white px-4 shadow-sm transition-all duration-200',
            'focus-within:-translate-y-0.5 focus-within:border-brand-blue focus-within:shadow-glow-blue motion-reduce:transition-none motion-reduce:focus-within:translate-y-0',
            displayError ? 'border-brand-red/60' : 'border-neutral-300',
            'dark:border-white/15 dark:bg-white/[.04]',
          )}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-sky/35 text-brand-blue dark:bg-brand-blue/15">
            <IdCard size={19} aria-hidden="true" />
          </span>
          <input
            id="sis-id"
            value={sisId}
            onChange={(e) => {
              setSisId(e.target.value)
              if (localError) setLocalError(null)
            }}
            onFocus={() => sound.play('focus')}
            placeholder="Enter your ID"
            autoComplete="username"
            autoFocus
            required
            className="form-input h-12 min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-extrabold uppercase text-neutral-900 placeholder:font-bold placeholder:normal-case placeholder:text-neutral-400 focus:ring-0 dark:text-white"
            aria-invalid={Boolean(displayError)}
            aria-describedby={displayError ? 'login-error' : 'login-help'}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-extrabold text-neutral-800 dark:text-neutral-100">
          Password
        </label>
        <div
          className={cn(
            'group flex min-h-[60px] items-center gap-3 rounded-2xl border bg-white px-4 shadow-sm transition-all duration-200',
            'focus-within:-translate-y-0.5 focus-within:border-brand-red focus-within:shadow-glow-red motion-reduce:transition-none motion-reduce:focus-within:translate-y-0',
            displayError ? 'border-brand-red/60' : 'border-neutral-300',
            'dark:border-white/15 dark:bg-white/[.04]',
          )}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-brand-red dark:bg-red-950/30">
            <KeyRound size={19} aria-hidden="true" />
          </span>
          <input
            id="password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (localError) setLocalError(null)
            }}
            onFocus={() => sound.play('focus')}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            className="form-input h-12 min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-bold text-neutral-900 placeholder:text-neutral-400 focus:ring-0 dark:text-white"
            aria-invalid={Boolean(displayError)}
            aria-describedby={displayError ? 'login-error' : 'login-help'}
          />
          <button
            type="button"
            onClick={() => {
              sound.play('tap')
              setShowPass((v) => !v)
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-brand-red focus-visible:ring-brand-red motion-reduce:transition-none dark:text-neutral-300 dark:hover:bg-white/[.08]"
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {displayError ? (
        <p id="login-error" className="flex items-start gap-2 rounded-2xl border border-brand-red/20 bg-brand-red/10 px-4 py-3 text-sm font-bold leading-5 text-brand-red" role="alert">
          <ShieldAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          {displayError}
        </p>
      ) : (
        <p id="login-help" className="flex items-center gap-2 text-xs font-bold leading-5 text-neutral-500 dark:text-neutral-400">
          <Sparkles size={14} className="text-brand-blue" aria-hidden="true" />
          Use the credentials assigned by your academic coordinator.
        </p>
      )}

      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        rightIcon={<ArrowRight size={18} aria-hidden="true" />}
        className="h-[60px] rounded-2xl text-base font-extrabold"
      >
        {loading ? 'Opening space' : 'Enter Aula Abierta'}
      </Button>
    </form>
  )
}
