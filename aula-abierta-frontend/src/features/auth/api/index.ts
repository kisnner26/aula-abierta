import { apiClient, EP } from '@core/api'
import type { LoginCredentials, LoginResponse } from '../types'

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(EP.auth.login, credentials)
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post(EP.auth.logout)
}
