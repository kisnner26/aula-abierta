import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, Camera, Check, Laptop, Moon, Save, ShieldCheck, Sun, Trash2 } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Avatar, Button, ContentPanel, Input, PageCanvas, Skeleton, toast, WorkspaceHero } from '@core/ui'
import { useAuth } from '@core/auth/useAuth'
import { setSessionPersistence } from '@core/api/interceptors'
import { useTheme } from '@core/hooks/useTheme'
import { profileApi } from '../api'
import { ExperienceSettings } from '../components/ExperienceSettings'
import { cn } from '@core/utils'
import type { ThemePreference, UserPreferences } from '@core/auth/types'
import type { LucideIcon } from 'lucide-react'

const themeOptions: Array<{ value: ThemePreference; label: string; icon: LucideIcon }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
]

interface PreferenceToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function PreferenceToggle({ label, description, checked, onChange }: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-neutral-100 py-4 last:border-0 dark:border-white/10">
      <div>
        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{label}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-neutral-500 text-pretty dark:text-neutral-400">{description}</p>
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
          'absolute top-1 left-1 flex size-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}>
          {checked && <Check size={10} strokeWidth={3} className="text-brand-blue" aria-hidden="true" />}
        </span>
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { user, setUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [preferences, setPreferences] = useState<UserPreferences>(user?.preferences ?? {
    theme,
    keep_signed_in: true,
    notification_messages: true,
    notification_tasks: true,
    notification_grades: true,
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  })

  useEffect(() => {
    if (!profile) return
    setName(profile.name)
    setPreferences(profile.preferences)
    setTheme(profile.preferences.theme)
  }, [profile])

  const syncUser = (updated: typeof user) => {
    if (!updated) return
    setUser(updated)
    queryClient.setQueryData(['profile'], updated)
  }

  const saveProfile = useMutation({
    mutationFn: () => profileApi.update({ name: name.trim(), preferences }),
    onSuccess: (updated) => {
      syncUser(updated)
      setTheme(updated.preferences.theme)
      setSessionPersistence(updated.preferences.keep_signed_in)
      toast.success('Profile and preferences saved.')
    },
    onError: () => toast.error('Could not save your profile.'),
  })

  const updateAvatar = useMutation({
    mutationFn: profileApi.updateAvatar,
    onSuccess: (updated) => {
      syncUser(updated)
      toast.success('Profile photo updated.')
    },
    onError: () => toast.error('Use a JPG, PNG, or WebP image under 5 MB.'),
  })

  const removeAvatar = useMutation({
    mutationFn: profileApi.removeAvatar,
    onSuccess: (updated) => {
      syncUser(updated)
      toast.success('Profile photo removed.')
    },
  })

  const onAvatarSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) updateAvatar.mutate(file)
    event.target.value = ''
  }

  const changePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }))
    if (key === 'theme') setTheme(value as ThemePreference)
  }

  if (isLoading || !user) {
    return (
      <AppShell>
        <PageCanvas className="gap-4">
          <Skeleton.Line width={280} height={40} />
          <Skeleton.Card />
        </PageCanvas>
      </AppShell>
    )
  }

  const activeProfile = profile ?? user

  return (
    <AppShell>
      <PageCanvas>
        <WorkspaceHero
          eyebrow="YOUR AULA SPACE"
          title="Profile and settings"
          description="Personalize your photo, theme, session, and the notifications that help you stay on track."
          image="placeholder"
          imageAlt="Aula Abierta illustration customizing profile settings"
          imagePosition="object-center"
        />

        <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-card">
            <div className="h-2 bg-brand-yellow" aria-hidden="true" />
            <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar
                  name={activeProfile.name}
                  role={activeProfile.role as never}
                  src={activeProfile.avatar_url}
                  size="xl"
                  className="!size-28 !text-3xl"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-xl bg-brand-blue text-white shadow-sm transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 motion-reduce:hover:scale-100"
                  aria-label="Change profile photo"
                >
                  <Camera size={18} aria-hidden="true" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatarSelected} className="hidden" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{activeProfile.name}</h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">{activeProfile.sis_id}</p>
              <span className="mt-3 rounded-full bg-brand-cream px-3 py-1.5 text-xs font-bold capitalize text-brand-red">
                {activeProfile.role === 'teacher' ? 'Trainer' : activeProfile.role.replace('_', ' ')}
              </span>
              {activeProfile.avatar_url && (
                <button
                  type="button"
                  onClick={() => removeAvatar.mutate()}
                  disabled={removeAvatar.isPending}
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-600 transition-colors duration-150 hover:border-brand-red hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red dark:border-white/10 dark:text-neutral-300"
                >
                  <Trash2 size={15} aria-hidden="true" /> Remove photo
                </button>
              )}
            </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            <ContentPanel eyebrow="ACCOUNT" title="Personal details">
              <div className="p-5 sm:p-6">
              <Input
                id="profile-name"
                label="Display name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                helperText="Your student or staff ID cannot be changed here."
                leftIcon={<ShieldCheck size={17} aria-hidden="true" />}
                fullWidth
              />
              </div>
            </ContentPanel>

            <ContentPanel eyebrow="APPEARANCE" title="Color mode">
              <div className="grid grid-cols-3 gap-2 p-5 sm:p-6">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changePreference('theme', option.value)}
                    className={cn(
                      'flex min-h-12 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                      preferences.theme === option.value
                        ? 'border-brand-blue bg-brand-sky/20 text-brand-blue'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-800 dark:border-white/10 dark:text-neutral-400 dark:hover:text-white',
                    )}
                    aria-pressed={preferences.theme === option.value}
                  >
                    <option.icon size={16} aria-hidden="true" /> {option.label}
                  </button>
                ))}
              </div>
            </ContentPanel>

            <ContentPanel
              eyebrow="PREFERENCES"
              title="Notifications and session"
              action={<span className="flex size-10 items-center justify-center rounded-xl bg-brand-yellow/30 text-yellow-800"><BellRing size={18} aria-hidden="true" /></span>}
            >
              <div className="px-5 pb-2 sm:px-6">
                <PreferenceToggle
                  label="Messages"
                  description="Notify me when a trainer or student sends a new message."
                  checked={preferences.notification_messages}
                  onChange={(value) => changePreference('notification_messages', value)}
                />
                <PreferenceToggle
                  label="Tasks and submissions"
                  description="Show deadline reminders and new work waiting for review."
                  checked={preferences.notification_tasks}
                  onChange={(value) => changePreference('notification_tasks', value)}
                />
                <PreferenceToggle
                  label="Grades and rubric feedback"
                  description="Notify me when a complete rubric result is saved."
                  checked={preferences.notification_grades}
                  onChange={(value) => changePreference('notification_grades', value)}
                />
                <PreferenceToggle
                  label="Keep me signed in"
                  description="Keep this session available after closing the browser on this device."
                  checked={preferences.keep_signed_in}
                  onChange={(value) => changePreference('keep_signed_in', value)}
                />
              </div>
            </ContentPanel>

            <Button
              onClick={() => saveProfile.mutate()}
              loading={saveProfile.isPending}
              disabled={name.trim().length < 2}
              size="lg"
              variant="danger"
              leftIcon={<Save size={17} aria-hidden="true" />}
              className="self-end"
            >
              Save settings
            </Button>

            <ExperienceSettings />
          </div>
        </div>
      </PageCanvas>
    </AppShell>
  )
}
