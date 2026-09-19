import { useQuery } from '@tanstack/react-query'
import { Activity, GraduationCap, TrendingUp, Users } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { ContentPanel, MetricCard, MetricGrid, PageCanvas, SectionHeader, Skeleton, WorkspaceHero } from '@core/ui'
import { useAuth } from '@core/auth/useAuth'
import { adminApi } from '../api'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: adminApi.getMetrics,
  })

  const firstName = user?.name.split(' ')[0] ?? 'Admin'

  return (
    <AppShell>
      <PageCanvas>
        <div className="grid items-stretch gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <WorkspaceHero
              eyebrow="SYSTEM CONTROL"
              title={`System overview, ${firstName}`}
              description="Monitor users, groups, activity, and platform health across every program."
              image="placeholder"
              imageAlt="Aula Abierta illustration reviewing system metrics"
              tone="neutral"
            />
          </div>
          <section className="flex flex-col xl:col-span-4" aria-labelledby="admin-metrics-title">
            <div className="mb-3"><p className="text-xs font-bold text-brand-red">PLATFORM HEALTH</p><h2 id="admin-metrics-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">Global metrics</h2></div>
            <MetricGrid className="flex-1 grid-cols-1 xl:grid-cols-1">
              <MetricCard icon={Users} label="Total users" value={metrics?.total_users ?? 0} tone="blue" loading={isLoading} />
              <MetricCard icon={GraduationCap} label="Active groups" value={metrics?.active_groups ?? 0} tone="green" loading={isLoading} />
              <MetricCard icon={TrendingUp} label="Task completion" value={`${metrics?.task_completion_rate ?? 0}%`} tone="yellow" loading={isLoading} />
            </MetricGrid>
          </section>
        </div>

        <section aria-labelledby="admin-activity-title">
          <SectionHeader eyebrow="ENGAGEMENT" title="Activity by group" titleId="admin-activity-title" />
          <ContentPanel eyebrow="LIVE DATA" title="Classroom engagement" action={<span className="flex size-9 items-center justify-center rounded-xl bg-brand-blue text-white"><Activity size={17} aria-hidden="true" /></span>}>
            <div className="divide-y divide-neutral-100 dark:divide-white/10">
              {isLoading ? (
                <div className="flex flex-col gap-3 p-6">
                  {[0, 1, 2, 3].map((i) => <Skeleton.Line key={i} height={40} />)}
                </div>
              ) : metrics?.activity_by_group?.length ? (
                metrics.activity_by_group.map((group) => (
                  <div key={group.classroom_name} className="flex items-center gap-4 px-6 py-4">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-700 dark:text-neutral-200">{group.classroom_name}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-brand-blue transition-all"
                          style={{ width: `${Math.min(100, group.activity_count)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-bold tabular-nums text-neutral-500">{group.activity_count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-6 py-8 text-center text-sm font-semibold text-neutral-400">No activity data yet.</p>
              )}
            </div>
          </ContentPanel>
        </section>
      </PageCanvas>
    </AppShell>
  )
}
