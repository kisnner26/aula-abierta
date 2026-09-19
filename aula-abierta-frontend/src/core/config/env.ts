const apiBaseUrl = import.meta.env['VITE_API_BASE_URL'] as string | undefined
const appName = import.meta.env['VITE_APP_NAME'] as string | undefined

export const env = {
  apiBaseUrl: apiBaseUrl ?? 'http://localhost:8000/api/v1',
  appName:    appName ?? 'Aula Abierta',
} as const
