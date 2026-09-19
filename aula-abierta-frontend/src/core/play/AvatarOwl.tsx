import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { usePlayerStore } from './playerStore'
import { cosmeticById, type Cosmetic, type CosmeticSlot } from './cosmetics'
import { cn } from '@core/utils'
import { Mascot } from '@core/ui/Mascot'

type AvatarOwlSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'

interface AvatarOwlProps {
  userId: string | number
  size?: AvatarOwlSize
  className?: string
  /** Override equipped items (used by the shop live preview). */
  previewEquipped?: Record<string, string | null>
}

// Box pixel size per variant. Cosmetics scale off this so everything stays
// proportional and "stuck" to the avatar at any size.
const BOX: Record<AvatarOwlSize, number> = { sm: 64, md: 100, lg: 150, xl: 220, hero: 300 }

export function AvatarOwl({ userId, size = 'md', className, previewEquipped }: AvatarOwlProps) {
  const prefersReduced = useReducedMotion()
  const stored = usePlayerStore((s) => s.byUser[String(userId)]?.equipped)
  const equipped = previewEquipped ?? stored ?? {}
  const S = BOX[size]

  const item = (slot: CosmeticSlot) => cosmeticById(equipped[slot])
  const backdrop = item('backdrop')
  const aura = item('aura')
  const hat = item('hat')
  const eyewear = item('eyewear')
  const neckwear = item('neckwear')
  const companion = item('companion')

  // The whole character (avatar + worn cosmetics) floats together so accessories
  // stay glued to the avatar. Backdrop/aura/ground are separate effect layers.
  const float = prefersReduced ? undefined : { y: [0, -S * 0.025, 0], rotate: [-1, 1, -1] }
  const floatTransition = { duration: 5, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <div className={cn('relative select-none', className)} style={{ width: S, height: S }} aria-hidden="true">
      {/* Backdrop scene */}
      {backdrop && (
        <span
          className="absolute rounded-full"
          style={{
            inset: -S * 0.06,
            background: `radial-gradient(circle at 50% 38%, ${backdrop.hex}66 0%, ${backdrop.hex}22 45%, transparent 72%)`,
          }}
        />
      )}

      {/* Aura glow + orbiting spark */}
      {aura && (
        <>
          <span className="absolute rounded-full opacity-70 blur-2xl" style={{ inset: S * 0.08, background: aura.hex }} />
          {!prefersReduced && (
            <motion.span
              className="absolute"
              style={{ left: '50%', top: '46%', width: S * 0.92, height: S * 0.92, marginLeft: -S * 0.46, marginTop: -S * 0.46 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
            >
              <aura.icon size={S * 0.16} color={aura.hex} style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -S * 0.08 }} />
            </motion.span>
          )}
        </>
      )}

      {/* Ground shadow */}
      <span className="absolute rounded-[50%] bg-brand-ink/25 blur-md dark:bg-black/50" style={{ width: S * 0.46, height: S * 0.07, left: '50%', marginLeft: -S * 0.23, bottom: S * 0.02 }} />

      {/* ── Floating character ─────────────────────────────────────────────── */}
      <motion.div className="absolute inset-0" animate={float} transition={floatTransition}>
        <Mascot size="xl" className="absolute inset-0 size-full drop-shadow-[0_8px_14px_rgba(37,53,74,0.18)]" />

        {/* Neckwear — a band across the chest, with the item as a centerpiece */}
        {neckwear && (
          <>
            <span
              className="absolute rounded-full"
              style={{ left: '44%', top: '40%', width: S * 0.52, height: S * 0.085, marginLeft: -(S * 0.52) / 2, background: neckwear.hex, transform: 'rotate(-3deg)', boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.25)' }}
            />
            <span
              className="absolute flex items-center justify-center rounded-full bg-white shadow"
              style={{ left: '44%', top: '40%', width: S * 0.13, height: S * 0.13, marginLeft: -(S * 0.13) / 2, marginTop: -(S * 0.022) }}
            >
              <neckwear.icon size={S * 0.085} color={neckwear.hex} />
            </span>
          </>
        )}

        {/* Eyewear — sunglasses that sit right on the avatar's two lenses */}
        {eyewear && <Sunglasses cosmetic={eyewear} S={S} />}

        {/* Hat — sits on the crown of the head */}
        {hat && (
          <span
            className="absolute"
            style={{ left: '47%', top: '3%', width: S * 0.4, height: S * 0.4, marginLeft: -(S * 0.4) / 2, transform: 'rotate(-6deg)' }}
          >
            <span className="absolute rounded-[50%] bg-black/20 blur-[2px]" style={{ width: S * 0.26, height: S * 0.05, left: '50%', marginLeft: -(S * 0.13), bottom: S * 0.02 }} />
            <hat.icon size={S * 0.4} color={hat.hex} className="relative drop-shadow-[0_4px_5px_rgba(0,0,0,0.25)]" />
          </span>
        )}

        {/* Companion — floats beside the right wing */}
        {companion && (
          <motion.span
            className="absolute flex items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-black/5"
            style={{ left: '88%', top: '50%', width: S * 0.26, height: S * 0.26, marginLeft: -(S * 0.13), marginTop: -(S * 0.13) }}
            animate={prefersReduced ? undefined : { y: [0, -S * 0.03, 0] }}
            transition={prefersReduced ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <companion.icon size={S * 0.15} color={companion.hex} />
          </motion.span>
        )}
      </motion.div>
    </div>
  )
}

/** Round sunglasses positioned exactly over the avatar's two existing lenses. */
function Sunglasses({ cosmetic, S }: { cosmetic: Cosmetic; S: number }) {
  const lens = S * 0.21
  const tint = cosmetic.hex
  const lensStyle: CSSProperties = {
    width: lens,
    height: lens,
    borderRadius: '50%',
    background: `${tint}E6`,
    border: `${Math.max(2, S * 0.014)}px solid ${tint}`,
    boxShadow: `inset ${S * 0.03}px ${S * 0.03}px ${S * 0.04}px rgba(255,255,255,0.35)`,
  }
  return (
    <span className="absolute" style={{ left: '41%', top: '23%', width: S * 0.5, marginLeft: -(S * 0.5) / 2, transform: 'translateY(-50%) rotate(-2deg)' }}>
      <span className="flex items-center justify-center" style={{ gap: S * 0.04 }}>
        <span style={lensStyle} />
        <span style={{ width: S * 0.05, height: Math.max(2, S * 0.018), background: tint, borderRadius: 9999, marginTop: -S * 0.02 }} />
        <span style={lensStyle} />
      </span>
    </span>
  )
}
