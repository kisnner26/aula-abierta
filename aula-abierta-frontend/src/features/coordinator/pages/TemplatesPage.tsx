import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import axios from 'axios'
import { AlertTriangle, BookOpen, Copy, FileText, Layers3, Lock, Plus, Trash2, Unlock } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, Button, EmptyState, IllustrationPlaceholder, Input, Modal, PageCanvas, SectionHeader, Skeleton, toast, WorkspaceHero } from '@core/ui'
import { cn } from '@core/utils'
import { ROUTES } from '@router/routes'
import { coordinatorApi } from '../api'
import type { Template } from '@core/types/models'

export default function TemplatesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [programId, setProgramId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [filterProgram, setFilterProgram] = useState('all')

  const templates = useQuery({ queryKey: ['coordinator', 'templates'], queryFn: coordinatorApi.getTemplates })
  const programs = useQuery({ queryKey: ['coordinator', 'programs'], queryFn: coordinatorApi.getPrograms })
  const levels = useQuery({
    queryKey: ['coordinator', 'programs', programId, 'levels'],
    queryFn: () => coordinatorApi.getLevels(Number(programId)),
    enabled: Boolean(programId),
  })

  const create = useMutation({
    mutationFn: () => coordinatorApi.createTemplate({ title: newTitle, level_id: Number(levelId) }),
    onSuccess: (template) => {
      toast.success('Template created.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'templates'] })
      setShowCreate(false)
      setNewTitle('')
      setProgramId('')
      setLevelId('')
      void qc.prefetchQuery({ queryKey: ['coordinator', 'template', template.id], queryFn: () => coordinatorApi.getTemplate(template.id) })
    },
    onError: () => toast.error('Failed to create template.'),
  })

  const freeze = useMutation({
    mutationFn: (id: number) => coordinatorApi.freezeTemplate(id),
    onSuccess: () => {
      toast.success('Template status updated.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'templates'] })
    },
  })

  const [toDelete, setToDelete] = useState<Template | null>(null)

  const remove = useMutation({
    mutationFn: (id: number) => coordinatorApi.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Template deleted.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'templates'] })
      setToDelete(null)
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined
      toast.error(message ?? 'Failed to delete template.')
    },
  })

  const filteredTemplates = useMemo(() => {
    const all = templates.data ?? []
    return filterProgram === 'all'
      ? all
      : all.filter((template) => String(template.level?.program?.id) === filterProgram)
  }, [templates.data, filterProgram])

  const canCreate = newTitle.trim().length > 2 && Boolean(levelId)

  return (
    <AppShell>
      <main className="min-h-full bg-surface-paper dark:bg-surface-page">
        <PageCanvas>
          <WorkspaceHero
            eyebrow="PROTECTED ACADEMIC ORIGINALS"
            title="Base templates by program"
            description="Create the official class structure once, assign copies to trainers, and keep every original protected."
            image="placeholder"
            imageAlt="Aula Abierta illustration presenting protected class templates"
            tone="red"
            imagePosition="object-[38%_center]"
            actions={<Button variant="secondary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New template</Button>}
            metric={<span className="inline-flex min-h-11 items-center rounded-xl border border-white/30 px-4 text-sm font-bold text-white">{templates.data?.length ?? 0} originals</span>}
          />

          <section aria-label="Template filters">
            <SectionHeader
              eyebrow="LIBRARY"
              title="Program templates"
              description="Browse each program's master content and manage trainer-ready copies."
              action={
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterButton active={filterProgram === 'all'} onClick={() => setFilterProgram('all')}>All</FilterButton>
              {programs.data?.map((program) => (
                <FilterButton key={program.id} active={filterProgram === String(program.id)} onClick={() => setFilterProgram(String(program.id))}>
                  {program.code}
                </FilterButton>
              ))}
            </div>
              }
            />
          </section>

          {templates.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Skeleton.Card />
              <Skeleton.Card />
              <Skeleton.Card />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <EmptyState icon={<FileText size={22} />} title="No templates in this view" description="Create a base template and attach it to a program level." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTemplates.map((template, index) => (
                <TemplateCard key={template.id} template={template} index={index} onFreeze={() => freeze.mutate(template.id)} onDelete={() => setToDelete(template)} busy={freeze.isPending} />
              ))}
            </div>
          )}
        </PageCanvas>

        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New base template"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!canCreate}>Create template</Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Input label="Template title" placeholder="BEFK Level 1 official template" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} fullWidth autoFocus />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Program</span>
                <select value={programId} onChange={(event) => { setProgramId(event.target.value); setLevelId('') }} className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-deep dark:text-white">
                  <option value="">Select program</option>
                  {programs.data?.map((program) => <option key={program.id} value={program.id}>{program.code} · {program.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Level</span>
                <select value={levelId} onChange={(event) => setLevelId(event.target.value)} disabled={!programId || levels.isLoading} className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60 dark:border-white/10 dark:bg-surface-deep dark:text-white">
                  <option value="">Select level</option>
                  {levels.data?.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
                </select>
              </label>
            </div>
          </div>
        </Modal>

        <Modal
          open={Boolean(toDelete)}
          onClose={() => setToDelete(null)}
          title="Delete template"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setToDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => toDelete && remove.mutate(toDelete.id)} loading={remove.isPending} leftIcon={<Trash2 size={16} aria-hidden="true" />}>
                Delete template
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-brand-red dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={18} aria-hidden="true" />
            </span>
            <div className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              <p>You are about to permanently delete <strong className="font-bold text-neutral-900 dark:text-white">{toDelete?.title}</strong>, including all its weeks, materials, and rubrics. This cannot be undone.</p>
              {(toDelete?.classrooms_count ?? 0) > 0 && (
                <p className="mt-3 rounded-xl bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300">
                  This template has {toDelete?.classrooms_count} classroom {toDelete?.classrooms_count === 1 ? 'copy' : 'copies'}. Templates in use cannot be deleted until those classrooms are removed.
                </p>
              )}
            </div>
          </div>
        </Modal>
      </main>
    </AppShell>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-10 shrink-0 rounded-xl border px-4 text-sm font-extrabold transition-colors duration-150',
        active ? 'border-brand-blue bg-brand-blue text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-blue dark:border-white/10 dark:bg-surface-card dark:text-neutral-300',
      )}
    >
      {children}
    </button>
  )
}

