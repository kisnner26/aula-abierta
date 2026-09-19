import { motion, useReducedMotion } from 'framer-motion'
import { Check, Flag, Lock, MapPin, Route, Sparkles } from 'lucide-react'
import { cn } from '@core/utils'
import { IllustrationPlaceholder } from '@core/ui'
import type { JourneyWeek } from '@core/types/models'

interface LearningWorldMapProps {
  weeks: JourneyWeek[]
  selectedWeekId: number
  onSelect: (week: JourneyWeek) => void
}

interface RouteNode {
  x: number
  y: number
  label: 'top' | 'bottom'
}

const routeNodes: RouteNode[] = [
  { x: 105, y: 454, label: 'top' },
  { x: 256, y: 398, label: 'bottom' },
  { x: 360, y: 304, label: 'top' },
  { x: 456, y: 368, label: 'bottom' },
  { x: 490, y: 248, label: 'top' },
  { x: 548, y: 446, label: 'bottom' },
  { x: 622, y: 318, label: 'bottom' },
  { x: 650, y: 194, label: 'top' },
  { x: 690, y: 254, label: 'bottom' },
  { x: 706, y: 392, label: 'bottom' },
  { x: 812, y: 344, label: 'top' },
  { x: 832, y: 252, label: 'bottom' },
  { x: 825, y: 470, label: 'top' },
  { x: 902, y: 120, label: 'bottom' },
]

function stateLabel(week: JourneyWeek) {
  if (week.state === 'completed') return 'Completed'
  if (week.state === 'current') return 'Current unit'
  return 'Locked'
}

export function LearningWorldMap({ weeks, selectedWeekId, onSelect }: LearningWorldMapProps) {
  const reduceMotion = useReducedMotion()
  const selectedWeek = weeks.find((week) => week.id === selectedWeekId) ?? weeks[0]
  const completedCount = weeks.filter((week) => week.state === 'completed').length
  const progress = weeks.length ? Math.round((completedCount / weeks.length) * 100) : 0
  const visibleWeeks = weeks.slice(0, routeNodes.length)

  return (
    <section className="overflow-hidden rounded-[28px] border border-sky-200 bg-sky-200 shadow-sm dark:border-white/10 dark:bg-surface-sunken" aria-labelledby="course-progress-title">
      <div className="overflow-x-auto" aria-label="Scrollable course progress">
        <div className="relative aspect-[16/9] min-w-[980px] overflow-hidden bg-sky-100">
          <IllustrationPlaceholder variant="course progress" size="scene" className="absolute inset-0 size-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-sky-50/15" aria-hidden="true" />

          {selectedWeek && (
            <motion.aside
              key={selectedWeek.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-[3%] top-[4%] w-[320px] overflow-hidden rounded-2xl border border-white/85 bg-white/95 shadow-md"
              aria-live="polite"
            >
              <div className="h-1.5 bg-brand-red" aria-hidden="true" />
              <div className="p-4">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-brand-blue">
                  <Route size={14} aria-hidden="true" /> COURSE PROGRESS
                </p>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold text-brand-red">REGION {selectedWeek.number}</p>
                    <h2 id="course-progress-title" className="mt-1 font-display text-xl font-extrabold text-neutral-950 text-balance">{selectedWeek.title}</h2>
                  </div>
                  <span className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    selectedWeek.state === 'completed' && 'bg-brand-blue text-white',
                    selectedWeek.state === 'current' && 'bg-brand-red text-white',
                    selectedWeek.state === 'locked' && 'bg-neutral-100 text-neutral-500',
                  )}>
                    {selectedWeek.state === 'completed' ? <Check size={18} aria-hidden="true" /> : selectedWeek.state === 'current' ? <MapPin size={18} aria-hidden="true" /> : <Lock size={17} aria-hidden="true" />}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs font-bold">
                  <span className="text-neutral-500">{stateLabel(selectedWeek)}</span>
                  <span className="tabular-nums text-brand-blue">{selectedWeek.completed_tasks_count}/{selectedWeek.tasks_count} activities</span>
                </div>
              </div>
            </motion.aside>
          )}

          <div className="absolute right-[3%] top-[4%] flex items-center gap-3 rounded-2xl border border-white/85 bg-white/95 px-4 py-3 shadow-md">
            <div>
              <p className="text-[11px] font-extrabold text-neutral-500">WORLD PROGRESS</p>
              <p className="mt-0.5 font-display text-lg font-extrabold tabular-nums text-neutral-950">{completedCount}/{weeks.length} regions</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-yellow font-display text-sm font-extrabold tabular-nums text-neutral-950">{progress}%</div>
          </div>

          <ol className="absolute inset-0">
            {visibleWeeks.map((week, index) => {
              const node = routeNodes[index]!
              const selected = week.id === selectedWeekId
              const locked = week.state === 'locked'
              const completed = week.state === 'completed'

              return (
                <li key={week.id} className="absolute" style={{ left: `${node.x / 10}%`, top: `${node.y / 5.6}%` }}>
                  <motion.button
                    type="button"
                    disabled={locked}
                    onClick={() => onSelect(week)}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                    animate={week.state === 'current' && !reduceMotion ? { opacity: 1, scale: [1, 1.08, 1] } : { opacity: 1, scale: 1 }}
                    transition={week.state === 'current' && !reduceMotion ? { opacity: { duration: 0.18 }, scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } } : { duration: 0.18, delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.16), ease: 'easeOut' }}
                    className={cn(
                      'group relative flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] text-sm font-extrabold tabular-nums shadow-md transition-transform duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-yellow focus-visible:ring-offset-2 motion-reduce:transition-none',
                      completed && 'border-white bg-brand-blue text-white hover:scale-110',
                      week.state === 'current' && 'size-[52px] border-brand-yellow bg-brand-red text-white shadow-lg hover:scale-110',
                      locked && 'cursor-not-allowed border-white/90 bg-white/90 text-neutral-500 shadow-sm',
                      selected && 'ring-4 ring-brand-red/35 ring-offset-2',
                    )}
                    aria-label={`Region ${week.number}: ${week.title}, ${stateLabel(week)}`}
                    aria-pressed={selected}
                  >
                    {completed ? <Check size={19} aria-hidden="true" /> : locked ? <Lock size={16} aria-hidden="true" /> : week.number}
                    {week.state === 'current' && <Sparkles size={16} className="absolute -right-3 -top-3 text-brand-yellow" aria-hidden="true" />}
                    <span className={cn(
                      'pointer-events-none absolute left-1/2 z-10 w-32 -translate-x-1/2 rounded-lg bg-white px-2.5 py-1.5 text-center text-[11px] font-extrabold leading-4 text-neutral-800 shadow-sm transition-opacity duration-150',
                      node.label === 'top' ? 'bottom-[calc(100%+.5rem)]' : 'top-[calc(100%+.5rem)]',
                      selected || week.state === 'current' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100',
                    )}>
                      {week.title}
                    </span>
                  </motion.button>
                </li>
              )
            })}
          </ol>

          <div className="absolute bottom-[4%] right-[3%] flex items-center gap-2 rounded-xl border border-white/85 bg-white/95 px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm">
            <Flag size={16} className="text-brand-red" aria-hidden="true" /> Every activity supports steady progress.
          </div>
        </div>
      </div>
    </section>
  )
}
