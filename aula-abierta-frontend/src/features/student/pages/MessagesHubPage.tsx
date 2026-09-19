import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, MessagesSquare } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { EmptyState, SectionHeader, Skeleton, WorkspaceHero } from '@core/ui'
import { studentApi } from '../api'
import { ROUTES } from '@router/routes'
import { relativeTime } from '@core/utils/date'
import { useSound } from '@core/hooks/useSound'

export default function MessagesHubPage() {
  const { play } = useSound()
  const { data: inbox, isLoading } = useQuery({
    queryKey: ['student', 'inbox'],
    queryFn: studentApi.getInbox,
  })

  const conversations = inbox ?? []

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="STAY CONNECTED"
          title="Messages"
          description="Ask a question, share an update, or continue a conversation with your trainer."
          image="placeholder"
          imageAlt="Aula Abierta illustration sending a classroom message"
          tone="blue"
          imagePosition="object-[48%_center]"
        />

        <section aria-labelledby="conversations-title">
          <SectionHeader eyebrow="YOUR INBOX" title="Classroom conversations" titleId="conversations-title" action={(
            <span className="rounded-full bg-brand-cream px-3 py-1.5 text-xs font-bold tabular-nums text-brand-red">
              {conversations.length} {conversations.length === 1 ? 'classroom' : 'classrooms'}
            </span>
          )} />

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1].map((index) => <Skeleton.Card key={index} />)}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare size={23} />}
              title="No trainer conversations yet"
              description="Once a trainer is assigned to your classroom, the conversation will open here."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {conversations.map(({ classroom, latest_message: latest, unread_count: unread }) => {

                return (
                  <Link
                    key={classroom.id}
                    to={ROUTES.student.messages(classroom.id)}
                    onClick={() => play('message')}
                    className="group flex min-h-40 flex-col justify-between rounded-[24px] border border-neutral-200 bg-white p-5 text-neutral-900 no-underline shadow-soft transition duration-150 hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-card hover:no-underline motion-reduce:hover:translate-y-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-sky/35 text-brand-blue">
                        <MessageCircle size={21} aria-hidden="true" />
                      </span>
                      {unread > 0 && (
                        <span className="flex min-w-7 items-center justify-center rounded-full bg-brand-red px-2 py-1 text-xs font-extrabold tabular-nums text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 min-w-0">
                      <h3 className="truncate font-display text-xl font-extrabold text-neutral-900 group-hover:text-brand-blue">
                        {classroom.name}
                      </h3>
                      <p className="mt-1 truncate text-sm font-medium text-neutral-500">
                        {latest?.body ?? 'Start your first conversation.'}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-neutral-400">
                          {latest ? relativeTime(latest.timestamp) : classroom.academic_period}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-brand-blue">
                          Open chat <ArrowRight size={14} aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
