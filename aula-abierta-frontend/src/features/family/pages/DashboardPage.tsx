import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Award, BookOpen, CalendarCheck2, CheckCircle2, Clock3, Heart, Sparkles, TrendingUp, Users,
} from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Avatar, EmptyState, MetricCard, MetricGrid, PageCanvas, Skeleton, WorkspaceHero } from '@core/ui'
import { familyApi } from '../api'
import { formatDate } from '@core/utils/date'
import { numericToLetter, letterBg, letterColor } from '@core/utils/gradeLabel'
import { cn } from '@core/utils'

export default function FamilyDashboardPage() {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)

  const childrenQuery = useQuery({
    queryKey: ['family', 'children'],
    queryFn: familyApi.getChildren,
  })

  const children = childrenQuery.data ?? []
  const activeChildId = selectedChildId ?? children[0]?.id ?? null

  const dashboardQuery = useQuery({
    queryKey: ['family', 'child', activeChildId, 'dashboard'],
    queryFn: () => familyApi.getChildDashboard(activeChildId!),
    enabled: Boolean(activeChildId),
  })

  const child = children.find((c) => c.id === activeChildId)
  const dashboard = dashboardQuery.data

  return (
    <AppShell>
      <PageCanvas>
        <WorkspaceHero
          eyebrow="FAMILY PORTAL"
          title="Your child's progress"
          description="Attendance, grades, and upcoming activities — updated in real time so you're always informed."
          image="placeholder"
          imageAlt="Aula Abierta illustration presenting family learning results"
          tone="neutral"
          metric={child ? (
            <div className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-brand-cream px-4">
              <Heart size={18} className="text-brand-red" aria-hidden="true" />
              <span className="font-display text-lg font-extrabold text-neutral-900">{child.name}</span>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold capitalize text-neutral-600">
                {child.relationship}
              </span>
            </div>
          ) : undefined}
        />

        {/* Child selector */}
        {childrenQuery.isLoading ? (
          <Skeleton.Line height={44} />
        ) : children.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="No linked students"
            description="Ask your school coordinator to link your account to your child's profile."
          />
        ) : (
          <>
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Select child">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChildId(c.id)}
                    className={cn(
                      'flex min-h-12 shrink-0 items-center gap-2.5 rounded-xl px-4 text-sm font-bold transition-colors duration-150',
                      activeChildId === c.id
                        ? 'bg-brand-red text-white'
                        : 'border border-neutral-200 bg-white text-neutral-600 hover:border-brand-blue',
                    )}
                  >
                    <Avatar name={c.name} role="student" size="sm" />
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {dashboardQuery.isLoading ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton.Card />
                <Skeleton.Card />
                <Skeleton.Card />
              </div>
            ) : !dashboard ? null : (
              <div className="flex flex-col gap-6">
                <section aria-labelledby="metrics-title">
                  <span className="sr-only" id="metrics-title">Key metrics</span>
                  <MetricGrid className="sm:grid-cols-3 xl:grid-cols-3">
                    <MetricCard icon={Award} label="Grade average" value={dashboard.average_score !== null ? `${dashboard.average_score}%` : '—'} detail={`${dashboard.grades.length} graded activities`} tone="blue" />
                    <MetricCard icon={CalendarCheck2} label="Attendance · 30 days" value={dashboard.attendance_30d.rate !== null ? `${dashboard.attendance_30d.rate}%` : '—'} detail={`${dashboard.attendance_30d.attended}/${dashboard.attendance_30d.total} classes`} tone="green" />
                    <MetricCard icon={Clock3} label="Activities due" value={dashboard.upcoming_tasks.length} detail="Upcoming deadlines" tone="red" />
                  </MetricGrid>
                </section>

                <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
                  {/* Recent grades */}
                  <section aria-labelledby="grades-title">
                    <div className="mb-4">
                      <p className="text-xs font-bold text-brand-blue">RUBRIC RESULTS</p>
                      <h2 id="grades-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900">
                        Recent grades
                      </h2>
                    </div>

                    {dashboard.grades.length === 0 ? (
                      <EmptyState
                        icon={<TrendingUp size={22} />}
                        title="No grades yet"
                        description="Grades will appear here after the trainer reviews your child's submissions."
                      />
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {dashboard.grades.map((grade) => {
                          const letter = numericToLetter(grade.numeric_score)
                          return (
                            <article
                              key={grade.id}
                              className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-soft"
                            >
                              <div className="flex items-center gap-4 p-5">
                                <div className={cn(
                                  'flex size-16 shrink-0 flex-col items-center justify-center rounded-[18px] border',
                                  letterBg(letter),
                                )}>
                                  <span className={cn('font-display text-2xl font-extrabold', letterColor(letter))}>
                                    {letter}
                                  </span>
                                  <span className="text-[11px] font-bold tabular-nums text-neutral-500">
                                    {grade.numeric_score}%
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-display text-base font-extrabold leading-5 text-neutral-900 text-pretty">
                                    {grade.task_title ?? `Activity ${grade.id}`}
                                  </h3>
                                  <p className="mt-1 text-xs font-semibold text-neutral-500">
                                    {formatDate(grade.graded_at)}
                                  </p>
                                </div>
                                <Sparkles size={16} className="shrink-0 text-brand-yellow" aria-hidden="true" />
                              </div>
                              {grade.feedback && (
                                <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-3">
                                  <p className="text-xs font-bold text-neutral-400">TRAINER NOTE</p>
                                  <p className="mt-1 text-sm font-medium leading-5 text-neutral-600 text-pretty">
                                    {grade.feedback}
                                  </p>
                                </div>
                              )}
                            </article>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  {/* Sidebar */}
                  <div className="flex flex-col gap-5">
                    {/* Upcoming tasks */}
                    <section className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-soft" aria-labelledby="upcoming-title">
                      <p className="text-xs font-bold text-brand-red">UPCOMING ACTIVITIES</p>
                      <h2 id="upcoming-title" className="mt-1 font-display text-xl font-extrabold text-neutral-900">
                        Deadlines
                      </h2>
                      <div className="mt-4 flex flex-col gap-3">
                        {dashboard.upcoming_tasks.length === 0 ? (
                          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                            <CheckCircle2 size={20} className="text-emerald-600" aria-hidden="true" />
                            <p className="text-sm font-semibold text-emerald-700">All caught up!</p>
                          </div>
                        ) : (
                          dashboard.upcoming_tasks.map((task, i) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 rounded-[16px] border border-neutral-100 bg-neutral-50 p-3"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-cream text-xs font-extrabold tabular-nums text-brand-red">
                                {i + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-neutral-800">{task.title}</p>
                                <p className="text-xs font-semibold text-neutral-400">{formatDate(task.deadline)}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    {/* Enrolled classrooms */}
                    <section className="rounded-[24px] bg-brand-blue p-5 text-white shadow-soft" aria-labelledby="classrooms-title">
                      <p className="text-xs font-bold text-brand-yellow">ENROLLED IN</p>
                      <h2 id="classrooms-title" className="mt-1 font-display text-xl font-extrabold text-white">
                        Classrooms
                      </h2>
                      <div className="mt-4 flex flex-col gap-2">
                        {dashboard.classrooms.map((classroom) => (
                          <div
                            key={classroom.id}
                            className="flex items-center gap-3 rounded-[16px] bg-white/10 px-4 py-3"
                          >
                            <BookOpen size={16} aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-white">{classroom.name}</p>
                              <p className="text-xs font-semibold text-white/65">{classroom.academic_period}</p>
                            </div>
                            {classroom.is_active && (
                              <span className="flex size-2 rounded-full bg-emerald-400" aria-label="Active" />
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </PageCanvas>
    </AppShell>
  )
}
