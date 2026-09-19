export type NotificationType = 'message' | 'grade' | 'task' | 'submission' | string

export interface UserNotification {
  id: number
  type: NotificationType
  title: string
  body: string
  action_url: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}
