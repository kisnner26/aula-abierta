import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, GraduationCap, TrendingUp, Users } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, EmptyState, MetricCard, MetricGrid, PageCanvas, SectionHeader, Skeleton, WorkspaceHero } from '@core/ui'
import { useAuth } from '@core/auth/useAuth'
import { coordinatorApi } from '../api'
import { ROUTES } from '@router/routes'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['coordinator', 'metrics'],
    queryFn: coordinatorApi.getMetrics,
  })

  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ['coordinator', 'classrooms'],
    queryFn: coordinatorApi.getClassrooms,
  })

  const firstName = user?.name.split(' ')[0] ?? 'Coordinator'
  const activeClassrooms = classrooms?.filter((c) => c.is_active) ?? []

  return (
    <AppShell>
      <PageCanvas>
        <div className="grid items-stretch gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <WorkspaceHero
              eyebrow="COORDINATION HUB"
              title={`Welcome back, ${firstName}`}
              description="Manage programs, assign trainers, monitor progress, and keep the academic operation moving."
              image="placeholder"
              imageAlt="Aula Abierta illustration coordinating the academic program"
              tone="blue"
              imagePosition="object-[55%_center]"
            />
          </div>
          <section className="flex flex-col xl:col-span-4" aria-labelledby="coord-metrics-title">
            <div className="mb-3"><p className="text-xs font-bold text-brand-red">AT A GLANCE</p><h2 id="coord-metrics-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">Academic overview</h2></div>
            <MetricGrid className="flex-1 grid-cols-2 xl:grid-cols-2">
              <MetricCard icon={GraduationCap} label="Active classrooms" value={metrics?.active_classrooms ?? 0} tone="blue" loading={metricsLoading} />
              <MetricCard icon={Users} label="Total students" value={metrics?.total_students ?? 0} tone="green" loading={metricsLoading} />
              <MetricCard icon={TrendingUp} label="Task completion" value={`${metrics?.task_completion_rate ?? 0}%`} tone="yellow" loading={metricsLoading} />
              <MetricCard icon={ClipboardList} label="Pending reviews" value={metrics?.pending_submissions ?? 0} tone="red" loading={metricsLoading} />
            </MetricGrid>
          </section>
        </div>

        <section aria-labelledby="coord-classrooms-title">
          <SectionHeader
            eyebrow="ACTIVE PROGRAMS"
            title="Classroom roster"
            titleId="coord-classrooms-title"
            description="Select a classroom to manage sessions, students, and trainer assignments."
            action={
              <Link
                to={ROUTES.coordinator.classrooms}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-neutral-200 px-4 text-sm font-bold text-neutral-700 no-underline transition-colors duration-150 hover:border-brand-blue hover:text-brand-blue hover:no-underline"
              >
                View all <ArrowRight size={15} aria-hidden="true" />
              </Link>
            }
          />

          {classroomsLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[0, 1, 2, 3].map((i) => <Skeleton.Card key={i} />)}
            </div>
          ) : activeClassrooms.length === 0 ? (
            <EmptyState
              icon={<GraduationCap size={23} />}
              title="No active classrooms"
              description="Create a classroom from a frozen template to get started."
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid gap-4 lg:grid-cols-2"
            >
              {activeClassrooms.slice(0, 8).map((classroom) => (
                <motion.article
                  key={classroom.id}
                  variants={fadeUp}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-card"
                >
                  <div className="h-2 bg-brand-blue" aria-hidden="true" />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-brand-blue">{classroom.academic_period}</p>
                        <h3 className="mt-1 truncate font-display text-xl font-extrabold text-neutral-900 dark:text-white">
                          {classroom.name}
                        </h3>
                      </div>
                      <Badge
                        status={classroom.trainer_id ? 'active' : 'pending'}
                        label={classroom.trainer_id ? 'Trainer assigned' : 'Unassigned'}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-500">
                        {classroom.enrollment_count ?? 0} students enrolled
                      </span>
                      <Link
                        to={ROUTES.coordinator.classroom(classroom.id)}
                        className="text-sm font-bold text-brand-blue no-underline hover:underline"
                      >
                        Manage →
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </section>
      </PageCanvas>
    </AppShell>
  )
}
