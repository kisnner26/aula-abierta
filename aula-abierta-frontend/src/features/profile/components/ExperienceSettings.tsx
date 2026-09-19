import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, KeyRound, LogOut, Palette, ShieldAlert, Volume2 } from 'lucide-react'
import { Button, Input, toast } from '@core/ui'
import { useNavigate } from 'react-router-dom'
import { usePreferencesStore, type AccentColor } from '@core/store/preferencesStore'
import { useSound } from '@core/hooks/useSound'
import { useAuth } from '@core/auth/useAuth'
import { ROUTES } from '@router/routes'
import { buttonSpring } from '@core/config/motion'
import { cn } from '@core/utils'

interface CollapsibleCardProps {
  title: string
  eyebrow: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleCard({ title, eyebrow, icon, defaultOpen = false, children }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-left transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue dark:hover:bg-white/5 sm:p-6"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-sky/30 text-brand-blue">
          {icon}
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold text-brand-blue">{eyebrow}</p>
          <h2 className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{title}</h2>
        </div>
        <ChevronDown size={18} className={cn('text-neutral-400 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 sm:px-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-neutral-100 py-4 last:border-0 dark:border-white/10">
      <div>
        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{label}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-neutral-500 dark:text-neutral-400 text-pretty">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2',
          checked ? 'bg-brand-blue' : 'bg-neutral-200 dark:bg-neutral-600',
        )}
      >
        <span className={cn(
          'absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )} />
      </button>
    </div>
  )
}

const ACCENT_OPTIONS: Array<{ value: AccentColor; label: string; hex: string }> = [
  { value: 'blue',    label: 'Aula blue', hex: '#1D95FB' },
  { value: 'celeste', label: 'Aula sky', hex: '#A1D5F8' },
]

export function ExperienceSettings() {
  const { soundEnabled, setSoundEnabled, reduceMotion, setReduceMotion, accentColor, setAccentColor } = usePreferencesStore()
  const { play } = useSound()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const onSoundChange = (v: boolean) => {
    setSoundEnabled(v)
    if (v) play('success')
  }

  const onLogout = async () => {
    play('error')
    await logout()
    navigate(ROUTES.login, { replace: true })
  }

  // Change-password mutation: backend endpoint not yet exposed. UI is wired
  // and validated so it activates as soon as POST /auth/password ships.
  const onPasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 8) { toast.error('The new password must have at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { toast.error('The passwords do not match.'); return }
    toast.error('Password update is not available yet.')
  }

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleCard title="Sound and motion" eyebrow="EXPERIENCE" icon={<Volume2 size={20} aria-hidden="true" />} defaultOpen>
        <ToggleRow
          label="System sounds"
          description="Use subtle sound cues for actions, messages, and achievements."
          checked={soundEnabled}
          onChange={onSoundChange}
        />
        <ToggleRow
          label="Reduce motion"
          description="Minimize non-essential movement throughout your learning space."
          checked={reduceMotion}
          onChange={setReduceMotion}
        />
      </CollapsibleCard>

      <CollapsibleCard title="Brand accent" eyebrow="APPEARANCE" icon={<Palette size={20} aria-hidden="true" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAccentColor(option.value)}
              aria-pressed={accentColor === option.value}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-150',
                accentColor === option.value
                  ? 'border-brand-blue bg-brand-sky/20 dark:border-brand-blue dark:bg-brand-blue/10'
                  : 'border-neutral-200 hover:border-neutral-300 dark:border-white/10 dark:hover:border-white/20',
              )}
            >
              <span className="size-10 shrink-0 rounded-xl border border-white/40 shadow-soft" style={{ backgroundColor: option.hex }} aria-hidden="true" />
              <span>
                <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-100">{option.label}</span>
                <span className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">{option.hex}</span>
              </span>
            </button>
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Change password" eyebrow="ACCOUNT" icon={<KeyRound size={20} aria-hidden="true" />}>
        <form onSubmit={onPasswordSubmit} className="flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
          />
          <Button type="submit" disabled={!currentPassword || !newPassword || !confirmPassword}>
            Update password
          </Button>
        </form>
      </CollapsibleCard>

      <CollapsibleCard title="Sign out" eyebrow="SECURITY" icon={<ShieldAlert size={20} aria-hidden="true" />}>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          End the active session on this device. You will need your credentials to return.
        </p>
        <motion.button
          type="button"
          onClick={onLogout}
          whileTap={buttonSpring.whileTap}
          transition={buttonSpring.transition}
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-bold text-white shadow-red-soft hover:bg-red-700"
        >
          <LogOut size={17} aria-hidden="true" /> Sign out
        </motion.button>
      </CollapsibleCard>
    </div>
  )
}
