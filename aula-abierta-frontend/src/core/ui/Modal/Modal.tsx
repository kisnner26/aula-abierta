import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '../Button'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  children: ReactNode
  footer?: ReactNode
  closeOnOverlayClick?: boolean
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
  full: 'max-w-none h-[calc(100dvh-2rem)]',
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement as HTMLElement | null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      document.body.style.overflow = prev
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-neutral-900/55"
            onClick={closeOnOverlayClick ? onClose : undefined}
            aria-hidden
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={[
              'relative z-10 flex max-h-[90dvh] w-full flex-col rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-white/10 dark:bg-surface-card',
              sizeClasses[size],
            ].join(' ')}
          >
            {title && (
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-6 py-5 dark:border-white/10">
                <h2 id="modal-title" className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">
                  {title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close"
                  className="!px-2"
                >
                  <X size={16} aria-hidden="true" />
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">{children}</div>

            {footer && (
              <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-white/10 dark:bg-white/[.03]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
