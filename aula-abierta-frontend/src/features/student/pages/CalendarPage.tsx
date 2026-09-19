import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CalendarCheck2, ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Skeleton, WorkspaceHero } from '@core/ui'
import { studentApi } from '../api'
import { downloadICS } from '@core/utils/calendar'
import { formatDate } from '@core/utils/date'
import { MonthCalendar } from '../components/MonthCalendar'
import { buildEventsFromTasks, startOfWeek, WeekCalendar, type CalendarEvent } from '../components/WeekCalendar'
import { ROUTES } from '@router/routes'
import { cn } from '@core/utils'
import { pageVariants, slideUp } from '@core/config/motion'

type View = 'week' | 'month'

function toKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function CalendarPage() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['student', 'tasks', 'upcoming'],
    queryFn: studentApi.getUpcomingTasks,
  })

  const [view, setView] = useState<View>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(toKey(new Date()))
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const events = useMemo(() => buildEventsFromTasks(tasks ?? []), [tasks])

  const shiftWeek = (days: number) => {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(prev.getDate() + days)
      return d
    })
  }

  const goToday = () => {
    const now = new Date()
    setWeekStart(startOfWeek(now))
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(toKey(now))
  }

  const eventTaskId = selectedEvent?.id.startsWith('task-') ? Number(selectedEvent.id.slice(5)) : null

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-container flex flex-col gap-5 py-6 sm:py-8">
          <Skeleton.Line width={280} height={40} />
          <Skeleton.Card />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="page-container flex flex-col gap-5 py-6 sm:py-8"
      >
        <WorkspaceHero
          eyebrow="LEARNING CALENDAR"
          title="Your week, clearly planned"
          description="See live classes, activity deadlines, and completed work in one Aula Abierta calendar."
          image="placeholder"
          imageAlt="Aula Abierta illustration planning the learning week"
          tone="blue"
          imagePosition="object-[58%_center]"
        />
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-brand-blue">PLAN YOUR WEEK</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
              {(['week', 'month'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    'min-h-9 rounded-lg px-3 text-xs font-bold transition-colors duration-150',
                    view === v ? 'bg-white text-brand-blue shadow-soft dark:bg-surface-raised' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200',
                  )}
                  aria-pressed={view === v}
                >
                  {v === 'week' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={goToday}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand-blue px-3 text-xs font-bold text-white shadow-soft hover:bg-blue-600"
            >
              <CalendarCheck2 size={14} aria-hidden="true" /> Today
            </button>
            <button
              type="button"
              onClick={() => downloadICS('aula-abierta-deadlines', (tasks ?? []).map((task) => ({
                title: `Aula Abierta · ${task.title}`,
                start: new Date(task.deadline),
                description: 'Activity deadline',
              })))}
              disabled={(tasks ?? []).length === 0}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-600 hover:border-brand-blue hover:text-brand-blue disabled:opacity-50 dark:border-white/10 dark:text-neutral-300"
              title="Export deadlines to your phone calendar (.ics)"
            >
              <Download size={14} aria-hidden="true" /> Export
            </button>
          </div>
        </header>

        {view === 'week' ? (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftWeek(-7)}
                className="flex size-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-neutral-300"
                aria-label="Previous week"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <p className="font-display text-base font-extrabold text-neutral-800 dark:text-neutral-100">
                {weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                {' — '}
                {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <button
                type="button"
                onClick={() => shiftWeek(7)}
                className="flex size-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-neutral-300"
                aria-label="Next week"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
            <WeekCalendar weekStart={weekStart} events={events} onEventClick={setSelectedEvent} />
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-neutral-500">
              <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand-red" aria-hidden="true" /> Deadlines</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand-blue" aria-hidden="true" /> Live classes</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand-sky" aria-hidden="true" /> Submitted</span>
            </div>
          </>
        ) : (
          <MonthCalendar
            month={month}
            selectedDate={selectedDate}
            tasks={tasks ?? []}
            onMonthChange={setMonth}
            onSelectDate={setSelectedDate}
          />
        )}
      </motion.div>

      {/* Slide-up event details panel */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-neutral-900/55"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close event details"
            />
            <motion.aside
              variants={slideUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl rounded-t-[28px] border border-neutral-200 bg-white p-6 shadow-card dark:border-white/10 dark:bg-surface-card"
              aria-label="Event details"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                    selectedEvent.kind === 'deadline' && 'bg-red-50 text-brand-red',
                    selectedEvent.kind === 'session' && 'bg-brand-sky/30 text-brand-blue',
                    selectedEvent.kind === 'submitted' && 'bg-brand-sky/40 text-brand-blue',
                  )}>
                    {selectedEvent.kind === 'deadline' ? 'Deadline' : selectedEvent.kind === 'session' ? 'Live class' : 'Submitted'}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{selectedEvent.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-neutral-500">
                    {formatDate(`${selectedEvent.date}T${selectedEvent.startTime ?? '00:00'}:00`)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="flex size-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-300"
                  aria-label="Close"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              {eventTaskId && (
                <Link
                  to={ROUTES.student.task(eventTaskId)}
                  onClick={() => setSelectedEvent(null)}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white no-underline hover:bg-blue-600 hover:no-underline"
                >
                  Open activity <ExternalLink size={15} aria-hidden="true" />
                </Link>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
