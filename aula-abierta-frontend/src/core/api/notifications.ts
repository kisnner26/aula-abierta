import { apiClient } from './client'
import type { UserNotification } from '@core/types/notification'

export const notificationQueryKey = (userId: number | null | undefined) => ['notifications', userId ?? 'guest'] as const

export const notificationsApi = {
  list: () => apiClient.get<{ data: UserNotification[] }>('/notifications').then((response) => response.data.data),
  markRead: (notificationId: number) => apiClient.post<{ data: UserNotification }>(`/notifications/${notificationId}/read`).then((response) => response.data.data),
  markAllRead: () => apiClient.post<{ data: { updated: number } }>('/notifications/read-all').then((response) => response.data.data),
  dismiss: (notificationId: number) => apiClient.delete<{ data: { deleted: boolean } }>(`/notifications/${notificationId}`).then((response) => response.data.data),
  dismissAll: () => apiClient.delete<{ data: { deleted: number } }>('/notifications/all').then((response) => response.data.data),
}
