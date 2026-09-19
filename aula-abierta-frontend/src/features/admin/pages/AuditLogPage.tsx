import { useState, useDeferredValue } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ShieldCheck, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, Button, Card, SectionHeader, Skeleton, Table, WorkspaceHero } from '@core/ui'
import type { Column } from '@core/ui'
import { adminApi } from '../api'
import { formatDateTime } from '@core/utils/date'
import type { AuditLog } from '@core/types/models'

const CATEGORIES = [
  { value: '',        label: 'All categories' },
  { value: 'auth',    label: 'Authentication' },
  { value: 'users',   label: 'User management' },
  { value: 'default', label: 'Content & classrooms' },
]

const ENTITY_TYPES = ['User', 'Classroom', 'Template', 'Week', 'ContentFingerprint']

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const deferredAction = useDeferredValue(action)

  const resetPage = () => setPage(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page, category, entityType, deferredAction, dateFrom, dateTo, sort],
    queryFn:  () => adminApi.getAuditLogs({
      page,
      category: category || undefined,
      entity_type: entityType || undefined,
      action: deferredAction || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort,
    }),
    placeholderData: keepPreviousData,
  })

  const columns: Column<AuditLog>[] = [
    {
      key: 'user',
      header: 'User',
      render: (l) => (
        <div>
          <p className="text-sm font-semibold text-neutral-800">{l.user_name}</p>
          <p className="text-xs text-neutral-400">{l.user_id ? `#${l.user_id}` : '—'}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (l) => (
        <Badge
          status={l.category === 'auth' ? 'pending' : l.category === 'users' ? 'info' : 'draft'}
          label={l.category}
        />
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (l) => (
        <code className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-700">
          {l.action}
        </code>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (l) => (
        <span className="text-sm text-neutral-600">
          {l.entity_type ? `${l.entity_type} #${l.entity_id}` : '—'}
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (l) => <span className="font-mono text-xs text-neutral-400">{l.ip_address}</span>,
    },
    {
      key: 'time',
      header: 'Time',
      sortable: true,
      render: (l) => <span className="text-sm text-neutral-500">{formatDateTime(l.created_at)}</span>,
    },
  ]

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="SECURITY & COMPLIANCE"
          title="Audit Log"
          description="Logins, user management, and every access to protected material — a complete, tamper-evident trail."
          image="placeholder"
          imageAlt="Aula Abierta illustration reviewing audit records"
          tone="neutral"
          imagePosition="object-[60%_center]"
        />

        <section aria-labelledby="audit-log-title">
          <SectionHeader
            eyebrow="SYSTEM ACTIVITY"
            title="Recent events"
            titleId="audit-log-title"
            description="All times are displayed in server local time."
          />

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                type="search"
                value={action}
                onChange={(e) => { setAction(e.target.value); resetPage() }}
                placeholder="Filter by action…"
                aria-label="Filter by action"
                className="w-56 rounded-input border border-neutral-300 py-2 pl-9 pr-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); resetPage() }}
              aria-label="Filter by category"
              className="rounded-input border border-neutral-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); resetPage() }}
              aria-label="Filter by entity type"
              className="rounded-input border border-neutral-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">All entities</option>
              {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); resetPage() }}
                className="rounded-input border border-neutral-300 px-3 py-1.5 text-sm font-normal text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
              To
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); resetPage() }}
                className="rounded-input border border-neutral-300 px-3 py-1.5 text-sm font-normal text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </label>
          </div>

          <Card padding="none">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-6">
                {[0, 1, 2, 3, 4].map((i) => <Skeleton.Line key={i} height={52} />)}
              </div>
            ) : (
              <Table
                columns={columns}
                data={data?.data ?? []}
                rowKey={(l) => l.id}
                emptyTitle="No audit entries found"
                emptyDescription="Try adjusting the filters or the date range."
                emptyIcon={<ShieldCheck size={22} />}
                sortKey="time"
                sortDir={sort}
                onSort={() => { setSort((s) => (s === 'desc' ? 'asc' : 'desc')); resetPage() }}
                stickyHeader
              />
            )}
          </Card>

          {data && data.meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                leftIcon={<ChevronLeft size={15} />}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-neutral-500">
                Page {data.meta.current_page} of {data.meta.last_page} — {data.meta.total} total entries
              </span>
              <Button
                variant="secondary"
                leftIcon={<ChevronRight size={15} />}
                disabled={page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
