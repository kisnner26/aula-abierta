import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { env } from '../config/env'

const TOKEN_KEY         = 'aula_access_token'
const REFRESH_TOKEN_KEY = 'aula_refresh_token'

export function getRefreshToken(): string | null { return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY) }

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function storeTokens(access: string, refresh: string, persistent = true): void {
  const destination = persistent ? localStorage : sessionStorage
  const stale = persistent ? sessionStorage : localStorage
  destination.setItem(TOKEN_KEY, access)
  destination.setItem(REFRESH_TOKEN_KEY, refresh)
  stale.removeItem(TOKEN_KEY)
  stale.removeItem(REFRESH_TOKEN_KEY)
  localStorage.setItem('aula_keep_session', persistent ? 'on' : 'off')
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function setSessionPersistence(persistent: boolean): void {
  const access = getAccessToken()
  const refresh = getRefreshToken()
  if (access && refresh) storeTokens(access, refresh, persistent)

  const source = persistent ? sessionStorage : localStorage
  const destination = persistent ? localStorage : sessionStorage
  const authState = source.getItem('aula_auth')
  if (authState) destination.setItem('aula_auth', authState)
  source.removeItem('aula_auth')
  localStorage.setItem('aula_keep_session', persistent ? 'on' : 'off')
}

let isRefreshing = false
let queue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  queue.forEach((p) => (token ? p.resolve(token) : p.reject(error)))
  queue = []
}

export function attachInterceptors(client: AxiosInstance, onForceLogout: () => void): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error)
      }

      const refresh = getRefreshToken()
      if (!refresh) {
        onForceLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers['Authorization'] = `Bearer ${token}`
              resolve(client(original))
            },
            reject,
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${env.apiBaseUrl}/auth/refresh`, {
          refresh_token: refresh,
        })
        const newAccess: string = data.data.access_token
        const newRefresh: string = data.data.refresh_token
        storeTokens(newAccess, newRefresh, localStorage.getItem('aula_keep_session') !== 'off')
        processQueue(null, newAccess)
        original.headers['Authorization'] = `Bearer ${newAccess}`
        return client(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        onForceLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    },
  )
}
