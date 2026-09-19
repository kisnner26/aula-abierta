import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from '@core/ui'
import type { Week } from '@core/types/models'

interface PresentationModeProps {
  open: boolean
  onClose: () => void
  week: Week
}

type PresentationSlide = {
  eyebrow: string
  title: string
  body: string
  url?: string
}

export function PresentationMode({ open, onClose, week }: PresentationModeProps) {
  const [index, setIndex] = useState(0)
  const words = useMemo(() => (week.vocabulary ?? '').split(',').map((pair) => pair.trim().split(':')[0]).filter(Boolean), [week.vocabulary])
  const slides: PresentationSlide[] = [
    { eyebrow: `WEEK ${week.number}`, title: week.title, body: 'Today we learn by playing, speaking, and discovering.' },
    { eyebrow: 'WORD LAB', title: 'Vocabulary', body: words.join('  ·  ') || 'Vocabulary will appear here when coordination publishes it.' },
    ...week.tasks.map((task) => ({ eyebrow: 'CLASS ACTIVITY', title: task.title, body: task.description })),
    ...week.materials.filter((material) => material.type === 'slide' && material.external_url).map((material) => ({ eyebrow: 'WEEK SLIDES', title: material.title, body: '', url: material.external_url! })),
  ]

  useEffect(() => {
    if (!open) return
    setIndex(0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(slides.length - 1, current + 1))
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, slides.length])

  const slide = slides[index] ?? slides[0]!

  return (
    <Modal open={open} onClose={onClose} title={`Presentation · ${week.title}`} size="full" closeOnOverlayClick={false}>
      <div className="relative flex min-h-[68dvh] flex-col overflow-hidden rounded-2xl bg-brand-blue p-8 text-white sm:p-12">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-yellow" aria-hidden="true" />
        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <p className="text-sm font-extrabold text-brand-yellow">{slide.eyebrow}</p>
          <h2 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-tight text-white text-balance sm:text-6xl">{slide.title}</h2>
          {slide.url ? <iframe src={slide.url} title={slide.title} className="mt-6 aspect-video w-full max-w-5xl rounded-xl border-0 bg-white" allowFullScreen /> : <p className="mt-6 max-w-4xl text-xl font-semibold leading-relaxed text-white/85 text-pretty sm:text-2xl">{slide.body}</p>}
        </div>
        <div className="relative z-10 mt-8 flex items-center justify-between gap-4">
          <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0} className="flex size-12 items-center justify-center rounded-xl bg-white text-brand-blue disabled:opacity-40" aria-label="Previous slide"><ChevronLeft aria-hidden="true" /></button>
          <p className="rounded-full bg-neutral-900/35 px-4 py-2 text-sm font-bold tabular-nums">{index + 1} / {slides.length}</p>
          <button type="button" onClick={() => setIndex((current) => Math.min(slides.length - 1, current + 1))} disabled={index === slides.length - 1} className="flex size-12 items-center justify-center rounded-xl bg-white text-brand-blue disabled:opacity-40" aria-label="Next slide"><ChevronRight aria-hidden="true" /></button>
        </div>
      </div>
    </Modal>
  )
}
