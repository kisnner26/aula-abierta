import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Command,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Moon,
  Search,
  Settings,
  ShoppingBag,
  Sun,
  Tv,
  Users,
  Volume2,
  Mic,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@core/auth/useAuth'
import { Role } from '@core/types/roles'
import { ROUTES } from '@router/routes'
import { cn } from '@core/utils'
import { useSound } from '@core/hooks/useSound'
import { EASE_OUT, SPRING_POP } from '@core/motion'

// ── Types ────────────────────────────────────────────────────────────────────

interface CommandAction {
  id: string
  label: string
  group: string
  icon: LucideIcon
  /** Run the action: navigate to path or call a side-effectful fn */
  run: () => void
}

// ── Dark mode helper (persists to localStorage) ───────────────────────────

const THEME_KEY = 'aula_theme'

function toggleDarkMode() {
  const html = document.documentElement
  const isDark = html.classList.contains('dark')
  if (isDark) {
    html.classList.remove('dark')
    localStorage.setItem(THEME_KEY, 'light')
  } else {
    html.classList.add('dark')
    localStorage.setItem(THEME_KEY, 'dark')
  }
}

function isDarkActive() {
  return document.documentElement.classList.contains('dark')
}

// ── Build action list per role ────────────────────────────────────────────

function buildActions(
  role: string,
  navigate: (path: string) => void,
  closeAndPlay: (sound: 'tap' | 'success') => void,
): CommandAction[] {
  const nav = (path: string): (() => void) =>
    () => {
      closeAndPlay('tap')
      navigate(path)
    }

  const studentActions: CommandAction[] = [
    { id: 'student-home',        label: 'Home',           group: 'Navigate',  icon: LayoutDashboard, run: nav(ROUTES.student.dashboard) },
    { id: 'student-calendar',    label: 'Calendar',       group: 'Navigate',  icon: CalendarDays,    run: nav(ROUTES.student.calendar) },
    { id: 'student-grades',      label: 'Grades',         group: 'Navigate',  icon: BarChart3,       run: nav(ROUTES.student.grades) },
    { id: 'student-messages',    label: 'Messages',       group: 'Navigate',  icon: MessageCircle,   run: nav(ROUTES.student.messagesHub) },
    { id: 'student-tv',          label: 'Video Library',   group: 'Navigate',  icon: Tv,              run: nav(ROUTES.student.tv) },
    { id: 'student-wordlab',     label: 'Word Lab',       group: 'Navigate',  icon: BookOpen,        run: nav(ROUTES.student.wordLab) },
    { id: 'student-shop',        label: 'Avatar Shop',       group: 'Navigate',  icon: ShoppingBag,     run: nav(ROUTES.student.shop) },
    { id: 'student-pronun',      label: 'Pronunciation',  group: 'Navigate',  icon: Mic,             run: nav(ROUTES.student.pronunciation) },
    { id: 'student-profile',     label: 'Profile',        group: 'Navigate',  icon: Settings,        run: nav(ROUTES.profile) },
  ]

  const teacherActions: CommandAction[] = [
    { id: 'teacher-desk',    label: 'Trainer desk', group: 'Navigate', icon: LayoutDashboard, run: nav(ROUTES.teacher.dashboard) },
    { id: 'teacher-profile', label: 'Profile',      group: 'Navigate', icon: Settings,        run: nav(ROUTES.profile) },
  ]

  const adminActions: CommandAction[] = [
    { id: 'admin-dashboard',  label: 'Dashboard',   group: 'Navigate', icon: LayoutDashboard, run: nav(ROUTES.coordinator.dashboard) },
    { id: 'admin-programs',   label: 'Programs',    group: 'Navigate', icon: BookOpen,        run: nav(ROUTES.coordinator.programs) },
    { id: 'admin-templates',  label: 'Templates',   group: 'Navigate', icon: FileText,        run: nav(ROUTES.coordinator.templates) },
    { id: 'admin-classrooms', label: 'Classrooms',  group: 'Navigate', icon: GraduationCap,   run: nav(ROUTES.coordinator.classrooms) },
    { id: 'admin-students',   label: 'Students',    group: 'Navigate', icon: Users,           run: nav(ROUTES.coordinator.students) },
    { id: 'admin-reports',    label: 'Reports',     group: 'Navigate', icon: BarChart3,       run: nav(ROUTES.coordinator.reports) },
    { id: 'admin-profile',    label: 'Profile',     group: 'Navigate', icon: Settings,        run: nav(ROUTES.profile) },
  ]

  const superAdminExtra: CommandAction[] = [
    { id: 'sadmin-users',     label: 'Users',      group: 'Navigate', icon: Users,        run: nav(ROUTES.admin.users) },
    { id: 'sadmin-auditlog',  label: 'Audit Log',  group: 'Navigate', icon: ClipboardList, run: nav(ROUTES.admin.auditLog) },
  ]

  let roleActions: CommandAction[] = []
  if (role === Role.Student) roleActions = studentActions
  else if (role === Role.Teacher) roleActions = teacherActions
  else if (role === Role.Admin) roleActions = adminActions
  else if (role === Role.SuperAdmin) roleActions = [...adminActions, ...superAdminExtra]

  // ── Universal actions (appended regardless of role) ─────────────────────
  const universalActions: CommandAction[] = [
    {
      id: 'toggle-dark',
      label: isDarkActive() ? 'Switch to light mode' : 'Switch to dark mode',
      group: 'Preferences',
      icon: isDarkActive() ? Sun : Moon,
      run: () => {
        toggleDarkMode()
        closeAndPlay('success')
      },
    },
    {
      id: 'toggle-sound',
      label: 'Sound toggle',
      group: 'Preferences',
      icon: Volume2,
      run: () => {
        closeAndPlay('tap')
      },
    },
  ]

  return [...roleActions, ...universalActions]
}

