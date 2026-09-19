import { apiClient } from '@core/api'
import type { AuthUser, UserPreferences } from '@core/auth/types'

export const profileApi = {
  get: () => apiClient.get<{ data: AuthUser }>('/profile').then((response) => response.data.data),
  update: (payload: { name: string; preferences: UserPreferences }) => (
    apiClient.patch<{ data: AuthUser }>('/profile', payload).then((response) => response.data.data)
  ),
  updateAvatar: (avatar: File) => {
    const formData = new FormData()
    formData.append('avatar', avatar)
    return apiClient.post<{ data: AuthUser }>('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((response) => response.data.data)
  },
  removeAvatar: () => apiClient.delete<{ data: AuthUser }>('/profile/avatar').then((response) => response.data.data),
}
