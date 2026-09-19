import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GraduationCap, UserCheck } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, Card, Modal, Button, EmptyState, SectionHeader, Skeleton, Table, toast, WorkspaceHero } from '@core/ui'
import type { Column } from '@core/ui'
import { coordinatorApi } from '../api'
import { ROUTES } from '@router/routes'
import type { Classroom } from '@core/types/models'

export default function ClassroomsPage() {
  const qc = useQueryClient()
  const [assigning, setAssigning] = useState<Classroom | null>(null)
  const [trainerId, setTrainerId] = useState('')

  const { data: classrooms, isLoading } = useQuery({
    queryKey: ['coordinator', 'classrooms'],
    queryFn:  coordinatorApi.getClassrooms,
  })

  const { data: trainers } = useQuery({
    queryKey: ['coordinator', 'trainers'],
    queryFn:  coordinatorApi.getTrainers,
  })

  const assign = useMutation({
    mutationFn: () => coordinatorApi.assignTrainer(assigning!.id, Number(trainerId)),
    onSuccess: () => {
      toast.success('Trainer assigned.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'classrooms'] })
      setAssigning(null)
      setTrainerId('')
    },
    onError: () => toast.error('Failed to assign trainer.'),
  })

  const columns: Column<Classroom>[] = [
    {
      key: 'name',
      header: 'Classroom',
      render: (c) => (
        <Link to={ROUTES.coordinator.classroom(c.id)} className="font-semibold text-brand-blue hover:underline">
          {c.name}
        </Link>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (c) => <span className="text-sm text-neutral-600">{c.academic_period}</span>,
    },
    {
      key: 'students',
      header: 'Students',
      render: (c) => <span className="text-sm text-neutral-600">{c.enrollment_count ?? 0}</span>,
    },
    {
      key: 'trainer',
      header: 'Trainer',
      render: (c) => (
        <span className={c.trainer_id ? 'text-sm text-neutral-700' : 'text-sm font-medium text-brand-yellow'}>
          {c.trainer_id
            ? (trainers?.find((t) => t.id === c.trainer_id)?.name ?? `Trainer #${c.trainer_id}`)
            : 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <Badge status={c.is_active ? 'active' : 'closed'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <button
          onClick={() => { setAssigning(c); setTrainerId(String(c.trainer_id ?? '')) }}
          className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
        >
          <UserCheck size={13} aria-hidden="true" /> Assign
        </button>
      ),
    },
  ]

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="CLASSROOM MANAGEMENT"
          title="Classrooms"
          description="All active and archived classrooms — assign trainers, review enrollments, and open individual settings."
          image="placeholder"
          imageAlt="Aula Abierta illustration with classroom students"
          tone="neutral"
          imagePosition="object-[65%_center]"
        />

        <section aria-labelledby="classrooms-list-title">
          <SectionHeader
            eyebrow="ALL GROUPS"
            title="Classroom roster"
            titleId="classrooms-list-title"
            description="Click a classroom name to open its detail page or use the Assign button to change the trainer."
          />
          <Card padding="none">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-6">
                {[0, 1, 2, 3].map((i) => <Skeleton.Line key={i} height={44} />)}
              </div>
            ) : (
              <Table
                columns={columns}
                data={classrooms ?? []}
                rowKey={(c) => c.id}
                emptyTitle="No classrooms yet"
                emptyDescription="Clone a template to create the first classroom."
                emptyIcon={<GraduationCap size={22} />}
              />
            )}
          </Card>
        </section>

        <Modal
          open={Boolean(assigning)}
          onClose={() => setAssigning(null)}
          title={`Assign Trainer — ${assigning?.name}`}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setAssigning(null)}>Cancel</Button>
              <Button onClick={() => assign.mutate()} loading={assign.isPending} disabled={!trainerId}>
                Assign
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-neutral-700">Select Trainer</label>
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="rounded-input border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">— Select trainer —</option>
              {trainers?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </Modal>
      </div>
    </AppShell>
  )
}
