import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'

const initialTheme = localStorage.getItem('aula_theme') ?? 'system'
const isDark = initialTheme === 'dark'
  || (initialTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
document.documentElement.classList.toggle('dark', isDark)

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the service worker for installability + offline (production only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
