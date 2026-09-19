import { apiClient } from '@core/api'
import type { User, AuditLog } from '@core/types/models'
import type { PaginatedResponse } from '@core/types/api'

export const adminApi = {
  getUsers: (params?: { role?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data),

  createUser: (payload: Partial<User> & { password: string }) =>
    apiClient.post<{ data: User }>('/users', payload).then((r) => r.data.data),

  updateUser: (id: number, payload: Partial<User> & { password?: string }) =>
    apiClient.put<{ data: User }>(`/users/${id}`, payload).then((r) => r.data.data),

  deleteUser: (id: number) =>
    apiClient.delete(`/users/${id}`),

  bulkImport: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient.post<{ data: { created: number; errors: string[] } }>('/users/bulk-import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data)
  },

  getAuditLogs: (params?: {
    page?: number
    user_id?: number
    entity_type?: string
    category?: string
    action?: string
    date_from?: string
    date_to?: string
    sort?: 'asc' | 'desc'
  }) =>
    apiClient.get<PaginatedResponse<AuditLog>>('/audit-logs', { params }).then((r) => r.data),

  getMetrics: () =>
    apiClient.get<{ data: {
      active_groups: number
      task_completion_rate: number
      total_users: number
      activity_by_group: { classroom_name: string; activity_count: number }[]
    } }>('/admin/metrics').then((r) => r.data.data),
}
