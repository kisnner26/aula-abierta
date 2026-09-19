import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSound } from '@core/hooks/useSound'
import { cn } from '@core/utils'
import { ROUTES } from '@router/routes'
import type { CourseTask } from '@core/types/models'

interface MonthCalendarProps {
  month: Date
  selectedDate: string
  tasks: CourseTask[]
  onMonthChange: (month: Date) => void
  onSelectDate: (date: string) => void
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export function MonthCalendar({ month, selectedDate, tasks, onMonthChange, onSelectDate }: MonthCalendarProps) {
  const { play } = useSound()
  const cells = useMemo(() => monthCells(month), [month])
  const tasksByDate = useMemo(() => {
    const map = new Map<string, CourseTask[]>()
    tasks.forEach((task) => {
      const key = task.deadline.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), task])
    })
    return map
  }, [tasks])
  const today = toDateKey(new Date())

  const shiftMonth = (offset: number) => {
    play('tap')
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + offset, 1))
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-soft" aria-label="Task calendar">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4 sm:px-6">
        <div>
          <p className="text-xs font-bold text-brand-red">ACTIVITY CALENDAR</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-neutral-900">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              play('tap')
              const now = new Date()
              onMonthChange(new Date(now.getFullYear(), now.getMonth(), 1))
              onSelectDate(toDateKey(now))
            }}
            className="hidden min-h-10 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-600 transition-colors duration-150 hover:bg-brand-cream sm:block"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors duration-150 hover:bg-brand-cream hover:text-brand-red"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors duration-150 hover:bg-brand-cream hover:text-brand-red"
            aria-label="Next month"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50 px-2 sm:px-4">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-[11px] font-bold text-neutral-400 sm:text-xs">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2 sm:gap-2 sm:p-4">
        {cells.map((date) => {
          const key = toDateKey(date)
          const dayTasks = tasksByDate.get(key) ?? []
          const isCurrentMonth = date.getMonth() === month.getMonth()
          const isSelected = selectedDate === key
          const isToday = today === key

          return (
            <div
              key={key}
              className={cn(
                'group relative flex aspect-square min-h-12 flex-col rounded-[16px] border p-1.5 transition-colors duration-150 sm:aspect-auto sm:min-h-28 sm:p-2',
                isSelected
                  ? 'border-brand-red bg-red-50'
                  : cn('border-transparent hover:bg-brand-cream', isCurrentMonth ? 'text-neutral-700' : 'text-neutral-300'),
                isToday && !isSelected && 'border-brand-blue bg-brand-sky/15',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  play('tap')
                  onSelectDate(key)
                }}
                className={cn(
                  'flex size-9 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums transition-colors duration-150',
                  isSelected ? 'bg-brand-red text-white' : 'hover:bg-white',
                  isToday && !isSelected && 'text-brand-blue',
                )}
                aria-label={`${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${dayTasks.length ? `, ${dayTasks.length} activities` : ''}`}
                aria-pressed={isSelected}
              >
                {date.getDate()}
              </button>
              <div className="mt-auto flex h-2 items-center justify-center gap-0.5 sm:hidden" aria-hidden="true">
                {dayTasks.slice(0, 3).map((task) => (
                  <span key={task.id} className={cn('size-1.5 rounded-full', isSelected ? 'bg-brand-red' : 'bg-brand-yellow')} />
                ))}
              </div>
              <div className="mt-1 hidden min-w-0 flex-col gap-1 sm:flex">
                {dayTasks.slice(0, 2).map((task) => (
                  <Link
                    key={task.id}
                    to={ROUTES.student.task(task.id)}
                    onClick={() => play('focus')}
                    className={cn(
                      'line-clamp-1 rounded-lg px-2 py-1 text-[11px] font-bold leading-4 no-underline transition-colors duration-150 hover:no-underline',
                      isSelected
                        ? 'bg-white text-brand-red hover:bg-brand-red hover:text-white'
                        : 'bg-white text-neutral-700 hover:bg-brand-blue hover:text-white',
                    )}
                  >
                    {task.title}
                  </Link>
                ))}
                {dayTasks.length > 2 && (
                  <span className="px-2 text-[11px] font-bold text-neutral-400">+{dayTasks.length - 2} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