function TemplateCard({ template, index, onFreeze, onDelete, busy }: { template: Template; index: number; onFreeze: () => void; onDelete: () => void; busy: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.12) }}
      className="group overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm transition-colors duration-150 hover:border-brand-blue dark:border-white/10 dark:bg-surface-card"
    >
      <Link to={ROUTES.coordinator.template(template.id)} className="block no-underline hover:no-underline">
        <div className="relative aspect-[16/7] overflow-hidden bg-brand-cream">
          {template.cover_image_url ? (
            <img src={template.cover_image_url} alt="" className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none" />
          ) : (
            <div className="flex size-full items-center justify-center bg-brand-red"><Layers3 size={34} className="text-white" aria-hidden="true" /></div>
          )}
          <div className="absolute right-3 top-3"><Badge status={template.is_frozen ? 'closed' : 'active'} label={template.is_frozen ? 'Frozen' : 'Editable'} /></div>
        </div>
        <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-sky/40 text-brand-blue">
            <Layers3 size={20} aria-hidden="true" />
          </span>
        </div>
        <p className="mt-5 text-xs font-extrabold text-brand-red">{template.level?.program?.code ?? 'PROGRAM'} · {template.level?.name ?? 'Level'}</p>
        <h3 className="mt-2 font-display text-2xl font-extrabold leading-8 text-neutral-950 text-balance dark:text-white">{template.title}</h3>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Metric icon={<BookOpen size={15} aria-hidden="true" />} label="Weeks" value={template.weeks_count} />
          <Metric icon={<Copy size={15} aria-hidden="true" />} label="Copies" value={template.classrooms_count ?? 0} />
        </div>
        </div>
      </Link>
      <div className="flex items-center gap-1 border-t border-neutral-100 p-3 dark:border-white/10">
        <button
          type="button"
          onClick={onFreeze}
          disabled={busy}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          {template.is_frozen ? <Unlock size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
          {template.is_frozen ? 'Unfreeze original' : 'Freeze original'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-red-50 hover:text-brand-red dark:text-neutral-500 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          aria-label={`Delete template ${template.title}`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.04]">
      <div className="flex items-center gap-2 text-brand-blue">{icon}<span className="text-xs font-extrabold">{label}</span></div>
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-neutral-900 dark:text-white">{value}</p>
    </div>
  )
}
