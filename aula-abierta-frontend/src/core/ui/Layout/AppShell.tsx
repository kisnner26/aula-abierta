import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Mic,
  ShoppingBag,
  Tv,
  Settings,
  UserCircle2,
  Users,
  X,
} from 'lucide-react'
import { Avatar, Logo, NotificationPanel } from '@core/ui'
import { CommandPalette } from '@core/ui/CommandPalette'
import { notificationQueryKey, notificationsApi } from '@core/api/notifications'
import { useAuth } from '@core/auth/useAuth'
import { useSound } from '@core/hooks/useSound'
import { useRealtimeEvents } from '@core/hooks/useRealtimeEvents'
import { Role } from '@core/types/roles'
import { ROUTES } from '@router/routes'
import { cn } from '@core/utils'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Match the route exactly (no prefix match) so only ONE tab is active at a time. */
  end?: boolean
}

function getNavItems(role: string, pathname: string): NavItem[] {
  switch (role) {
    case Role.Student:
      return [
        { label: 'Home', to: ROUTES.student.dashboard, icon: LayoutDashboard, end: true },
        { label: 'Calendar', to: ROUTES.student.calendar, icon: CalendarDays },
        { label: 'Grades', to: ROUTES.student.grades, icon: BarChart3 },
        { label: 'Messages', to: ROUTES.student.messagesHub, icon: MessageCircle },
        { label: 'Word Lab', to: ROUTES.student.wordLab, icon: Brain },
        { label: 'Speak', to: ROUTES.student.pronunciation, icon: Mic },
        { label: 'Video Library', to: ROUTES.student.tv, icon: Tv },
        { label: 'Avatar Shop', to: ROUTES.student.shop, icon: ShoppingBag },
      ]
    case Role.Teacher:
      const classroomId = pathname.match(/^\/trainer\/classrooms\/(\d+)/)?.[1]
      return [
        { label: 'Trainer desk', to: ROUTES.teacher.dashboard, icon: LayoutDashboard, end: true },
        ...(classroomId ? [
          // `end: true` — the Classroom index tab matches ONLY its exact path, so it
          // stays visible (and singly-active) when Grading/Messages/etc. are open.
          { label: 'Classroom', to: ROUTES.teacher.classroom(classroomId), icon: BookOpen, end: true },
          { label: 'Grading', to: ROUTES.teacher.grading(classroomId), icon: ClipboardList },
          { label: 'Attendance', to: ROUTES.teacher.attendance(classroomId), icon: CalendarDays },
          { label: 'Messages', to: ROUTES.teacher.messages(classroomId), icon: MessageCircle },
          { label: 'Reports', to: ROUTES.teacher.reports(classroomId), icon: BarChart3 },
        ] : [
          // Outside a classroom the desk is the only route — pair it with Profile so
          // the mobile tab bar never renders a single full-width pill.
          { label: 'Profile', to: ROUTES.profile, icon: UserCircle2 },
        ]),
      ]
    case Role.Admin:
    case Role.SuperAdmin:
      return [
        { label: 'Dashboard', to: ROUTES.coordinator.dashboard, icon: LayoutDashboard, end: true },
        { label: 'Programs', to: ROUTES.coordinator.programs, icon: BookOpen },
        { label: 'Templates', to: ROUTES.coordinator.templates, icon: FileText },
        { label: 'Classrooms', to: ROUTES.coordinator.classrooms, icon: GraduationCap },
        { label: 'Students', to: ROUTES.coordinator.students, icon: Users },
        { label: 'Reports', to: ROUTES.coordinator.reports, icon: BarChart3 },
        ...(role === Role.SuperAdmin
          ? [
              { label: 'Users', to: ROUTES.admin.users, icon: Settings },
              { label: 'Audit Log', to: ROUTES.admin.auditLog, icon: ClipboardList },
            ]
          : []),
      ]
    default:
      return []
  }
}

