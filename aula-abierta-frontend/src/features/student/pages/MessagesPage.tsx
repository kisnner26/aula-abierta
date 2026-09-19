import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCheck, ChevronUp, Send } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Avatar, Button, IllustrationPlaceholder, Input, Skeleton } from '@core/ui'
import { studentApi, type ApiMessage } from '../api'
import { relativeTime } from '@core/utils/date'
import { ROUTES } from '@router/routes'
import { useSound } from '@core/hooks/useSound'
import { cn } from '@core/utils'

function dayKey(ts: string) {
  return new Date(ts).toDateString()
}

function dayLabel(ts: string) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

interface ChatRow {
  message: ApiMessage
  isMine: boolean
  firstInGroup: boolean
  lastInGroup: boolean
  showDay: boolean
}

function buildRows(messages: ApiMessage[]): ChatRow[] {
  return messages.map((message, i) => {
    const prev = messages[i - 1]
    const next = messages[i + 1]
    const sameAsPrev = Boolean(prev && prev.from === message.from && dayKey(prev.timestamp) === dayKey(message.timestamp))
    const sameAsNext = Boolean(next && next.from === message.from && dayKey(next.timestamp) === dayKey(message.timestamp))
    return {
      message,
      isMine: message.from === 'me',
      firstInGroup: !sameAsPrev,
      lastInGroup: !sameAsNext,
      showDay: !prev || dayKey(prev.timestamp) !== dayKey(message.timestamp),
    }
  })
}

export default function MessagesPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [older, setOlder] = useState<ApiMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const messageListRef = useRef<HTMLDivElement>(null)
  const { play } = useSound()

  const { data: classroom } = useQuery({
    queryKey: ['student', 'classroom', id],
    queryFn: () => studentApi.getClassroom(id),
    enabled: Boolean(id),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'messages', id],
    queryFn: () => studentApi.getMessages(id),
    enabled: Boolean(id),
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (data?.meta) setHasMore(Boolean(data.meta.has_more))
  }, [data])

  const loadOlder = useMutation({
    mutationFn: () => {
      const oldestVisible = older[0] ?? data?.data[0]
      const beforeId = oldestVisible?.id
      return studentApi.getMessages(id, beforeId)
    },
    onSuccess: (result) => {
      setOlder((prev) => [...result.data, ...prev])
      setHasMore(Boolean(result.meta?.has_more))
    },
  })

  const send = useMutation({
    mutationFn: () => {
      const recipientId = classroom?.trainer_id
      if (!recipientId) throw new Error('No trainer assigned to this classroom yet.')
      return studentApi.sendMessage(id, draft.trim(), recipientId)
    },
    onMutate: () => play('tap'),
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey: ['student', 'messages', id] })
    },
    onError: () => play('error'),
  })

  const allMessages = [...older, ...(data?.data ?? [])]
  const rows = useMemo(() => buildRows(allMessages), [allMessages])

  useEffect(() => {
    const list = messageListRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [data?.data])

  const trainerName = allMessages.find((m) => m.from === 'other')?.sender_name ?? 'Your trainer'

  return (
    <AppShell>
      <div className="page-container py-5 sm:py-7">
        <section className="mx-auto flex h-[calc(100dvh-9rem)] max-w-7xl flex-col overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-card dark:border-white/10 dark:bg-surface-card">
          <header className="flex min-h-20 items-center gap-4 bg-brand-blue px-4 py-4 text-white sm:px-6">
            <Link
              to={ROUTES.student.messagesHub}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white no-underline transition-colors duration-150 hover:bg-white/25 hover:no-underline"
              aria-label="Back to conversations"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
            <Avatar name={trainerName} role="teacher" size="md" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-xl font-extrabold text-white">{trainerName}</h1>
              <p className="truncate text-xs font-semibold text-white/75">{classroom?.name ?? 'Classroom conversation'}</p>
            </div>
          </header>

          <div ref={messageListRef} className="relative flex-1 overflow-y-auto bg-surface-paper p-4 sm:px-8 sm:py-6 dark:bg-surface-deep" aria-live="polite">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" />
            <div className="relative flex min-h-full flex-col justify-end">
              {hasMore && !isLoading && (
                <button
                  type="button"
                  onClick={() => loadOlder.mutate()}
                  disabled={loadOlder.isPending}
                  className="mx-auto mb-4 inline-flex items-center gap-2 self-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600 shadow-soft transition-colors duration-150 hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:bg-surface-raised dark:text-neutral-300"
                >
                  <ChevronUp size={14} aria-hidden="true" />
                  {loadOlder.isPending ? 'Loading...' : 'Load earlier messages'}
                </button>
              )}

              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((index) => <Skeleton.Line key={index} height={58} />)}
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                  <IllustrationPlaceholder variant="messages" className="h-36 w-52 rounded-2xl" />
                  <p className="max-w-xs font-display text-base font-bold text-neutral-700 dark:text-neutral-300">
                    No messages yet. Start the conversation with your trainer.
                  </p>
                </div>
              ) : (
                rows.map(({ message, isMine, firstInGroup, lastInGroup, showDay }) => (
                  <div key={message.id}>
                    {showDay && (
                      <div className="my-4 flex justify-center">
                        <span className="rounded-full bg-neutral-200/70 px-3 py-1 text-[11px] font-bold text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
                          {dayLabel(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className={cn('flex items-end gap-2', firstInGroup ? 'mt-3' : 'mt-0.5', isMine && 'flex-row-reverse')}>
                      {/* Avatar only for the trainer, once per group */}
                      {!isMine && (
                        lastInGroup
                          ? <Avatar name={message.sender_name} role="teacher" size="sm" />
                          : <span className="size-8 shrink-0" aria-hidden="true" />
                      )}
                      <div className={cn('flex max-w-[82%] flex-col sm:max-w-[68%]', isMine ? 'items-end' : 'items-start')}>
                        <div
                          className={cn(
                            'px-4 py-2.5 text-sm font-medium leading-6 shadow-sm',
                            isMine
                              ? 'rounded-2xl bg-brand-blue text-white'
                              : 'rounded-2xl border border-neutral-200 bg-white text-neutral-800 dark:border-white/10 dark:bg-surface-raised dark:text-neutral-100',
                            isMine && !firstInGroup && 'rounded-tr-md',
                            isMine && !lastInGroup && 'rounded-br-md',
                            isMine && lastInGroup && 'rounded-br-sm',
                            !isMine && !firstInGroup && 'rounded-tl-md',
                            !isMine && !lastInGroup && 'rounded-bl-md',
                            !isMine && lastInGroup && 'rounded-bl-sm',
                          )}
                        >
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
            className="flex shrink-0 gap-3 border-t border-neutral-100 bg-white p-4 sm:px-8 sm:py-5 dark:border-white/10 dark:bg-surface-card"
            onSubmit={(event) => {
              event.preventDefault()
              if (draft.trim()) send.mutate()
            }}
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={classroom?.trainer_id ? 'Escribe un mensaje…' : 'No trainer assigned yet'}
              fullWidth
              disabled={!classroom?.trainer_id || send.isPending}
              aria-label="Message"
            />
            <Button
              type="submit"
              loading={send.isPending}
              disabled={!draft.trim() || !classroom?.trainer_id}
              size="md"
              aria-label="Send message"
              className="!size-10 !px-0"
            >
              <Send size={16} aria-hidden="true" />
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
