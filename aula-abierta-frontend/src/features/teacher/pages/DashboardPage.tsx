import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckSquare2, ClipboardCheck, Clock3, Users } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, EmptyState, MetricCard, MetricGrid, PageCanvas, SectionHeader, Skeleton, WorkspaceHero } from '@core/ui'
import { useAuth } from '@core/auth/useAuth'
import { teacherApi } from '../api'
import { ROUTES } from '@router/routes'
import { useSound } from '@core/hooks/useSound'

export default function DashboardPage() {
  const { user } = useAuth()
  const { play } = useSound()
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['trainer', 'dashboard'],
    queryFn: teacherApi.getDashboard,
  })

  const classroomList = dashboard?.classrooms ?? []
  const pendingTotal = dashboard?.pending_total ?? 0
  const totalStudents = dashboard?.student_total ?? 0
  const firstName = user?.name.split(' ')[0] ?? 'Trainer'

  return (
    <AppShell>
      <PageCanvas>
        <div className="grid items-stretch gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <WorkspaceHero
              eyebrow="TRAINER DESK"
              title={`Good to see you, ${firstName}`}
              description="Review classrooms, clear grading queues, take attendance, and keep student communication moving."
              image="placeholder"
              imageAlt="Aula Abierta illustration reviewing a classroom clipboard"
              actions={classroomList[0] ? (
                <Link
                  to={ROUTES.teacher.classroom(classroomList[0].id)}
                  onClick={() => play('focus')}
                  className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-bold text-white no-underline shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:no-underline motion-reduce:hover:translate-y-0"
                >
                  Open active classroom <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ) : undefined}
            />
          </div>
          <section className="flex flex-col xl:col-span-4" aria-labelledby="trainer-pulse-title">
            <div className="mb-3"><p className="text-xs font-bold text-brand-red">TODAY'S OVERVIEW</p><h2 id="trainer-pulse-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">Classroom pulse</h2></div>
            <MetricGrid className="flex-1 grid-cols-1 xl:grid-cols-1">
              <MetricCard icon={BookOpen} label="Assigned classrooms" value={classroomList.length} tone="blue" loading={isLoading} />
              <MetricCard icon={Clock3} label="Submissions to review" value={pendingTotal} tone="red" loading={isLoading} />
              <MetricCard icon={Users} label="Active enrollments" value={totalStudents} tone="yellow" loading={isLoading} />
            </MetricGrid>
          </section>
        </div>

        <section aria-labelledby="trainer-classrooms-title">
          <SectionHeader eyebrow="WORKSPACES" title="My classrooms" titleId="trainer-classrooms-title" description="Open a classroom to access its complete Trainer toolkit." />

          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[0, 1].map((index) => <Skeleton.Card key={index} />)}
            </div>
          ) : classroomList.length === 0 ? (
            <EmptyState icon={<BookOpen size={23} />} title="No classrooms assigned" description="Your coordinator will assign a frozen classroom copy here." />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              className="grid gap-4 lg:grid-cols-2"
            >
              {classroomList.map((classroom) => {
                const pending = dashboard?.pending_by_classroom[String(classroom.id)] ?? 0
                return (
                  <motion.article
                    key={classroom.id}
                    variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-card"
                  >
                    <div className="h-2 bg-brand-blue" aria-hidden="true" />
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-brand-blue">{classroom.academic_period}</p>
                          <h3 className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{classroom.name}</h3>
                        </div>
                        <Badge status={classroom.is_active ? 'active' : 'closed'} />
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-neutral-50 px-4 py-3 dark:bg-white/[.04]">
                          <p className="font-display text-xl font-extrabold tabular-nums text-neutral-900 dark:text-white">{classroom.enrollment_count ?? 0}</p>
                          <p className="text-xs font-semibold text-neutral-500">students</p>
                        </div>
                        <div className="rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
                          <p className="font-display text-xl font-extrabold tabular-nums text-brand-red">{pending}</p>
                          <p className="text-xs font-semibold text-neutral-500">pending reviews</p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                          to={ROUTES.teacher.classroom(classroom.id)}
                          onClick={() => play('focus')}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white no-underline transition-colors duration-150 hover:bg-blue-600 hover:no-underline"
                        >
                          <CheckSquare2 size={16} aria-hidden="true" /> Classroom
                        </Link>
                        <Link
                          to={ROUTES.teacher.grading(classroom.id)}
                          onClick={() => play('tap')}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-bold text-neutral-700 no-underline transition-colors duration-150 hover:border-brand-red hover:text-brand-red hover:no-underline"
                        >
                          <ClipboardCheck size={16} aria-hidden="true" /> Grading
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </motion.div>
          )}
        </section>
      </PageCanvas>
    </AppShell>
  )
}