const roleLabels: Record<string, string> = {
  student: 'Student',
  teacher: 'Trainer',
  admin: 'Coordinator',
  super_admin: 'Super Administrator',
}

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const { play } = useSound()
  useRealtimeEvents()

  const { data: notifications = [] } = useQuery({
    queryKey: notificationQueryKey(user?.id),
    queryFn: notificationsApi.list,
    enabled: Boolean(user),
    refetchInterval: 300_000, // 5-min fallback — SSE pushes updates in real time
  })

  useEffect(() => setMobileOpen(false), [location.pathname])

  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main) return
    main.scrollTop = 0
    const frame = window.requestAnimationFrame(() => {
      main.scrollTop = 0
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  if (!user) return null

  const navItems = getNavItems(user.role, location.pathname)
  const isItemActive = (item: NavItem, routerActive = false) => {
    if (routerActive) return true
    if (item.to === ROUTES.student.messagesHub) return location.pathname.includes('/messages')
    return false
  }
  const activeItem = navItems.find((item) => isItemActive(item, location.pathname === item.to)) ?? navItems[0]
  const pageLabel = location.pathname === ROUTES.profile ? 'Profile and settings' : activeItem?.label ?? roleLabels[user.role]
  const homeRoute = navItems[0]?.to ?? '/'
  const unreadCount = notifications.filter((notification) => !notification.read_at).length

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.login, { replace: true })
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-surface-card">
      <div className="h-1.5 shrink-0 bg-brand-red" aria-hidden="true" />
      <div className="px-5 pb-4 pt-6">
        <Link
          to={homeRoute}
          onClick={() => play('tap')}
          className="inline-flex overflow-hidden rounded-lg no-underline transition-transform duration-150 hover:scale-[1.02] hover:no-underline motion-reduce:transition-none"
          aria-label="Aula Abierta home"
        >
          <Logo variant="horizontal" height={29} />
        </Link>

        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.04]">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-red text-white">
            <GraduationCap size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500">Learning space</p>
            <p className="truncate text-sm font-bold text-neutral-800 dark:text-neutral-100">{roleLabels[user.role]}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Primary navigation">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) => cn(
                  'group relative flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-bold no-underline transition-colors duration-150 hover:no-underline',
                  isItemActive(item, isActive)
                    ? 'bg-brand-red text-white shadow-sm dark:bg-brand-red dark:text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[.06] dark:hover:text-neutral-100',
                )}
                onClick={() => play('tap')}
              >
                {({ isActive }) => {
                  const active = isItemActive(item, isActive)
                  return (
                    <>
                    {active && <span className="absolute right-3 size-2 rounded-full bg-brand-yellow" aria-hidden="true" />}
                    <span className={cn(
                      'flex size-8 items-center justify-center transition-colors duration-150',
                      active ? 'text-white' : 'text-neutral-400 group-hover:text-brand-blue dark:text-neutral-500 dark:group-hover:text-brand-sky',
                    )}>
                      <item.icon size={18} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    </>
                  )
                }}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-neutral-100 bg-neutral-50 px-3 py-4 dark:border-white/10 dark:bg-surface-sunken">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.profile}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-neutral-900 no-underline transition-colors duration-150 hover:bg-white hover:no-underline dark:text-white dark:hover:bg-white/[.06]"
          >
            <Avatar name={user.name} role={user.role as never} src={user.avatar_url} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-neutral-800 dark:text-neutral-100">{user.name}</span>
              <span className="block truncate text-xs font-semibold text-neutral-400 dark:text-neutral-500">{user.sis_id}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex size-10 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-red-50 hover:text-brand-red dark:text-neutral-500 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            aria-label="Sign out"
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface-paper dark:bg-surface-page">
      <a href="#main-content" className="sr-only z-50 rounded-xl bg-white px-4 py-3 font-bold text-brand-blue focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>
      <div className="h-1 shrink-0 bg-brand-red" aria-hidden="true" />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-neutral-900/55 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-neutral-100 bg-white dark:border-white/10 dark:bg-surface-card lg:hidden"
              aria-label="Mobile navigation"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-xl bg-white text-neutral-500 shadow-sm dark:bg-surface-overlay dark:text-neutral-300"
                aria-label="Close navigation"
              >
                <X size={18} aria-hidden="true" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 dark:border-white/10 dark:bg-surface-card sm:px-6 lg:px-8">
          <Link to={homeRoute} onClick={() => play('tap')} className="hidden shrink-0 no-underline hover:no-underline lg:block" aria-label="Aula Abierta home">
            <Logo variant="horizontal" height={27} />
          </Link>
          <span className="mx-2 hidden h-8 w-px bg-neutral-200 dark:bg-white/10 lg:block" aria-hidden="true" />
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[.06] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-xs font-bold text-brand-red">{roleLabels[user.role]}</p>
            <p className="truncate font-display text-lg font-extrabold text-neutral-900 dark:text-white">{pageLabel}</p>
          </div>
          <nav className="hidden min-w-0 flex-1 items-center justify-center lg:flex" aria-label="Primary navigation">
            <ul className="flex max-w-full items-center gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <li key={item.to} className="shrink-0">
                  <NavLink
                    to={item.to}
                    end={item.end ?? false}
                    onClick={() => play('tap')}
                    className={({ isActive }) => cn(
                      'group/nav relative flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold no-underline transition-colors duration-200 hover:no-underline xl:px-4 xl:text-sm',
                      isItemActive(item, isActive)
                        ? 'text-white'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[.06] dark:hover:text-white',
                    )}
                  >
                    {({ isActive }) => {
                      const active = isItemActive(item, isActive)
                      return (
                        <>
                          {active && (
                            <motion.span
                              layoutId="nav-pill"
                              className="absolute inset-0 rounded-lg bg-gradient-red shadow-sm"
                              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                              aria-hidden="true"
                            />
                          )}
                          <item.icon size={16} aria-hidden="true" className="relative transition-transform duration-200 group-hover/nav:scale-110 motion-reduce:group-hover/nav:transform-none" />
                          <span className="relative">{item.label}</span>
                        </>
                      )
                    }}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <span className="hidden shrink-0 rounded-full bg-brand-cream px-3 py-1.5 text-xs font-bold text-brand-red xl:inline-flex dark:bg-red-950/30 dark:text-red-300">{roleLabels[user.role]}</span>
          <button
            type="button"
            className="relative flex size-10 items-center justify-center rounded-xl text-neutral-500 transition-colors duration-150 hover:bg-red-50 hover:text-brand-red dark:text-neutral-400 dark:hover:bg-red-950/35 dark:hover:text-red-300"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              play('message')
              setNotificationsOpen((current) => !current)
            }}
          >
            <Bell size={18} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full border-2 border-white bg-brand-red px-1 text-[10px] font-extrabold tabular-nums text-white dark:border-surface-card">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              play('focus')
              navigate(ROUTES.profile)
            }}
            className="rounded-full transition-transform duration-150 hover:scale-105 motion-reduce:hover:scale-100"
            aria-label="Open profile and settings"
          >
            <Avatar name={user.name} role={user.role as never} src={user.avatar_url} size="sm" />
          </button>
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto pb-28 lg:pb-0" id="main-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
      </main>
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} userId={user.id} />
      <CommandPalette />
      <nav className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-30 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-surface-raised lg:hidden" aria-label="Mobile primary navigation">
        <ul className="grid grid-flow-col auto-cols-fr">
          {navItems.slice(0, 5).map((item) => {
            const active = isItemActive(item, location.pathname === item.to)
            return <li key={item.to}><Link to={item.to} onClick={() => play('tap')} aria-current={active ? 'page' : undefined} className={cn('flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold no-underline hover:no-underline', active ? 'bg-brand-red text-white' : 'text-neutral-500 dark:text-neutral-400')}><item.icon size={18} aria-hidden="true" /><span className="max-w-full truncate">{item.label}</span></Link></li>
          })}
        </ul>
      </nav>
    </div>
  )
}
