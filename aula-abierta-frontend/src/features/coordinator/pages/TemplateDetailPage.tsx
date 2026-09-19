import { Children, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import axios from 'axios'
import { AlertTriangle, ArrowLeft, BookOpen, Camera, Copy, FileText, Layers3, Link2, Lock, Plus, Trash2, Upload } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, Button, EmptyState, Input, Modal, PageCanvas, SectionHeader, Skeleton, toast, WorkspaceHero } from '@core/ui'
import { ROUTES } from '@router/routes'
import { coordinatorApi } from '../api'
import type { TemplateWeek } from '@core/types/models'

const materialTypes = ['slide', 'document', 'link', 'audio', 'vocabulary'] as const

export default function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const id = Number(templateId)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [showClone, setShowClone] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showWeek, setShowWeek] = useState(false)
  const [uploadWeek, setUploadWeek] = useState<TemplateWeek | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [cloneName, setCloneName] = useState('')
  const [clonePeriod, setClonePeriod] = useState('2026-I')
  const [cloneStart, setCloneStart] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [weekNumber, setWeekNumber] = useState('')
  const [weekTitle, setWeekTitle] = useState('')
  const [vocabulary, setVocabulary] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialType, setMaterialType] = useState<(typeof materialTypes)[number]>('slide')
  const [materialProtected, setMaterialProtected] = useState(true)
  const [materialUrl, setMaterialUrl] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadType, setUploadType] = useState<(typeof materialTypes)[number]>('document')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const template = useQuery({
    queryKey: ['coordinator', 'template', id],
    queryFn: () => coordinatorApi.getTemplate(id),
    enabled: Boolean(id),
  })

  const trainers = useQuery({ queryKey: ['coordinator', 'trainers'], queryFn: coordinatorApi.getTrainers })

  const weeks = useMemo(() => template.data?.weeks ?? [], [template.data?.weeks])
  const nextWeekNumber = weeks.length + 1

  const freeze = useMutation({
    mutationFn: () => coordinatorApi.freezeTemplate(id),
    onSuccess: () => {
      toast.success('Template status updated.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'template', id] })
      qc.invalidateQueries({ queryKey: ['coordinator', 'templates'] })
    },
  })

  const remove = useMutation({
    mutationFn: () => coordinatorApi.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Template deleted.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'templates'] })
      setConfirmDelete(false)
      navigate(ROUTES.coordinator.templates)
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined
      toast.error(message ?? 'Failed to delete template.')
    },
  })

  const addWeek = useMutation({
    mutationFn: () => coordinatorApi.addTemplateWeek(id, {
      number: Number(weekNumber || nextWeekNumber),
      title: weekTitle,
      vocabulary,
      materials: materialTitle.trim() ? [{
        title: materialTitle,
        type: materialType,
        is_protected: materialProtected,
        external_url: materialProtected ? undefined : materialUrl,
      }] : [],
      tasks: taskTitle.trim() ? [{
        title: taskTitle,
        description: taskDescription,
        deadline_offset_days: 7 * Number(weekNumber || nextWeekNumber),
      }] : [],
    }),
    onSuccess: () => {
      toast.success('Template week added.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'template', id] })
      qc.invalidateQueries({ queryKey: ['coordinator', 'templates'] })
      setShowWeek(false)
      setWeekNumber('')
      setWeekTitle('')
      setVocabulary('')
      setMaterialTitle('')
      setMaterialType('slide')
      setMaterialProtected(true)
      setMaterialUrl('')
      setTaskTitle('')
      setTaskDescription('')
    },
    onError: () => toast.error('Failed to add week. Check if the week number already exists.'),
  })

  const clone = useMutation({
    mutationFn: () => coordinatorApi.cloneTemplate(id, {
      classroom_name: cloneName,
      academic_period: clonePeriod,
      trainer_id: trainerId ? Number(trainerId) : undefined,
      starts_at: cloneStart || undefined,
    }),
    onSuccess: (classroom) => {
      toast.success('Classroom copy created for the trainer.')
      setShowClone(false)
      navigate(ROUTES.coordinator.classroom(classroom.id))
    },
    onError: () => toast.error('Failed to create classroom copy.'),
  })

  const uploadCover = useMutation({
    mutationFn: (file: File) => coordinatorApi.uploadTemplateCover(id, file),
    onSuccess: () => {
      toast.success('Template cover saved securely.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'template', id] })
      qc.invalidateQueries({ queryKey: ['coordinator', 'templates'] })
    },
    onError: () => toast.error('Use a JPG, PNG, or WebP image under 6 MB.'),
  })

  const uploadMaterial = useMutation({
    mutationFn: () => coordinatorApi.uploadTemplateMaterial(uploadWeek!.id, {
      title: uploadTitle,
      type: uploadType,
      is_protected: true,
      file: uploadFile!,
    }),
    onSuccess: () => {
      toast.success('Protected material uploaded.')
      qc.invalidateQueries({ queryKey: ['coordinator', 'template', id] })
      setUploadWeek(null)
      setUploadTitle('')
      setUploadFile(null)
    },
    onError: () => toast.error('The material could not be uploaded. Check its format and size.'),
  })

  if (template.isLoading) {
    return (
      <AppShell>
        <PageCanvas className="gap-4">
          <Skeleton.Line width={300} height={32} />
          <Skeleton.Card />
          <Skeleton.Card />
        </PageCanvas>
      </AppShell>
    )
  }

  if (!template.data) {
    return (
      <AppShell>
        <PageCanvas>
          <EmptyState title="Template unavailable" description="Return to the template library and open it again." />
        </PageCanvas>
      </AppShell>
    )
  }

  const isFrozen = template.data.is_frozen
  const canAddWeek = !isFrozen && weekTitle.trim().length > 2 && Number(weekNumber || nextWeekNumber) > 0

  return (
    <AppShell>
      <main className="min-h-full bg-surface-paper dark:bg-surface-page">
        <PageCanvas>
          <Link to={ROUTES.coordinator.templates} className="inline-flex w-fit items-center gap-2 text-sm font-bold text-neutral-500 no-underline hover:text-brand-blue hover:no-underline dark:text-neutral-300">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to templates
          </Link>

          <WorkspaceHero
            eyebrow={`${template.data.level?.program?.code ?? 'PROGRAM'} · ${template.data.level?.name ?? 'Level'}`}
            title={template.data.title}
            description="This official base stays protected. Trainer classrooms receive independent copies that can evolve without rewriting the original."
            image={template.data.cover_image_url || 'placeholder'}
            imageAlt={template.data.cover_image_url ? `${template.data.title} cover` : 'Aula Abierta illustration with protected class content'}
            tone="red"
            actions={
              <>
                <Button variant="secondary" leftIcon={<Copy size={16} />} onClick={() => setShowClone(true)}>Assign copy</Button>
                <Button variant="secondary" leftIcon={<Lock size={16} />} onClick={() => freeze.mutate()} loading={freeze.isPending}>{isFrozen ? 'Unfreeze' : 'Freeze'}</Button>
                {!isFrozen && <Button variant="ghost" className="border-white/30 text-white hover:bg-white/10" leftIcon={<Camera size={16} />} onClick={() => coverInputRef.current?.click()} loading={uploadCover.isPending}>Change cover</Button>}
                <Button variant="ghost" className="border-white/30 text-white hover:bg-white/15" leftIcon={<Trash2 size={16} />} onClick={() => setConfirmDelete(true)}>Delete</Button>
              </>
            }
            metric={<Badge status={isFrozen ? 'closed' : 'active'} label={`${weeks.length} weeks · ${isFrozen ? 'Frozen' : 'Editable'}`} />}
          />
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadCover.mutate(file); event.target.value = '' }} />

          <SectionHeader
            eyebrow="TEMPLATE CONTENT"
            title="Weeks, materials, and activities"
            description="Build the reusable learning sequence before assigning protected classroom copies."
            action={!isFrozen ? <Button size="sm" variant="secondary" leftIcon={<Plus size={15} />} onClick={() => { setWeekNumber(String(nextWeekNumber)); setShowWeek(true) }}>Add week</Button> : undefined}
          />

          {weeks.length === 0 ? (
            <EmptyState icon={<Layers3 size={22} />} title="No weeks in this base template" description={isFrozen ? 'Unfreeze the template to add the first week.' : 'Add week 1 with its class materials and activity.'} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {weeks.map((week, index) => <TemplateWeekCard key={week.id} week={week} index={index} onUpload={() => setUploadWeek(week)} disabled={isFrozen} />)}
            </div>
          )}
        </PageCanvas>

        <Modal
          open={showWeek}
          onClose={() => setShowWeek(false)}
          title="Add week to original"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowWeek(false)}>Cancel</Button>
              <Button onClick={() => addWeek.mutate()} loading={addWeek.isPending} disabled={!canAddWeek}>Add week</Button>
            </>
          }
        >
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <Input label="Week" type="number" min="1" value={weekNumber} onChange={(event) => setWeekNumber(event.target.value)} fullWidth />
              <Input label="Title" placeholder="Learning path region name" value={weekTitle} onChange={(event) => setWeekTitle(event.target.value)} fullWidth autoFocus />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Vocabulary</span>
              <textarea value={vocabulary} onChange={(event) => setVocabulary(event.target.value)} rows={3} placeholder="red:rojo, blue:azul, friend:amigo" className="rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-deep dark:text-white" />
            </label>
            <div className="rounded-[20px] border border-neutral-200 p-4 dark:border-white/10">
              <p className="text-xs font-extrabold text-brand-red">FIRST MATERIAL</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_150px]">
                <Input label="Material title" placeholder="Week slides" value={materialTitle} onChange={(event) => setMaterialTitle(event.target.value)} fullWidth />
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Type</span>
                  <select value={materialType} onChange={(event) => setMaterialType(event.target.value as typeof materialType)} className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-deep dark:text-white">
                    {materialTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm font-bold text-neutral-700 dark:text-neutral-200">
                <input type="checkbox" checked={materialProtected} onChange={(event) => setMaterialProtected(event.target.checked)} className="size-5 rounded border-neutral-300 text-brand-red focus:ring-brand-red" />
                Protected institutional material
              </label>
              {!materialProtected && <div className="mt-4"><Input label="External URL" type="url" value={materialUrl} onChange={(event) => setMaterialUrl(event.target.value)} fullWidth /></div>}
            </div>
            <div className="rounded-[20px] border border-neutral-200 p-4 dark:border-white/10">
              <p className="text-xs font-extrabold text-brand-blue">FIRST ACTIVITY</p>
              <div className="mt-3 grid gap-4">
                <Input label="Activity title" placeholder="Speak and create" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} fullWidth />
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Activity instructions</span>
                  <textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} rows={3} className="rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-deep dark:text-white" />
                </label>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          open={Boolean(uploadWeek)}
          onClose={() => setUploadWeek(null)}
          title={`Upload to week ${uploadWeek?.number ?? ''}`}
          size="md"
          footer={<><Button variant="ghost" onClick={() => setUploadWeek(null)}>Cancel</Button><Button leftIcon={<Upload size={16} />} onClick={() => uploadMaterial.mutate()} loading={uploadMaterial.isPending} disabled={!uploadTitle.trim() || !uploadFile}>Upload securely</Button></>}
        >
          <div className="grid gap-4">
            <Input label="Material title" value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="Week presentation" fullWidth autoFocus />
            <label className="flex flex-col gap-1.5"><span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Material type</span><select value={uploadType} onChange={(event) => setUploadType(event.target.value as typeof uploadType)} className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-semibold dark:border-white/10 dark:bg-surface-deep dark:text-white"><option value="slide">Slides</option><option value="document">Document</option><option value="audio">Audio</option><option value="vocabulary">Vocabulary</option></select></label>
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-5 text-center hover:border-brand-blue dark:border-white/15 dark:bg-white/[.03]"><Upload size={22} className="text-brand-blue" aria-hidden="true" /><span className="mt-2 text-sm font-bold text-neutral-800 dark:text-white">{uploadFile?.name ?? 'Choose a protected file'}</span><span className="mt-1 text-xs font-semibold text-neutral-500">PDF, Office, image, or audio · up to 50 MB</span><input type="file" className="sr-only" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp3,.m4a,.ogg" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /></label>
          </div>
        </Modal>

        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="Delete template"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending} leftIcon={<Trash2 size={16} aria-hidden="true" />}>Delete template</Button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-brand-red dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={18} aria-hidden="true" />
            </span>
            <div className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              <p>You are about to permanently delete <strong className="font-bold text-neutral-900 dark:text-white">{template.data?.title}</strong>, including all its weeks, materials, and rubrics. This cannot be undone.</p>
              {(template.data?.classrooms_count ?? 0) > 0 && (
                <p className="mt-3 rounded-xl bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300">
                  This template has {template.data?.classrooms_count} classroom {template.data?.classrooms_count === 1 ? 'copy' : 'copies'}. Templates in use cannot be deleted until those classrooms are removed.
                </p>
              )}
            </div>
          </div>
        </Modal>

        <Modal
          open={showClone}
          onClose={() => setShowClone(false)}
          title="Assign copy to trainer"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowClone(false)}>Cancel</Button>
              <Button onClick={() => clone.mutate()} loading={clone.isPending} disabled={!cloneName.trim() || !clonePeriod.trim()}>Create classroom copy</Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Input label="Classroom name" placeholder="BEFK L1 Group B" value={cloneName} onChange={(event) => setCloneName(event.target.value)} fullWidth autoFocus />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Academic period" value={clonePeriod} onChange={(event) => setClonePeriod(event.target.value)} fullWidth />
              <Input label="Start date" type="date" value={cloneStart} onChange={(event) => setCloneStart(event.target.value)} fullWidth />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Trainer</span>
              <select value={trainerId} onChange={(event) => setTrainerId(event.target.value)} className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-deep dark:text-white">
                <option value="">Assign later</option>
                {trainers.data?.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name} · {trainer.sis_id}</option>)}
              </select>
            </label>
          </div>
        </Modal>
      </main>
    </AppShell>
  )
}

