import { useMemo } from 'react'
import type { CourseTask } from '@core/types/models'
import { cn } from '@core/utils'

export type CalendarEventKind = 'deadline' | 'session' | 'submitted'

export interface CalendarEvent {
  id: string
  date: string // YYYY-MM-DD
  startTime?: string // HH:MM
  title: string
  kind: CalendarEventKind
  href?: string
}

interface WeekCalendarProps {
  weekStart: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const EVENT_COLORS: Record<CalendarEventKind, string> = {
  deadline:  'bg-brand-red text-white',
  session:   'bg-brand-blue text-white',
  submitted: 'bg-brand-sky text-neutral-900',
}

const EVENT_DOT_COLORS: Record<CalendarEventKind, string> = {
  deadline:  'bg-brand-red',
  session:   'bg-brand-blue',
  submitted: 'bg-brand-sky',
}

export function WeekCalendar({ weekStart, events, onEventClick }: WeekCalendarProps) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  }), [weekStart])

  const todayKey = toKey(new Date())
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      if (!map.has(event.date)) map.set(event.date, [])
      map.get(event.date)!.push(event)
    }
    return map
  }, [events])

  return (
    <div className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-soft dark:border-white/10 dark:bg-surface-card">
      {/* Day header — CSS Grid 7-col */}
      <div className="grid grid-cols-7 border-b border-neutral-100 dark:border-white/10">
        {days.map((day, i) => {
          const key = toKey(day)
          const isToday = key === todayKey
          return (
            <div key={key} className="flex flex-col items-center gap-1.5 px-1 py-3">
              <span className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400">{DAY_NAMES[i]}</span>
              <span className={cn(
                'flex size-9 items-center justify-center rounded-full text-sm font-extrabold tabular-nums',
                isToday ? 'bg-brand-blue text-white' : 'text-neutral-800 dark:text-neutral-200',
              )}>
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Day columns with events */}
      <div className="grid min-h-[420px] grid-cols-7 divide-x divide-neutral-100 dark:divide-white/5">
        {days.map((day) => {
          const key = toKey(day)
          const dayEvents = eventsByDay.get(key) ?? []
          return (
            <div key={key} className="flex flex-col gap-1.5 p-2">
              {dayEvents.length === 0 ? (
                <span className="hidden text-center text-[10px] font-semibold text-neutral-300 sm:block">·</span>
              ) : dayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className={cn(
                    'group flex flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
                    EVENT_COLORS[event.kind],
                  )}
                >
                  {event.startTime && (
                    <span className="text-[10px] font-semibold opacity-80">{event.startTime}</span>
                  )}
                  <span className="line-clamp-2 leading-tight">{event.title}</span>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function buildEventsFromTasks(tasks: CourseTask[]): CalendarEvent[] {
  return tasks.map((task) => {
    const date = task.deadline.slice(0, 10)
    const time = task.deadline.slice(11, 16)
    const kind: CalendarEventKind = task.status === 'submitted' || task.status === 'graded' ? 'submitted' : 'deadline'
    return {
      id: `task-${task.id}`,
      date,
      startTime: time,
      title: task.title,
      kind,
    }
  })
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun..6=Sat — shift so Monday is start
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
