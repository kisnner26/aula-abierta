import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Users } from 'lucide-react'
import { Badge, IllustrationPlaceholder } from '@core/ui'
import { ROUTES } from '@router/routes'
import { cn } from '@core/utils'
import type { Classroom } from '@core/types/models'

const programStyles: Record<string, { accent: string; soft: string; text: string }> = {
  BEFK:  { accent: 'bg-brand-blue',   soft: 'bg-brand-sky/30',    text: 'text-brand-blue' },
  FES:   { accent: 'bg-emerald-500',  soft: 'bg-emerald-50',      text: 'text-emerald-700' },
  TES:   { accent: 'bg-brand-red',    soft: 'bg-red-50',          text: 'text-brand-red' },
  CoLab: { accent: 'bg-brand-yellow', soft: 'bg-brand-yellow/20', text: 'text-yellow-700' },
}

const defaultProgramStyle = programStyles.BEFK as { accent: string; soft: string; text: string }

interface ClassroomCardProps {
  classroom: Classroom
  index: number
}

export function ClassroomCard({ classroom, index }: ClassroomCardProps) {
  const programCode = classroom.name.split(' ')[0] ?? 'BEFK'
  const style = programStyles[programCode] ?? defaultProgramStyle
  const scene = classroom.theme?.hero_background ?? 'classroom'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Link
        to={ROUTES.student.classroom(classroom.id)}
        className="group block text-neutral-900 no-underline hover:no-underline"
        aria-label={`Open ${classroom.name}`}
      >
        <article className="pressable relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 dark:border-white/10 dark:bg-surface-card">
          <div className="relative aspect-[16/7] overflow-hidden bg-brand-cream">
            <IllustrationPlaceholder variant={scene} className="size-full transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none" />
            <div className="absolute right-3 top-3"><Badge status={classroom.is_active ? 'active' : 'closed'} /></div>
            <span className={cn('absolute inset-x-0 bottom-0 h-1.5', style.accent)} aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1 p-5">
            <p className={cn('text-xs font-bold uppercase', style.text)}>{programCode}</p>
            <h3 className="font-display text-xl font-extrabold leading-tight text-neutral-900 transition-colors group-hover:text-brand-blue dark:text-white">
              {classroom.name}
            </h3>
            <p className="text-sm font-semibold text-neutral-500">{classroom.academic_period}</p>
          </div>

          <div className="mx-5 mb-5 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/[.04]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
              <Users size={14} />
              <span className="tabular-nums">{classroom.enrollment_count ?? 0} students</span>
            </div>
            <span className="flex size-8 items-center justify-center rounded-lg bg-white text-neutral-300 shadow-sm transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-blue dark:bg-surface-overlay">
              <ChevronRight size={16} />
            </span>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}
