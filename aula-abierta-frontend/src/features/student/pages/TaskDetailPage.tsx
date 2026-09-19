import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, Mic, Paperclip, Send, Upload, X } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { AppShell } from '@core/ui/Layout'
import { Badge, Button, EmptyState, IllustrationPlaceholder, Skeleton, toast, WorkspaceHero } from '@core/ui'
import { studentApi } from '../api'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { formatDate, isOverdue } from '@core/utils/date'
import { numericToLetter } from '@core/utils/gradeLabel'
import type { RubricCriterion } from '@core/types/models'

const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
]

function RubricPreview({ criteria }: { criteria: RubricCriterion[] }) {
  const total = criteria.reduce((sum, criterion) => sum + criterion.max_score, 0)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold text-brand-blue">SCORING GUIDE</p>
        <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-bold tabular-nums text-brand-red">{total} points</span>
      </div>
      <div className="flex flex-col gap-3">
        {criteria.map((criterion) => (
          <div key={criterion.id} className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[.04]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{criterion.name}</p>
                {criterion.description && <p className="mt-1 text-xs font-medium leading-5 text-neutral-500 dark:text-neutral-400">{criterion.description}</p>}
              </div>
              <span className="shrink-0 text-sm font-extrabold tabular-nums text-brand-blue">{criterion.max_score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const id = Number(taskId)
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [notes, setNotes] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)

  const { data: task, isLoading } = useQuery({
    queryKey: ['student', 'task', id],
    queryFn: () => studentApi.getTask(id),
    enabled: Boolean(id),
  })

  const submit = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append('course_task_id', String(id))
      formData.append('notes', notes)
      if (linkUrl) formData.append('link_url', linkUrl)
      files.forEach((file) => formData.append('evidence[]', file))
      if (voiceBlob) formData.append('evidence[]', new File([voiceBlob], 'voice-activity.webm', { type: 'audio/webm' }))
      return studentApi.submitTask(id, formData)
    },
    onSuccess: () => {
      toast.success('Task submitted successfully.')
      queryClient.invalidateQueries({ queryKey: ['student', 'task', id] })
      queryClient.invalidateQueries({ queryKey: ['student', 'tasks', 'upcoming'] })
      setFiles([])
      setNotes('')
      setLinkUrl('')
      setVoiceBlob(null)
    },
    onError: () => toast.error('Submission failed. Please try again.'),
  })

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []).filter((file) => allowedTypes.includes(file.type))
    setFiles((current) => [...current, ...picked].slice(0, 5))
    event.target.value = ''
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-container flex flex-col gap-4 py-8">
          <Skeleton.Line width={320} height={40} />
          <Skeleton.Card />
        </div>
      </AppShell>
    )
  }

  if (!task) return null

  const overdue = isOverdue(task.deadline) && task.status === 'pending'
  const canSubmit = task.is_open && ['pending', 'overdue'].includes(task.status)
  const grade = task.submission?.grade

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="STUDENT ACTIVITY"
          title={task.title}
          description={`Deadline · ${formatDate(task.deadline)}. Review the instructions and submit your best evidence.`}
          image="placeholder"
          imageAlt="Aula Abierta illustration working on a learning activity"
          tone="red"
          actions={<Badge status={overdue ? 'overdue' : task.status} />}
        />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-surface-card sm:p-6" aria-labelledby="activity-instructions-title">
              <p className="text-xs font-bold text-brand-blue">WHAT TO DO</p>
              <h2 id="activity-instructions-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">Instructions</h2>
              <p className="mt-4 whitespace-pre-line text-sm font-medium leading-7 text-neutral-600 text-pretty dark:text-neutral-300">{task.description}</p>
            </section>

            {grade && (
              <section className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-soft dark:border-white/10 dark:bg-surface-card" aria-labelledby="activity-grade-title">
                <div className="flex flex-col justify-between gap-4 bg-brand-blue p-5 text-white sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <p className="text-xs font-bold text-brand-yellow">SAVED RUBRIC RESULT</p>
                    <h2 id="activity-grade-title" className="mt-1 font-display text-2xl font-extrabold text-white">Your grade</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-5xl font-extrabold text-white">{numericToLetter(grade.numeric_score)}</span>
                    <span className="rounded-full bg-white px-4 py-2 text-lg font-extrabold tabular-nums text-brand-blue">{grade.numeric_score}%</span>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-bold text-brand-red">TRAINER FEEDBACK</p>
                  <p className="mt-2 text-sm font-medium leading-7 text-neutral-700 dark:text-neutral-300">{grade.feedback ?? 'Your trainer has not added written feedback yet.'}</p>
                </div>
              </section>
            )}

            {canSubmit && (
              <section className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-surface-card sm:p-6" aria-labelledby="submit-activity-title">
                <p className="text-xs font-bold text-brand-red">YOUR EVIDENCE</p>
                <h2 id="submit-activity-title" className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">Submit your work</h2>
                <p className="mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">Add a note, video link, voice recording, or files as evidence.</p>

                <div className="mt-6 flex flex-col gap-5">
                  <div>
                    <label htmlFor="submission-notes" className="block text-sm font-bold text-neutral-700 dark:text-neutral-200">Notes</label>
                    <textarea
                      id="submission-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Tell your trainer what you created..."
                      rows={4}
                      className="mt-2 w-full resize-none rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-raised dark:text-neutral-100 dark:placeholder:text-neutral-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="submission-link" className="block text-sm font-bold text-neutral-700 dark:text-neutral-200">Video or project link</label>
                    <div className="relative mt-2">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={17} aria-hidden="true" />
                      <input
                        id="submission-link"
                        type="url"
                        value={linkUrl}
                        onChange={(event) => setLinkUrl(event.target.value)}
                        placeholder="https://..."
                        className="h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-raised dark:text-neutral-100 dark:placeholder:text-neutral-600"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Files</p>
                    <p id="file-help" className="mt-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">PDF, images, Word, or audio. Up to five files.</p>
                    <input ref={fileRef} type="file" multiple accept={allowedTypes.join(',')} onChange={addFiles} className="hidden" aria-describedby="file-help" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-3 flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition-colors duration-150 hover:border-brand-blue hover:bg-brand-sky/15 hover:text-brand-blue dark:border-white/10 dark:bg-white/[.03] dark:text-neutral-400 dark:hover:border-brand-blue dark:hover:text-brand-blue"
                    >
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-soft dark:bg-white/10">
                        <Upload size={19} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-bold">Choose evidence files</span>
                    </button>

                    {files.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-2">
                        {files.map((file, index) => (
                          <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-[14px] border border-neutral-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-surface-raised">
                            <Paperclip size={15} className="shrink-0 text-brand-blue" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-700 dark:text-neutral-200">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                              className="flex size-8 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-red-50 hover:text-brand-red dark:hover:bg-red-900/30"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X size={15} aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Mic size={16} className="text-brand-red" aria-hidden="true" />
                      <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Voice Activity</p>
                    </div>
                    <VoiceRecorder
                      onRecord={(blob) => setVoiceBlob(blob)}
                      onClear={() => setVoiceBlob(null)}
                    />
                  </div>

                  <Button
                    onClick={() => submit.mutate()}
                    loading={submit.isPending}
                    disabled={files.length === 0 && !linkUrl && !notes && !voiceBlob}
                    size="lg"
                    fullWidth
                    variant="danger"
                    rightIcon={<Send size={17} aria-hidden="true" />}
                  >
                    Submit activity
                  </Button>
                </div>
              </section>
            )}

            {task.status === 'submitted' && (
              <EmptyState title="Submitted and ready for review" description="Your trainer will save the rubric grade here when the review is complete." />
            )}
            {!canSubmit && task.status === 'closed' && !grade && (
              <EmptyState title="This task is closed" description="It is no longer accepting submissions. Coordination can reopen it when appropriate." />
            )}
          </div>

          <aside className="flex flex-col gap-5 xl:sticky xl:top-6">
            <div className="relative overflow-hidden rounded-[24px] bg-brand-cream p-5 pt-32 shadow-soft dark:bg-white/[.05]">
              <IllustrationPlaceholder variant="task" className="absolute right-3 top-3 h-28 w-32 rounded-2xl" />
              <p className="text-sm font-bold leading-6 text-neutral-700 text-pretty dark:text-neutral-200">Check the rubric before you submit. It shows exactly what your trainer will review.</p>
            </div>
            <section className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-surface-card">
              {task.rubric?.criteria?.length ? (
                <RubricPreview criteria={task.rubric.criteria} />
              ) : (
                <EmptyState title="No rubric attached" />
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
