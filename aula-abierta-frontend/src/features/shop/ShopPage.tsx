import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Coins, Shuffle, Sparkles, RotateCcw, ShoppingBag } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { CountUp, staggerContainer } from '@core/motion'
import { AvatarOwl, usePlayerStore, COSMETICS, SLOTS } from '@core/play'
import { useAuth } from '@core/auth/useAuth'
import { useSound } from '@core/hooks/useSound'
import { cn } from '@core/utils'
import { CosmeticCard } from './CosmeticCard'
import type { Cosmetic, CosmeticSlot } from '@core/play'

export default function ShopPage() {
  const { user } = useAuth()
  const prefersReduced = useReducedMotion()
  const { play } = useSound()

  useEffect(() => {
    if (user) usePlayerStore.getState().seed(user.id, 250)
  }, [user])

  const uid = String(user?.id ?? '')
  const coins = usePlayerStore((s) => s.byUser[uid]?.coins ?? 0)
  const owned = usePlayerStore((s) => s.byUser[uid]?.owned ?? [])
  const equipped = usePlayerStore((s) => s.byUser[uid]?.equipped ?? {})

  const [activeSlot, setActiveSlot] = useState<CosmeticSlot>('hat')
  const [previewItem, setPreviewItem] = useState<Cosmetic | null>(null)

  if (!user) return null

  const previewEquipped: Record<string, string | null> = { ...equipped }
  if (previewItem) previewEquipped[previewItem.slot] = previewItem.id

  const filtered = COSMETICS.filter((c) => c.slot === activeSlot)
  const ownedCount = owned.length

  const randomize = () => {
    play('focus')
    const store = usePlayerStore.getState()
    for (const { key } of SLOTS) {
      const pool = COSMETICS.filter((c) => c.slot === key && owned.includes(c.id))
      const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
      store.equip(user.id, key, pick ? pick.id : null)
    }
  }

  const resetLook = () => {
    play('tap')
    const store = usePlayerStore.getState()
    for (const { key } of SLOTS) store.equip(user.id, key, null)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-blue"><ShoppingBag size={13} aria-hidden="true" /> Avatar Shop</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-neutral-950 dark:text-white lg:text-4xl">Customize your learning avatar</h1>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-brand-yellow/40 bg-brand-yellow/10 px-4 py-2 shadow-sm">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-yellow shadow-inner"><Coins size={16} className="text-brand-ink" aria-hidden="true" /></span>
            <span className="font-display text-2xl font-extrabold tabular-nums text-brand-ink dark:text-brand-yellow" aria-label={`${coins} coins`}><CountUp value={coins} onView={false} /></span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* ── Character stage ─────────────────────────────────────────────── */}
          <section
            className="relative flex flex-col items-center overflow-hidden rounded-[28px] border-2 border-neutral-900/[0.07] p-6 dark:border-white/10"
            style={{ background: 'radial-gradient(ellipse at 50% 18%, #1D95FB22 0%, transparent 55%), linear-gradient(160deg, #FFF7E6 0%, #F2F6FB 100%)' }}
            aria-label="Avatar preview"
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 dark:bg-surface-deep" style={{ mixBlendMode: 'multiply', opacity: 0 }} />
            {/* Spotlight cone */}
            <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-40 w-56 -translate-x-1/2 bg-white/40 blur-2xl dark:bg-white/[.05]" style={{ clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0 100%)' }} />
            {/* Floating particles */}
            {!prefersReduced && [0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                className="pointer-events-none absolute size-1.5 rounded-full bg-brand-yellow/70"
                style={{ left: `${12 + i * 18}%`, top: `${20 + (i % 3) * 22}%` }}
                animate={{ y: [0, -14, 0], opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 3 + i * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
              />
            ))}

            <div className="relative mt-2 flex flex-col items-center">
              {/* Glowing podium */}
              <span aria-hidden="true" className="absolute bottom-6 left-1/2 h-10 w-56 -translate-x-1/2 rounded-[50%] bg-brand-blue/20 blur-xl" />
              <AvatarOwl userId={user.id} size="hero" previewEquipped={previewEquipped} />
              <span aria-hidden="true" className="-mt-3 h-3 w-48 rounded-[50%] bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent" />
            </div>

            {/* Preview label */}
            <div className="relative mt-2 h-7">
              {previewItem ? (
                <motion.span key={previewItem.id} initial={prefersReduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue/15 px-3 py-1 text-xs font-bold text-brand-blue dark:text-brand-sky">
                  <Sparkles size={12} aria-hidden="true" /> {previewItem.name} · {previewItem.cost} coins
                </motion.span>
              ) : (
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500">{ownedCount} items owned · tap to try them on</span>
              )}
            </div>

            {/* Customizer controls */}
            <div className="relative mt-4 flex gap-2">
              <button type="button" onClick={randomize} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95"><Shuffle size={15} aria-hidden="true" /> Randomize</button>
              <button type="button" onClick={resetLook} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white/70 px-4 text-sm font-bold text-neutral-600 backdrop-blur transition-colors hover:border-brand-red hover:text-brand-red dark:border-white/15 dark:bg-white/10 dark:text-neutral-200"><RotateCcw size={15} aria-hidden="true" /> Reset</button>
            </div>
          </section>

          {/* ── Customizer panel ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <nav aria-label="Cosmetic slots" className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {SLOTS.map(({ key, label }) => {
                const isActive = activeSlot === key
                const slotOwned = COSMETICS.filter((c) => c.slot === key && owned.includes(c.id)).length
                const slotTotal = COSMETICS.filter((c) => c.slot === key).length
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => { setActiveSlot(key); setPreviewItem(null) }}
                    className={cn(
                      'relative flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-2 px-4 py-2 text-sm font-bold transition-colors duration-200',
                      isActive ? 'border-brand-blue bg-brand-blue text-white shadow-md' : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-blue/40 hover:text-brand-blue dark:border-white/10 dark:bg-surface-overlay dark:text-neutral-300',
                    )}
                  >
                    {label}
                    <span className={cn('text-[10px] font-semibold tabular-nums', isActive ? 'text-white/75' : 'text-neutral-400 dark:text-neutral-500')}>{slotOwned}/{slotTotal}</span>
                  </button>
                )
              })}
            </nav>

            <motion.div
              key={activeSlot}
              variants={staggerContainer(0.05, 0.03)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {filtered.map((cosmetic) => (
                <CosmeticCard
                  key={cosmetic.id}
                  cosmetic={cosmetic}
                  userId={user.id}
                  coins={coins}
                  owned={owned}
                  equipped={equipped}
                  onPreviewEnter={setPreviewItem}
                  onPreviewLeave={() => setPreviewItem(null)}
                />
              ))}
            </motion.div>

            <p className="text-center text-xs font-semibold text-neutral-400 dark:text-neutral-500">Earn more coins by completing activities, keeping your streak, and attending classes.</p>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
