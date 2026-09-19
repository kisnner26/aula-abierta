import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@core/api/interceptors'
import { env } from '@core/config/env'
import { useAuth } from '@core/auth/useAuth'

const SSE_BASE = env.apiBaseUrl + '/events/stream'

interface SseMessageEvent extends MessageEvent {
  readonly lastEventId: string
}

export function useRealtimeEvents() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const esRef = useRef<EventSource | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCursorRef = useRef('0:0:0:0:0:0')

  useEffect(() => {
    if (!user) return

    let alive = true

    function clearPendingReconnect() {
      if (reconnectRef.current !== null) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
    }

    function connect() {
      if (!alive || document.hidden) return

      clearPendingReconnect()

      const token = getAccessToken()
      if (!token) return

      const url = new URL(SSE_BASE)
      url.searchParams.set('token', token)
      url.searchParams.set('cursor', lastCursorRef.current)

      const es = new EventSource(url.toString())
      esRef.current = es

      function trackCursor(e: SseMessageEvent) {
        if (e.lastEventId) lastCursorRef.current = e.lastEventId
      }

      es.addEventListener('notification', (raw) => {
        const e = raw as SseMessageEvent
        trackCursor(e)
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      })

      es.addEventListener('message', (raw) => {
        const e = raw as SseMessageEvent
        trackCursor(e)
        const data = JSON.parse(e.data) as { classroomId: number }
        queryClient.invalidateQueries({ queryKey: ['student', 'messages', data.classroomId] })
        queryClient.invalidateQueries({ queryKey: ['trainer', 'classroom', data.classroomId, 'messages'] })
        // Also refresh the messages hub unread state
        queryClient.invalidateQueries({ queryKey: ['student', 'classrooms'] })
      })

      es.addEventListener('submission', (raw) => {
        const e = raw as SseMessageEvent
        trackCursor(e)
        const data = JSON.parse(e.data) as { classroomId: number }
        queryClient.invalidateQueries({ queryKey: ['trainer', 'classroom', data.classroomId, 'submissions'] })
        queryClient.invalidateQueries({ queryKey: ['trainer', 'classroom', data.classroomId, 'submissions', 'pending'] })
        queryClient.invalidateQueries({ queryKey: ['trainer', 'classrooms'] })
      })

      es.addEventListener('grade', (raw) => {
        const e = raw as SseMessageEvent
        trackCursor(e)
        queryClient.invalidateQueries({ queryKey: ['student', 'grades'] })
        queryClient.invalidateQueries({ queryKey: ['student', 'tasks', 'upcoming'] })
      })

      es.addEventListener('session', (raw) => {
        const e = raw as SseMessageEvent
        trackCursor(e)
        const data = JSON.parse(e.data) as { classroomId: number }
        queryClient.invalidateQueries({ queryKey: ['student', 'classroom', data.classroomId, 'journey'] })
        queryClient.invalidateQueries({ queryKey: ['trainer', 'classroom', data.classroomId, 'weeks'] })
        queryClient.invalidateQueries({ queryKey: ['trainer', 'classroom', data.classroomId] })
      })

      // ── Arena: new question revealed (student sees it instantly) ──
      es.addEventListener('quiz_question', (raw) => {
        const e = raw as SseMessageEvent
        trackCursor(e)
        queryClient.invalidateQueries({ queryKey: ['student', 'quiz', 'active'] })
      })

      // ── Arena: quiz ended (student sees podium) ───────────────────
      es.addEventListener('quiz_ended', (raw) => {
        const e = raw as SseMessageEvent
        trackCursor(e)
        queryClient.invalidateQueries({ queryKey: ['student', 'quiz', 'active'] })
      })

      // ── Arena: leaderboard update (teacher sees live scores) ──────
      es.addEventListener('quiz_leaderboard', (raw) => {
        const e = raw as SseMessageEvent
        trackCursor(e)
        const data = JSON.parse(e.data) as { quizId: number }
        queryClient.invalidateQueries({ queryKey: ['trainer', 'quiz', data.quizId, 'state'] })
      })

      es.onerror = () => {
        es.close()
        esRef.current = null
        if (!alive) return
        reconnectRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    function onVisibilityChange() {
      if (document.hidden) return
      const es = esRef.current
      if (!es || es.readyState === EventSource.CLOSED) {
        connect()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      alive = false
      clearPendingReconnect()
      esRef.current?.close()
      esRef.current = null
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user?.id, queryClient])
}
