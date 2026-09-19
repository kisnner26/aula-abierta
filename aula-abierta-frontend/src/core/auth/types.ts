import type { Role } from '../types/roles'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface UserPreferences {
  theme: ThemePreference
  keep_signed_in: boolean
  notification_messages: boolean
  notification_tasks: boolean
  notification_grades: boolean
}

export interface AuthUser {
  id: number
  sis_id: string
  name: string
  role: Role
  avatar_url?: string
  has_signed_nda?: boolean
  preferences: UserPreferences
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}
