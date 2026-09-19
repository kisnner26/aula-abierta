import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, BookOpen, CalendarDays, CheckCircle2, Clock3, Flame, MessageCircle, Rocket, Star } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { EmptyState, MetricCard, MetricGrid, SectionHeader, Skeleton, StreakFlame, XPBar, AchievementBadge } from '@core/ui'
import { useAuth } from '@core/auth/useAuth'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import { ClassroomCard } from '../components/ClassroomCard'
import { TaskCard } from '../components/TaskCard'
import { StudentIsland } from '../components/StudentIsland'
import { ROUTES } from '@router/routes'
import { formatDate } from '@core/utils/date'
import { useSound } from '@core/hooks/useSound'
import { pageVariants } from '@core/config/motion'

export default function DashboardPage() {
  const { user } = useAuth()
  const { play } = useSound()
  const { classrooms, upcomingTasks, grades, journey } = useStudentDashboard()

  const classroomList = classrooms.data ?? []
  const taskList = upcomingTasks.data ?? []
  const gradeList = grades.data ?? []
  const pendingTasks = taskList.filter((task) => task.status === 'pending' || task.status === 'overdue').length
  const completedTasks = taskList.filter((task) => task.status === 'graded' || task.status === 'submitted').length
  const taskProgress = taskList.length ? Math.round((completedTasks / taskList.length) * 100) : 0
  const averageGrade = gradeList.length
    ? Math.round(gradeList.reduce((sum, grade) => sum + grade.numeric_score, 0) / gradeList.length)
    : 0
  const firstName = user?.name.split(' ')[0] ?? 'Student'
  const nextDestination = taskList[0]
    ? ROUTES.student.task(taskList[0].id)
    : classroomList[0]
      ? ROUTES.student.classroom(classroomList[0].id)
      : null

  // Streak proxy — server payload has no streak field yet, so derive from
  // graded + submitted recent activity. Replace with a real backend field
  // when /student/dashboard exposes one.
  const streakDays = Math.min(
    99,
    gradeList.length + taskList.filter((t) => t.status === 'submitted' || t.status === 'graded').length,
  )
  const weeklyProgressPercent = journey?.progress.percent ?? taskProgress

  // Presentational "Learning XP" layer derived from real activity (no backend
  // field yet): each graded activity and completed task earns XP.
  const totalXp = gradeList.length * 50 + completedTasks * 20
  const level = Math.floor(totalXp / 200) + 1
  const xpInLevel = totalXp % 200
  const badges = [
    { icon: Rocket, label: 'First steps', tone: 'blue' as const, unlocked: gradeList.length >= 1 || completedTasks >= 1 },
    { icon: Flame, label: '7-day streak', tone: 'red' as const, unlocked: streakDays >= 7 },
    { icon: Star, label: 'Top marks', tone: 'yellow' as const, unlocked: averageGrade >= 80 && gradeList.length > 0 },
    { icon: Award, label: 'Explorer', tone: 'green' as const, unlocked: classroomList.length >= 1 },
  ]

  return (
    <AppShell>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="page-container flex w-full flex-col gap-8 py-6 sm:py-8"
      >
        <div className="grid items-stretch gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <StudentIsland
              firstName={firstName}
              streakDays={streakDays}
              weeklyProgressPercent={weeklyProgressPercent}
              actions={
                <>
                  {nextDestination && (
                    <Link
                      to={nextDestination}
                      onClick={() => play('focus')}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-yellow px-4 text-sm font-bold text-neutral-950 no-underline hover:bg-yellow-300 hover:no-underline"
                    >
                      {taskList[0] ? 'Continue activity' : 'Open classroom'} <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  )}
                  <Link to={ROUTES.student.calendar} onClick={() => play('tap')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-4 text-sm font-bold text-white no-underline hover:bg-white/20 hover:no-underline">
                    <CalendarDays size={17} aria-hidden="true" /> Calendar
                  </Link>
                </>
              }
            />
          </div>
          <section className="flex min-w-0 flex-col xl:col-span-4" aria-labelledby="today-overview-title">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div><p className="text-xs font-bold text-brand-red">AT A GLANCE</p><h2 id="today-overview-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">Learning pulse</h2></div>
              {journey && <Link to={ROUTES.student.classroom(journey.classroom.id)} className="text-xs font-bold text-brand-blue no-underline hover:underline">{journey.level.name}</Link>}
            </div>
            <MetricGrid className="flex-1 grid-cols-2 xl:grid-cols-2">
            <MetricCard icon={BookOpen} label="Active classrooms" value={classroomList.length} tone="blue" />
            <MetricCard icon={Clock3} label="Activities pending" value={pendingTasks} detail={`${taskList.length} in your queue`} tone="red" />
            <MetricCard icon={CheckCircle2} label="Activity progress" value={taskProgress} suffix="%" detail={`${completedTasks} completed`} tone="yellow" />
            <MetricCard icon={CalendarDays} label="Grade average" value={averageGrade} suffix="%" detail={`${gradeList.length} graded activities`} tone="green" />
          </MetricGrid>
          </section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border-2 border-neutral-900/[0.07] bg-white p-5 shadow-soft dark:border-white/10 dark:bg-surface-card sm:p-6"
          aria-labelledby="learning-progress-title"
        >
          <span aria-hidden="true" className="mesh-joy pointer-events-none absolute inset-0 opacity-50 dark:opacity-25" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold text-brand-red">KEEP CLIMBING</p>
                  <h2 id="learning-progress-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">Learning progress</h2>
                </div>
                <StreakFlame days={streakDays} />
              </div>
              <div className="mt-5">
                <XPBar xp={xpInLevel} max={200} level={level} />
              </div>
            </div>
            <div className="flex gap-3 lg:flex-col lg:gap-2">
              <p className="hidden text-xs font-bold uppercase tracking-wide text-neutral-400 lg:block dark:text-neutral-500">Badges</p>
              <div className="flex flex-wrap gap-3">
                {badges.map((badge) => (
                  <AchievementBadge key={badge.label} icon={badge.icon} label={badge.label} tone={badge.tone} unlocked={badge.unlocked} />
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-labelledby="classrooms-title">
            <div className="mb-4">
              <p className="text-xs font-bold text-brand-red">YOUR SPACES</p>
              <h2 id="classrooms-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900">Classrooms</h2>
              <p className="mt-1 text-sm font-medium text-neutral-500">Open a classroom to find its weeks, materials, and activities.</p>
            </div>

            {classrooms.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((index) => <Skeleton.Card key={index} />)}
              </div>
            ) : classroomList.length === 0 ? (
              <EmptyState icon={<BookOpen size={22} />} title="No classrooms yet" description="Your coordinator will enroll you soon." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {classroomList.map((classroom, index) => (
                  <ClassroomCard key={classroom.id} classroom={classroom} index={index} />
                ))}
              </div>
            )}
          </section>

          <aside className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div>
                <p className="text-xs font-bold text-brand-blue">NEXT UP</p>
                <h2 className="mt-1 font-display text-xl font-extrabold text-neutral-900">Activity queue</h2>
              </div>
              <Link
                to={ROUTES.student.calendar}
                className="flex size-10 items-center justify-center rounded-xl bg-brand-cream text-brand-red no-underline transition-colors duration-150 hover:bg-brand-yellow hover:no-underline"
                aria-label="Open full calendar"
              >
                <CalendarDays size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {upcomingTasks.isLoading ? (
                [0, 1, 2].map((index) => <Skeleton.Line key={index} height={68} />)
              ) : taskList.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={22} />} title="Everything is clear" description="No upcoming deadlines." />
              ) : (
                taskList.slice(0, 5).map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
            {taskList[0] && (
              <div className="border-t border-neutral-100 bg-brand-cream px-5 py-4">
                <p className="text-xs font-semibold text-neutral-500">Closest deadline</p>
                <p className="mt-1 text-sm font-bold text-neutral-900">{formatDate(taskList[0].deadline)}</p>
              </div>
            )}
          </aside>
        </div>

        <Link
          to={ROUTES.student.messagesHub}
          onClick={() => play('message')}
          className="flex flex-col justify-between gap-5 rounded-[24px] bg-brand-blue p-6 text-white no-underline shadow-soft transition-transform duration-150 hover:-translate-y-0.5 hover:no-underline motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-blue">
              <MessageCircle size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-white">Need help with a activity?</h2>
              <p className="mt-1 text-sm font-semibold text-white/80">Send a message directly to your trainer.</p>
            </div>
          </div>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-brand-blue">
            Open messages <ArrowRight size={17} aria-hidden="true" />
          </span>
        </Link>
      </motion.div>
    </AppShell>
  )
}
