import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Volume2, VolumeX, X } from 'lucide-react'
import { useSound } from '@core/hooks/useSound'
import { cn } from '@core/utils'
import { Mascot } from '../Mascot'

interface MascotGuideProps {
  messages: string[]
  compact?: boolean
}

export function MascotGuide({ messages, compact = false }: MascotGuideProps) {
  const [open, setOpen] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const { isEnabled, play, toggle } = useSound()

  const toggleGuide = () => {
    setOpen((current) => !current)
    setMessageIndex((current) => (current + 1) % Math.max(messages.length, 1))
    play('focus')
  }

  return (
    <div className={cn('relative', compact ? 'w-18 sm:w-20' : 'w-24')}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-[calc(100%+12px)] right-0 z-20 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-card"
            role="status"
          >
            <div className="flex items-center gap-3 bg-brand-red px-4 py-3 text-white">
              <span className="flex size-8 items-center justify-center rounded-xl bg-white/15">
                <MessageCircle size={16} aria-hidden="true" />
              </span>
              <div className="flex-1">
                <p className="text-xs font-bold text-brand-yellow">LEARNING GUIDE</p>
                <p className="text-sm font-bold text-white">A quick learning tip</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white/75 transition-colors duration-150 hover:bg-white/15 hover:text-white"
                aria-label="Close guide tip"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
            <p className="p-4 text-sm font-semibold leading-6 text-neutral-700 text-pretty">
              {messages[messageIndex] ?? 'Keep discovering.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggleGuide}
        whileTap={{ scale: 0.96 }}
        className="group relative flex aspect-square w-full items-end justify-center rounded-[22px] border-2 border-white bg-brand-cream shadow-card transition-transform duration-150 hover:-translate-y-1 focus-visible:ring-brand-red motion-reduce:hover:translate-y-0"
        aria-label={open ? 'Hide guide tip' : 'Ask the Aula Abierta illustration'}
        aria-expanded={open}
      >
        <Mascot mood={open ? 'cheer' : 'idle'} size="lg" className="h-[112%] w-[112%]" />
        <span className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-brand-red text-white shadow-soft">
          <MessageCircle size={12} aria-hidden="true" />
        </span>
      </motion.button>

      <button
        type="button"
        onClick={() => toggle()}
        className="absolute -bottom-1 -left-1 flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-soft transition-colors duration-150 hover:text-brand-blue"
        aria-label={isEnabled ? 'Turn interface sounds off' : 'Turn interface sounds on'}
        aria-pressed={isEnabled}
      >
        {isEnabled ? <Volume2 size={14} aria-hidden="true" /> : <VolumeX size={14} aria-hidden="true" />}
      </button>
    </div>
  )
}
