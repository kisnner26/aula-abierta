import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCheck, MessageCircle, Search, Send, Users } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Avatar, Button, EmptyState, IllustrationPlaceholder, Input, Skeleton, WorkspaceHero } from '@core/ui'
import { teacherApi } from '../api'
import { relativeTime } from '@core/utils/date'
import { cn } from '@core/utils'
import { useSound } from '@core/hooks/useSound'

type ChatLike = { id: number; from: string; sender_name: string; timestamp: string; read_at?: string | null; body: string }

function dayKey(ts: string) { return new Date(ts).toDateString() }
function dayLabel(ts: string) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function buildRows<T extends ChatLike>(messages: T[]) {
  return messages.map((message, i) => {
    const prev = messages[i - 1]
    const next = messages[i + 1]
    const sameAsPrev = Boolean(prev && prev.from === message.from && dayKey(prev.timestamp) === dayKey(message.timestamp))
    const sameAsNext = Boolean(next && next.from === message.from && dayKey(next.timestamp) === dayKey(message.timestamp))
    return { message, isMine: message.from === 'me', firstInGroup: !sameAsPrev, lastInGroup: !sameAsNext, showDay: !prev || dayKey(prev.timestamp) !== dayKey(message.timestamp) }
  })
}

export default function MessagesPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [recipientId, setRecipientId] = useState<number | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const { play } = useSound()

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['trainer', 'classroom', id, 'students'],
    queryFn: () => teacherApi.getStudents(id),
    enabled: Boolean(id),
  })

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['trainer', 'classroom', id, 'messages', recipientId],
    queryFn: () => teacherApi.getMessages(id),
    enabled: Boolean(id) && recipientId !== null,
    refetchInterval: 60_000, // 1-min fallback — SSE pushes new messages in real time
  })

  const send = useMutation({
    mutationFn: () => teacherApi.sendMessage(id, draft.trim(), recipientId!),
    onSuccess: () => {
      play('message')
      setDraft('')
      queryClient.invalidateQueries({ queryKey: ['trainer', 'classroom', id, 'messages', recipientId] })
    },
  })

  useEffect(() => {
    const list = messageListRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages])

  const visibleStudents = students?.filter((student) => student.name.toLowerCase().includes(search.toLowerCase())) ?? []
  const selectedStudent = students?.find((student) => student.id === recipientId)
  const conversation = messages?.filter((message) => message.sender_id === recipientId || message.from === 'me') ?? []
  const rows = useMemo(() => buildRows(conversation), [conversation])

  return (
    <AppShell>
      <div className="page-container flex h-[calc(100dvh-9rem)] flex-col gap-4 py-4 sm:py-5 lg:h-[calc(100dvh-5.5rem)]">
        <div className="shrink-0">
          <WorkspaceHero
            eyebrow="CLASSROOM COMMUNICATION"
            title="Student messages"
            description="Choose a student, review the conversation, and send clear follow-up from one focused workspace."
            image="placeholder"
            imageAlt="Aula Abierta illustration writing a classroom message"
            tone="neutral"
            imagePosition="object-[55%_center]"
          />
        </div>
        <section className="grid min-h-0 w-full flex-1 overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-card lg:grid-cols-[320px_1fr]">
          <aside className={cn('flex min-h-0 flex-col border-b border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-surface-deep lg:border-b-0 lg:border-r', recipientId ? 'hidden lg:flex' : 'flex')}>
            <div className="bg-brand-blue p-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
                  <Users size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-brand-yellow">STUDENT CHANNELS</p>
                  <h1 className="font-display text-xl font-extrabold text-white">Messages</h1>
                </div>
              </div>
              <label className="relative mt-4 block">
                <span className="sr-only">Search students</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={16} aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search students"
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/15 pl-10 pr-3 text-sm font-semibold text-white placeholder:text-white/55 focus:border-white focus:ring-2 focus:ring-white"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {loadingStudents ? (
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((index) => <Skeleton.Line key={index} height={60} />)}
                </div>
              ) : visibleStudents.length === 0 ? (
                <p className="p-4 text-center text-sm font-semibold text-neutral-500">No students found.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {visibleStudents.map((student) => (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => {
                          play('tap')
                          setRecipientId(student.id)
                        }}
                        className={cn(
                          'flex min-h-16 w-full items-center gap-3 rounded-[16px] border p-3 text-left transition-colors duration-150',
                          recipientId === student.id
                            ? 'border-brand-blue bg-brand-sky/25'
                            : 'border-transparent bg-white hover:border-neutral-200',
                        )}
                        aria-pressed={recipientId === student.id}
                      >
                        <Avatar name={student.name} role="student" size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-neutral-800">{student.name}</span>
                          <span className="block truncate text-xs font-semibold text-neutral-400">{student.sis_id}</span>
                        </span>
                        <span className={cn('size-2 rounded-full', recipientId === student.id ? 'bg-brand-blue' : 'bg-neutral-200')} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <div className={cn('min-h-0 flex-col lg:flex', recipientId ? 'flex' : 'hidden')}>
            {!recipientId ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  icon={<MessageCircle size={23} />}
                  title="Choose a student"
                  description="Select a student channel to review the conversation or send a message."
                />
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      play('tap')
                      setRecipientId(null)
                    }}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors duration-150 hover:border-brand-blue hover:text-brand-blue lg:hidden"
                    aria-label="Back to student channels"
                  >
                    <ArrowLeft size={17} aria-hidden="true" />
                  </button>
                  <Avatar name={selectedStudent?.name ?? ''} role="student" size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-lg font-extrabold text-neutral-900">{selectedStudent?.name}</h2>
                    <p className="truncate text-xs font-semibold text-neutral-400">{selectedStudent?.sis_id}</p>
                  </div>
                  <span className="hidden rounded-full bg-brand-cream px-3 py-1.5 text-xs font-bold text-brand-red sm:block">Direct channel</span>
                </header>

                <div ref={messageListRef} className="relative flex-1 overflow-y-auto bg-surface-paper p-4 sm:p-6" aria-live="polite">
                  <IllustrationPlaceholder variant="messages" className="pointer-events-none absolute inset-0 size-full opacity-[0.03]" />
                  <div className="relative z-10 flex min-h-full flex-col justify-end">
                    {loadingMessages ? (
                      <div className="flex flex-col gap-3">{[0, 1, 2].map((index) => <Skeleton.Line key={index} height={56} />)}</div>
                    ) : conversation.length === 0 ? (
                      <EmptyState title="No messages yet" description="Start a clear, supportive conversation with this student." />
                    ) : (
                      rows.map(({ message, isMine, firstInGroup, lastInGroup, showDay }) => (
                        <div key={message.id}>
                          {showDay && (
                            <div className="my-4 flex justify-center">
                              <span className="rounded-full bg-neutral-200/70 px-3 py-1 text-[11px] font-bold text-neutral-500 dark:bg-white/10 dark:text-neutral-300">{dayLabel(message.timestamp)}</span>
                            </div>
                          )}
                          <div className={cn('flex items-end gap-2', firstInGroup ? 'mt-3' : 'mt-0.5', isMine && 'flex-row-reverse')}>
                            {!isMine && (lastInGroup ? <Avatar name={message.sender_name} role="student" size="sm" /> : <span className="size-8 shrink-0" aria-hidden="true" />)}
                            <div className={cn('flex max-w-[80%] flex-col sm:max-w-[65%]', isMine ? 'items-end' : 'items-start')}>
                              <div className={cn(
                                'px-4 py-2.5 text-sm font-medium leading-6 shadow-sm',
                                isMine ? 'rounded-2xl bg-brand-blue text-white' : 'rounded-2xl border border-neutral-200 bg-white text-neutral-800 dark:border-white/10 dark:bg-surface-raised dark:text-neutral-100',
                                isMine && !firstInGroup && 'rounded-tr-md',
                                isMine && lastInGroup && 'rounded-br-sm',
                                !isMine && !firstInGroup && 'rounded-tl-md',
                                !isMine && lastInGroup && 'rounded-bl-sm',
                              )}>
                                {message.body}
                              </div>
                              {lastInGroup && (
                                <span className="mt-1 flex items-center gap-1 px-1 text-[11px] font-semibold text-neutral-400">
                                  {relativeTime(message.timestamp)}
                                  {isMine && <CheckCheck size={13} className={message.read_at ? 'text-brand-blue' : 'text-neutral-300'} aria-hidden="true" />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <form
                  className="flex gap-3 border-t border-neutral-100 p-4 sm:px-6"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (draft.trim()) send.mutate()
                  }}
                >
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Message ${selectedStudent?.name ?? 'student'}...`}
                    fullWidth
                    aria-label="Message"
                  />
                  <Button type="submit" loading={send.isPending} disabled={!draft.trim()} aria-label="Send message" className="!size-10 !px-0">
                    <Send size={16} aria-hidden="true" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
