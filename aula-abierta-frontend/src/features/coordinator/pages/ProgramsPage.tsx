import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, Button, Card, Input, Modal, SectionHeader, Skeleton, Table, toast, WorkspaceHero } from '@core/ui'
import type { Column } from '@core/ui'
import { coordinatorApi } from '../api'
import type { Program } from '@core/types/models'

export default function ProgramsPage() {
  const qc = useQueryClient()
  const [show, setShow]     = useState(false)
  const [name, setName]     = useState('')
  const [code, setCode]     = useState('')
  const [levels, setLevels] = useState('1')
  const [weeks, setWeeks]   = useState('14')

  const { data: programs, isLoading } = useQuery({
    queryKey: ['coordinator', 'programs'],
    queryFn:  coordinatorApi.getPrograms,
  })

  const create = useMutation({
    mutationFn: () => coordinatorApi.createProgram({
      name,
      code: code.toUpperCase(),
      level_count:     Number(levels),
      weeks_per_level: Number(weeks),
      is_active: true,
    }),
    onSuccess: () => {
      toast.success('Program created.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'programs'] })
      setShow(false); setName(''); setCode('')
    },
    onError: () => toast.error('Failed to create program.'),
  })

  const columns: Column<Program>[] = [
    { key: 'name',   header: 'Program', render: (p) => <span className="font-semibold text-neutral-800">{p.name}</span> },
    { key: 'code',   header: 'Code',    render: (p) => <code className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-700">{p.code}</code> },
    { key: 'levels', header: 'Levels',  render: (p) => <span className="text-sm text-neutral-600">{p.level_count}</span> },
    { key: 'weeks',  header: 'Wks / Level', render: (p) => <span className="text-sm text-neutral-600">{p.weeks_per_level}</span> },
    { key: 'status', header: 'Status',  render: (p) => <Badge status={p.is_active ? 'active' : 'closed'} /> },
  ]

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="CURRICULUM DESIGN"
          title="Programs"
          description="BEFK, FES, TES, CoLab and more — manage the structure of every learning track from one place."
          image="placeholder"
          imageAlt="Aula Abierta illustration guiding program structure"
          tone="blue"
          imagePosition="object-[60%_center]"
        />

        <section aria-labelledby="programs-list-title">
          <SectionHeader
            eyebrow="ACTIVE TRACKS"
            title="All programs"
            titleId="programs-list-title"
            action={
              <Button leftIcon={<Plus size={15} />} onClick={() => setShow(true)}>
                New Program
              </Button>
            }
          />
          <Card padding="none">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-6">
                {[0, 1, 2].map((i) => <Skeleton.Line key={i} height={44} />)}
              </div>
            ) : (
              <Table
                columns={columns}
                data={programs ?? []}
                rowKey={(p) => p.id}
                emptyTitle="No programs yet"
                emptyIcon={<BookOpen size={22} />}
              />
            )}
          </Card>
        </section>

        <Modal
          open={show}
          onClose={() => setShow(false)}
          title="New Program"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShow(false)}>Cancel</Button>
              <Button
                onClick={() => create.mutate()}
                loading={create.isPending}
                disabled={!name.trim() || !code.trim()}
              >
                Create
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Input
              label="Program name"
              placeholder="e.g. Basic English for Kids"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
            />
            <Input
              label="Code"
              placeholder="e.g. BEFK"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Number of levels" type="number" min="1" value={levels} onChange={(e) => setLevels(e.target.value)} fullWidth />
              <Input label="Weeks per level" type="number" min="1" value={weeks} onChange={(e) => setWeeks(e.target.value)} fullWidth />
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  )
}
