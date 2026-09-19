import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { create } from 'zustand'
import { playSound } from '@core/hooks/useSound'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }))
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(type: ToastType, message: string, duration = 4000) {
  useToastStore.getState().add({ type, message, duration })
  playSound(type === 'success' ? 'success' : type === 'error' ? 'error' : 'message')
}
toast.success = (msg: string) => toast('success', msg)
toast.error   = (msg: string) => toast('error', msg)
toast.warning = (msg: string) => toast('warning', msg)
toast.info    = (msg: string) => toast('info', msg)

const toastConfig: Record<ToastType, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2,    classes: 'bg-green-50 border-green-200 text-green-800' },
  error:   { icon: XCircle,         classes: 'bg-red-50 border-brand-red/30 text-brand-red' },
  warning: { icon: AlertTriangle,   classes: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
  info:    { icon: Info,            classes: 'bg-brand-sky/40 border-brand-sky text-blue-800' },
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove)
  const { icon: Icon, classes } = toastConfig[t.type]

  const dismiss = useCallback(() => remove(t.id), [remove, t.id])

  useEffect(() => {
    const timer = setTimeout(dismiss, t.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [dismiss, t.duration])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-card border shadow-card',
        'min-w-72 max-w-sm w-full text-sm font-medium',
        classes,
      ].join(' ')}
      role="alert"
    >
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span className="flex-1 leading-snug">{t.message}</span>
      <button onClick={dismiss} className="shrink-0 opacity-60 transition-opacity duration-150 hover:opacity-100" aria-label="Dismiss notification">
        <X size={14} aria-hidden="true" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return createPortal(
    <div
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
