import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, CheckCheck, ClipboardCheck, Clock3, GraduationCap, MessageCircle, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { notificationQueryKey, notificationsApi } from '@core/api/notifications'
import { relativeTime } from '@core/utils/date'
import { cn } from '@core/utils'
import type { NotificationType } from '@core/types/notification'
import type { UserNotification } from '@core/types/notification'
import type { LucideIcon } from 'lucide-react'
import { IllustrationPlaceholder } from '../IllustrationPlaceholder'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  userId: number
}

const icons: Record<string, LucideIcon> = {
  message: MessageCircle,
  grade: GraduationCap,
  task: Clock3,
  submission: ClipboardCheck,
}

export function NotificationPanel({ open, onClose, userId }: NotificationPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const queryClient = useQueryClient()
  const queryKey = notificationQueryKey(userId)
  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: notificationsApi.list,
    enabled: open,
    refetchInterval: open ? 20_000 : false,
  })

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  const dismiss = useMutation({
    mutationFn: notificationsApi.dismiss,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<UserNotification[]>(queryKey)
      queryClient.setQueryData<UserNotification[]>(queryKey, (old = []) =>
        old.filter((n) => n.id !== notificationId),
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
  })
  const dismissAll = useMutation({
    mutationFn: notificationsApi.dismissAll,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<UserNotification[]>(queryKey)
      queryClient.setQueryData<UserNotification[]>(queryKey, [])
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
  })

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const hasUnread = notifications.some((n) => !n.read_at)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-neutral-900/20"
            aria-label="Close notifications"
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-x-3 top-16 z-40 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-card sm:left-auto sm:right-5 sm:w-[430px]"
            aria-label="Notifications"
          >
            <div className="relative h-24 overflow-hidden bg-brand-blue">
              <IllustrationPlaceholder variant="notifications" size="scene" className="absolute inset-0 size-full" />
              <div className="absolute inset-0 bg-brand-blue/20" aria-hidden="true" />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-xl bg-white text-neutral-700 shadow-soft"
                aria-label="Close notifications"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div>
                <p className="text-xs font-bold text-brand-red">WHAT'S NEW</p>
                <h2 className="mt-1 font-display text-xl font-extrabold text-neutral-900">Notifications</h2>
              </div>
              <div className="flex items-center gap-2">
                {hasUnread && (
                  <button
                    type="button"
                    onClick={() => markAll.mutate()}
                    disabled={markAll.isPending}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand-cream px-3 text-xs font-bold text-brand-red transition-colors duration-150 hover:bg-brand-yellow disabled:opacity-50"
                  >
                    <CheckCheck size={14} aria-hidden="true" /> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => dismissAll.mutate()}
                    disabled={dismissAll.isPending}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-500 transition-colors duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    aria-label="Clear all notifications"
                  >
                    <Trash2 size={13} aria-hidden="true" /> Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[430px] overflow-y-auto p-3 scrollbar-thin" aria-live="polite">
              {isLoading ? (
                <div className="flex flex-col gap-2 p-2">
                  {[0, 1, 2].map((index) => <div key={index} className="h-20 animate-pulse rounded-[16px] bg-neutral-100" />)}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-sky/30 text-brand-blue">
                    <BellRing size={21} aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-display text-lg font-extrabold text-neutral-900">All clear</p>
                  <p className="mt-1 text-sm font-medium text-neutral-500">New messages, grades, and reminders will appear here.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {notifications.map((notification) => {
                    const Icon = icons[notification.type as NotificationType] ?? BellRing
                    const isDismissing = dismiss.isPending && dismiss.variables === notification.id
                    const content = (
                      <>
                        <span className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                          notification.read_at ? 'bg-neutral-100 text-neutral-500' : 'bg-brand-sky/30 text-brand-blue',
                        )}>
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold leading-5 text-neutral-800">{notification.title}</span>
                          <span className="mt-1 line-clamp-2 block text-xs font-medium leading-5 text-neutral-500">{notification.body}</span>
                          <span className="mt-1 block text-[11px] font-semibold text-neutral-400">{relativeTime(notification.created_at)}</span>
                        </span>
                        {!notification.read_at && <span className="mt-2 mr-5 size-2 shrink-0 self-start rounded-full bg-brand-red" aria-label="Unread" />}
                      </>
                    )

                    return (
                      <li
                        key={notification.id}
                        className={cn(
                          'group relative transition-opacity duration-150',
                          isDismissing && 'opacity-40 pointer-events-none',
                        )}
                      >
                        {notification.action_url ? (
                          <Link
                            to={notification.action_url}
                            onClick={() => {
                              if (!notification.read_at) markRead.mutate(notification.id)
                              onClose()
                            }}
                            className="flex items-start gap-3 rounded-[18px] border border-transparent p-3 pr-9 text-neutral-900 no-underline transition duration-150 hover:-translate-y-0.5 hover:border-neutral-200 hover:bg-neutral-50 hover:no-underline motion-reduce:hover:translate-y-0"
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => !notification.read_at && markRead.mutate(notification.id)}
                            className="flex w-full items-start gap-3 rounded-[18px] border border-transparent p-3 pr-9 text-left transition-colors duration-150 hover:border-neutral-200 hover:bg-neutral-50"
                          >
                            {content}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            dismiss.mutate(notification.id)
                          }}
                          disabled={isDismissing}
                          className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 opacity-0 transition-all duration-150 hover:bg-red-100 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:bg-neutral-700 dark:text-neutral-300"
                          aria-label="Dismiss notification"
                        >
                          <X size={11} strokeWidth={2.5} aria-hidden="true" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