// ── Substring filter ──────────────────────────────────────────────────────

function filterActions(actions: CommandAction[], query: string): CommandAction[] {
  const q = query.trim().toLowerCase()
  if (!q) return actions
  return actions.filter(
    (a) =>
      a.label.toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q),
  )
}

// ── Component ─────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const reducedMotion = useReducedMotion()

  const { user } = useAuth()
  const navigate = useNavigate()
  const { play } = useSound()

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }, [])

  const closeAndPlay = useCallback(
    (sound: 'tap' | 'success') => {
      play(sound)
      close()
    },
    [close, play],
  )

  // Build actions fresh each open (so dark-mode label stays current)
  const allActions = useMemo(
    () => buildActions(user?.role ?? '', navigate, closeAndPlay),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.role, open],
  )

  const filtered = useMemo(() => filterActions(allActions, query), [allActions, query])

  // Clamp activeIndex when list changes
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(filtered.length - 1, 0)))
  }, [filtered.length])

  // Global Cmd/Ctrl+K and '/' shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !inInput)) {
        e.preventDefault()
        setOpen((prev) => {
          if (prev) return false
          return true
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Esc closes from within the palette
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [open, close])

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Keyboard navigation within palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const action = filtered[activeIndex]
        if (action) action.run()
      }
    },
    [activeIndex, filtered],
  )

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Group results
  const groups = useMemo(() => {
    const map = new Map<string, CommandAction[]>()
    for (const action of filtered) {
      const arr = map.get(action.group) ?? []
      arr.push(action)
      map.set(action.group, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: reducedMotion ? 0 : 0.15 } },
    exit: { opacity: 0, transition: { duration: reducedMotion ? 0 : 0.1 } },
  }

  const panelVariants = {
    hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : -8 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: reducedMotion
        ? { duration: 0 }
        : { ...SPRING_POP },
    },
    exit: {
      opacity: 0,
      scale: reducedMotion ? 1 : 0.96,
      y: reducedMotion ? 0 : -6,
      transition: { duration: reducedMotion ? 0 : 0.12, ease: EASE_OUT },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: reducedMotion ? 0 : -6 },
    show: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: reducedMotion
        ? { duration: 0 }
        : { duration: 0.18, ease: EASE_OUT, delay: i * 0.025 },
    }),
  }

  if (!user) return null

  // Flat index offset per group for keyboard highlighting
  let flatIndex = 0

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[9000] flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className={cn(
              'relative z-10 flex w-full max-w-[600px] flex-col overflow-hidden',
              'rounded-2xl border border-neutral-200 bg-white/95 shadow-2xl backdrop-blur-xl',
              'dark:border-white/10 dark:bg-surface-card/95',
            )}
            style={{ maxHeight: 'min(520px, 72vh)' }}
          >
            {/* Header / Search input */}
            <div className="flex shrink-0 items-center gap-3 border-b border-neutral-100 px-4 py-3.5 dark:border-white/10">
              <Search
                size={17}
                className="shrink-0 text-neutral-400 dark:text-neutral-500"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="command-palette-list"
                aria-activedescendant={
                  filtered[activeIndex] ? `cp-item-${filtered[activeIndex]?.id}` : undefined
                }
                aria-expanded={filtered.length > 0}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search actions..."
                className={cn(
                  'min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400 outline-none',
                  'dark:text-white dark:placeholder:text-neutral-500',
                )}
                autoComplete="off"
                spellCheck={false}
              />
              {/* Kbd hint */}
              <kbd
                className="hidden shrink-0 items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-[10px] font-bold text-neutral-400 sm:flex dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-500"
                aria-label="Escape to close"
              >
                Esc
              </kbd>
              <span
                className="shrink-0 flex size-7 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.04]"
                aria-hidden="true"
              >
                <Command size={12} className="text-neutral-400 dark:text-neutral-500" />
              </span>
            </div>

            {/* Results list */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Search size={28} className="text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
                  <p className="text-sm font-semibold text-neutral-400 dark:text-neutral-500">
                    No results for <span className="text-neutral-700 dark:text-neutral-300">"{query}"</span>
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-600">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <ul
                  ref={listRef}
                  id="command-palette-list"
                  role="listbox"
                  aria-label="Actions"
                  className="p-2"
                >
                  {groups.map(([groupName, actions]) => (
                    <li key={groupName} role="presentation">
                      <div
                        className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-600"
                        aria-hidden="true"
                      >
                        {groupName}
                      </div>
                      <ul role="group" aria-label={groupName}>
                        {actions.map((action) => {
                          const index = flatIndex++
                          const isActive = index === activeIndex
                          return (
                            <motion.li
                              key={action.id}
                              id={`cp-item-${action.id}`}
                              role="option"
                              aria-selected={isActive}
                              variants={itemVariants}
                              initial="hidden"
                              animate="show"
                              custom={index}
                              onClick={() => action.run()}
                              onMouseEnter={() => setActiveIndex(index)}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-100',
                                isActive
                                  ? 'bg-brand-blue text-white shadow-sm'
                                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[.06]',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-brand-sky/30 text-brand-blue dark:bg-white/[.06] dark:text-brand-sky',
                                )}
                              >
                                <action.icon size={15} aria-hidden="true" strokeWidth={2} />
                              </span>
                              <span className="min-w-0 flex-1 truncate">{action.label}</span>
                              {isActive && (
                                <kbd
                                  className="hidden shrink-0 rounded-md border border-white/30 bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white/80 sm:inline-flex"
                                  aria-hidden="true"
                                >
                                  Enter
                                </kbd>
                              )}
                            </motion.li>
                          )
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer hint */}
            <div
              className="flex shrink-0 items-center gap-4 border-t border-neutral-100 bg-neutral-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/[.02]"
              aria-hidden="true"
            >
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-600">
                <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono dark:border-white/10 dark:bg-white/[.06]">↑</kbd>
                <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono dark:border-white/10 dark:bg-white/[.06]">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-600">
                <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono dark:border-white/10 dark:bg-white/[.06]">Enter</kbd>
                run
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-600">
                <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono dark:border-white/10 dark:bg-white/[.06]">⌘K</kbd>
                toggle
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default CommandPalette
