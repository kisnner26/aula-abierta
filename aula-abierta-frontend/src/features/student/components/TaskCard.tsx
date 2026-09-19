import { Link } from 'react-router-dom'
import { Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@core/ui'
import { formatDate, daysUntil, isOverdue } from '@core/utils/date'
import { cn } from '@core/utils'
import { ROUTES } from '@router/routes'
import type { CourseTask } from '@core/types/models'

interface TaskCardProps {
  task: CourseTask
}

export function TaskCard({ task }: TaskCardProps) {
  const overdue  = isOverdue(task.deadline) && task.status === 'pending'
  const daysLeft = daysUntil(task.deadline)
  const urgent   = !overdue && daysLeft <= 3
  const accent   = overdue ? '#D31A2A' : urgent ? '#FED401' : '#1D95FB'

  return (
    <Link
      to={ROUTES.student.task(task.id)}
      style={{ ['--toy-accent' as string]: accent }}
      className="toy-card toy-card-accent group flex items-start gap-3 py-3 pl-5 pr-3 text-neutral-900 no-underline transition-transform duration-200 hover:-translate-y-1 hover:no-underline motion-reduce:hover:translate-y-0 dark:text-white"
    >
      <div className={cn(
        'mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:group-hover:transform-none',
        overdue ? 'bg-gradient-red' : urgent ? 'bg-gradient-yellow' : 'bg-gradient-blue',
      )}>
        {overdue ? <AlertCircle size={16} className="text-white" /> : <Clock size={16} className={urgent ? 'text-brand-ink' : 'text-white'} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-neutral-800 transition-colors group-hover:text-brand-blue">
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
          <span className={cn('font-semibold', overdue ? 'text-brand-red' : urgent ? 'text-yellow-700 dark:text-yellow-400' : '')}>
            {overdue ? 'Overdue' : daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `Due ${formatDate(task.deadline)}`}
          </span>
        </div>
      </div>

      <Badge status={overdue ? 'overdue' : task.status} />
    </Link>
  )
}
