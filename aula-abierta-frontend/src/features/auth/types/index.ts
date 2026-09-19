export interface LoginCredentials {
  sis_id: string
  password: string
}

export interface LoginResponse {
  data: {
    user: {
      id: number
      sis_id: string
      name: string
      role: string
      avatar_url?: string
      has_signed_nda?: boolean
      preferences: import('@core/auth/types').UserPreferences
    }
    access_token: string
    refresh_token: string
  }
}
