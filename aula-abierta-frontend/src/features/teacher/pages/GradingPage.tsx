import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, ExternalLink, FileText, MessageSquareQuote, Volume2 } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Avatar, Badge, EmptyState, Modal, SectionHeader, Skeleton, WorkspaceHero } from '@core/ui'
import { teacherApi } from '../api'
import { RubricGrader } from '../components/RubricGrader'
import { formatDate } from '@core/utils/date'
import { numericToLetter } from '@core/utils/gradeLabel'
import { useSound } from '@core/hooks/useSound'
import type { Submission } from '@core/types/models'

export default function GradingPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const [selected, setSelected] = useState<Submission | null>(null)
  const { play } = useSound()

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['trainer', 'classroom', id, 'submissions'],
    queryFn: () => teacherApi.getAllSubmissions(id),
    enabled: Boolean(id),
  })

  const pending = submissions?.filter((submission) => !submission.grade) ?? []
  const graded = submissions?.filter((submission) => submission.grade) ?? []

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="RUBRIC REVIEW"
          title="Grading studio"
          description="Review evidence, score every criterion, and send a complete result to the student."
          image="placeholder"
          imageAlt="Aula Abierta illustration reviewing a rubric"
          tone="blue"
          imagePosition="object-[64%_center]"
          metric={(
            <div className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-white/15 px-4 text-white">
              <ClipboardCheck size={19} aria-hidden="true" />
              <span className="font-display text-2xl font-extrabold tabular-nums">{pending.length}</span>
              <span className="text-xs font-semibold text-white/75">awaiting review</span>
            </div>
          )}
        />

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1, 2].map((index) => <Skeleton.Card key={index} />)}
          </div>
        ) : !submissions?.length ? (
          <EmptyState icon={<ClipboardCheck size={23} />} title="No submissions yet" description="New student evidence will appear here when it is submitted." />
        ) : (
          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section aria-labelledby="pending-reviews-title">
              <SectionHeader eyebrow="ACTIVE QUEUE" title="Pending reviews" titleId="pending-reviews-title" description="Open a submission to review evidence and complete its rubric." />
              {pending.length === 0 ? (
                <EmptyState icon={<ClipboardCheck size={22} />} title="Queue cleared" description="Every current submission has a saved rubric grade." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {pending.map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      onOpen={() => {
                        play('focus')
                        setSelected(submission)
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="sticky top-4 rounded-[22px] border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-brand-red">RECENTLY GRADED</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-neutral-900">Saved results</h2>
              <div className="mt-4 flex flex-col gap-3">
                {graded.length === 0 ? (
                  <p className="text-sm font-medium leading-6 text-neutral-500">Completed rubric grades will collect here.</p>
                ) : (
                  graded.slice(0, 6).map((submission) => (
                    <button
                      key={submission.id}
                      type="button"
                      onClick={() => {
                        play('focus')
                        setSelected(submission)
                      }}
                      className="flex w-full items-center gap-3 rounded-[16px] border border-neutral-100 bg-neutral-50 p-3 text-left transition-colors duration-150 hover:border-brand-blue hover:bg-brand-sky/20"
                    >
                      <Avatar name={submission.student?.name ?? `Student ${submission.student_id}`} role="student" size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-neutral-800">{submission.student?.name ?? `Student ${submission.student_id}`}</span>
                        <span className="block truncate text-xs font-semibold text-neutral-400">{submission.course_task?.title ?? `Submission ${submission.id}`}</span>
                      </span>
                      <span className="font-display text-lg font-extrabold text-brand-blue">
                        {numericToLetter(submission.grade?.numeric_score ?? 0)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}

        <Modal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title={selected?.course_task?.title ?? `Submission ${selected?.id ?? ''}`}
          size="xl"
        >
          {selected && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 rounded-[18px] bg-brand-cream p-4">
                <Avatar name={selected.student?.name ?? `Student ${selected.student_id}`} role="student" size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-extrabold text-neutral-900">{selected.student?.name ?? `Student ${selected.student_id}`}</p>
                  <p className="text-xs font-semibold text-neutral-500">{selected.student?.sis_id ?? `Student ID ${selected.student_id}`} · Submitted {formatDate(selected.submitted_at)}</p>
                </div>
                <Badge status={selected.grade ? 'graded' : 'submitted'} />
              </div>

              {selected.evidence_urls.length > 0 && (
                <section aria-labelledby="submission-evidence-title">
                  <p id="submission-evidence-title" className="text-xs font-bold text-brand-blue">SUBMITTED EVIDENCE</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {selected.evidence_urls.map((evidence) => {
                      const isAudio = /\.(webm|mp3|mp4|ogg|wav|m4a)$/i.test(evidence.filename) ||
                        evidence.filename.startsWith('voice-activity')
                      return isAudio ? (
                        <div key={evidence.id} className="rounded-[16px] border border-brand-sky/50 bg-brand-sky/10 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Volume2 size={16} className="text-brand-blue" aria-hidden="true" />
                            <span className="text-xs font-bold text-brand-blue">VOICE ACTIVITY</span>
                            <span className="ml-auto truncate text-xs font-semibold text-neutral-400">{evidence.filename}</span>
                          </div>
                          <audio controls src={evidence.signed_url} className="w-full rounded-xl" />
                        </div>
                      ) : (
                        <a
                          key={evidence.id}
                          href={evidence.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-12 items-center gap-3 rounded-[14px] border border-neutral-200 bg-white px-3 text-sm font-bold text-neutral-700 no-underline transition-colors duration-150 hover:border-brand-blue hover:text-brand-blue hover:no-underline"
                        >
                          <FileText size={16} aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{evidence.filename}</span>
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      )
                    })}
                  </div>
                </section>
              )}

              {selected.notes && (
                <div className="flex items-start gap-3 rounded-[16px] border border-neutral-200 bg-neutral-50 p-4">
                  <MessageSquareQuote size={17} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold text-neutral-500">STUDENT NOTE</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-neutral-700">{selected.notes}</p>
                  </div>
                </div>
              )}

              {selected.grade ? (
                <div className="rounded-[22px] bg-brand-blue p-6 text-center text-white">
                  <p className="text-xs font-bold text-brand-yellow">SAVED RUBRIC RESULT</p>
                  <p className="mt-2 font-display text-5xl font-extrabold tabular-nums text-white">{selected.grade.numeric_score}%</p>
                  <p className="mt-1 text-sm font-semibold text-white/75">Grade {numericToLetter(selected.grade.numeric_score)}</p>
                  {selected.grade.feedback && <p className="mx-auto mt-4 max-w-lg text-sm font-medium leading-6 text-white/85">{selected.grade.feedback}</p>}
                </div>
              ) : (
                <RubricGrader
                  submission={selected}
                  criteria={selected.course_task?.rubric?.criteria ?? []}
                  classroomId={id}
                  onDone={() => setSelected(null)}
                />
              )}
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  )
}

function SubmissionCard({ submission, onOpen }: { submission: Submission; onOpen: () => void }) {
  const name = submission.student?.name ?? `Student ${submission.student_id}`

  return (
    <article className="flex min-h-56 flex-col justify-between rounded-[22px] border border-neutral-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <Avatar name={name} role="student" size="md" />
        <Badge status="submitted" />
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold text-brand-blue">{submission.student?.sis_id ?? `ID ${submission.student_id}`}</p>
        <h3 className="mt-1 font-display text-xl font-extrabold text-neutral-900">{name}</h3>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-neutral-500">{submission.course_task?.title ?? `Submission ${submission.id}`}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-red-700"
      >
        Review submission <ClipboardCheck size={16} aria-hidden="true" />
      </button>
    </article>
  )
}