function TemplateWeekCard({ week, index, onUpload, disabled }: { week: TemplateWeek; index: number; onUpload: () => void; disabled: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.12) }}
      className="rounded-[22px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-brand-blue">WEEK {week.number}</p>
          <h3 className="mt-1 font-display text-2xl font-extrabold text-neutral-950 text-balance dark:text-white">{week.title}</h3>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow text-neutral-950">
          <BookOpen size={18} aria-hidden="true" />
        </span>
      </div>
      {week.vocabulary && <p className="mt-4 line-clamp-2 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-semibold leading-6 text-neutral-700 dark:bg-white/[.04] dark:text-neutral-200">{week.vocabulary}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoBlock title="Materials" empty="No materials yet">
          {week.materials.map((material) => (
            <li key={material.id} className="flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200">
              {material.type === 'link' ? <Link2 size={15} className="text-brand-blue" aria-hidden="true" /> : <FileText size={15} className="text-brand-red" aria-hidden="true" />}
              <span className="truncate">{material.title}</span>
              {material.is_protected && <Lock size={13} className="text-brand-red" aria-label="Protected material" />}
            </li>
          ))}
        </InfoBlock>
        <InfoBlock title="Activities" empty="No activities yet">
          {week.tasks.map((task) => (
            <li key={task.id} className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
              <span className="line-clamp-1">{task.title}</span>
              <span className="mt-1 block text-xs font-semibold text-neutral-400">Due after {task.deadline_offset_days} days</span>
            </li>
          ))}
        </InfoBlock>
      </div>
      {!disabled && <button type="button" onClick={onUpload} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand-blue text-sm font-bold text-brand-blue transition-colors duration-150 hover:bg-brand-sky/20"><Upload size={15} aria-hidden="true" /> Upload protected resource</button>}
    </motion.article>
  )
}

function InfoBlock({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const count = Children.count(children)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4 dark:border-white/10">
      <p className="text-xs font-extrabold text-neutral-400">{title.toUpperCase()}</p>
      {count > 0 ? <ul className="mt-3 space-y-3">{children}</ul> : <p className="mt-3 text-sm font-semibold text-neutral-400">{empty}</p>}
    </div>
  )
}
