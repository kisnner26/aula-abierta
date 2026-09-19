import { useState } from 'react'
import { Coins, Lock, ShoppingCart, CheckCircle2, Shirt } from 'lucide-react'
import { motion } from 'framer-motion'
import { TiltCard, Button } from '@core/ui'
import { celebrate } from '@core/motion'
import { usePlayerStore } from '@core/play'
import { rarityRing } from '@core/play'
import { useSound } from '@core/hooks/useSound'
import { cn } from '@core/utils'
import type { Cosmetic } from '@core/play'
import { scaleIn } from '@core/motion'

interface CosmeticCardProps {
  cosmetic: Cosmetic
  userId: number
  coins: number
  owned: string[]
  equipped: Record<string, string | null>
  onPreviewEnter: (c: Cosmetic) => void
  onPreviewLeave: () => void
}

export function CosmeticCard({
  cosmetic,
  userId,
  coins,
  owned,
  equipped,
  onPreviewEnter,
  onPreviewLeave,
}: CosmeticCardProps) {
  const { play } = useSound()
  const [buying, setBuying] = useState(false)

  const isOwned = owned.includes(cosmetic.id)
  const isEquipped = equipped[cosmetic.slot] === cosmetic.id
  const isAffordable = coins >= cosmetic.cost

  const rarityLabel: Record<string, string> = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
  }

  const rarityBg: Record<string, string> = {
    common: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
    rare: 'bg-brand-sky/20 text-brand-blue dark:bg-brand-blue/20 dark:text-brand-sky',
    epic: 'bg-brand-yellow/20 text-brand-ink dark:bg-brand-yellow/20 dark:text-brand-yellow',
  }

  const handleBuy = async () => {
    if (isOwned || !isAffordable || buying) return
    setBuying(true)
    play('tap')
    const ok = usePlayerStore.getState().buy(userId, cosmetic.id, cosmetic.slot, cosmetic.cost)
    if (ok) {
      celebrate({ x: 0.5, y: 0.45 })
      play('achievement')
    }
    setBuying(false)
  }

  const handleEquipToggle = () => {
    play('tap')
    if (isEquipped) {
      usePlayerStore.getState().equip(userId, cosmetic.slot, null)
    } else {
      usePlayerStore.getState().equip(userId, cosmetic.slot, cosmetic.id)
    }
  }

  return (
    <motion.div variants={scaleIn}>
      <TiltCard
        className={cn(
          'group relative flex h-full flex-col rounded-2xl border-2 bg-white shadow-card transition-shadow duration-200 dark:bg-surface-overlay',
          'ring-2',
          rarityRing[cosmetic.rarity],
          isEquipped
            ? 'border-brand-blue dark:border-brand-blue'
            : 'border-neutral-100 dark:border-white/10',
          !isOwned && !isAffordable && 'opacity-70',
        )}
        intensity={5}
        lift={5}
      >
        {/* Rarity badge */}
        <div className="absolute left-2 top-2 z-10">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              rarityBg[cosmetic.rarity],
            )}
          >
            {rarityLabel[cosmetic.rarity]}
          </span>
        </div>

        {/* Equipped indicator */}
        {isEquipped && (
          <div className="absolute right-2 top-2 z-10">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-blue text-white shadow-sm">
              <CheckCircle2 size={13} aria-label="Equipped" />
            </span>
          </div>
        )}

        {/* Locked overlay */}
        {!isOwned && !isAffordable && (
          <div
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 rounded-2xl bg-neutral-900/10 dark:bg-black/30"
            aria-hidden="true"
          >
            <Lock size={22} className="text-neutral-500 dark:text-neutral-400" />
          </div>
        )}

        {/* Icon area */}
        <div
          className="flex min-h-[108px] cursor-pointer flex-col items-center justify-center gap-2 px-4 pt-8 pb-3"
          onMouseEnter={() => onPreviewEnter(cosmetic)}
          onMouseLeave={onPreviewLeave}
          onFocus={() => onPreviewEnter(cosmetic)}
          onBlur={onPreviewLeave}
          onClick={() => onPreviewEnter(cosmetic)}
          role="button"
          tabIndex={0}
          aria-label={`Preview ${cosmetic.name}`}
        >
          <span
            className={cn(
              'flex size-16 items-center justify-center rounded-2xl shadow-inner',
              cosmetic.rarity === 'epic'
                ? 'bg-brand-yellow/15 dark:bg-brand-yellow/10'
                : cosmetic.rarity === 'rare'
                  ? 'bg-brand-sky/20 dark:bg-brand-blue/10'
                  : 'bg-neutral-100 dark:bg-white/[.05]',
            )}
            aria-hidden="true"
          >
            <cosmetic.icon
              size={34}
              className={cn('drop-shadow', cosmetic.color)}
              strokeWidth={1.8}
            />
          </span>
          <p className="text-center text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-snug">
            {cosmetic.name}
          </p>
        </div>

        {/* Cost row */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          <Coins
            size={14}
            className="text-brand-yellow"
            aria-hidden="true"
          />
          <span
            className={cn(
              'text-sm font-extrabold tabular-nums',
              isOwned
                ? 'text-neutral-400 dark:text-neutral-500 line-through'
                : isAffordable
                  ? 'text-brand-ink dark:text-white'
                  : 'text-brand-red dark:text-red-400',
            )}
          >
            {cosmetic.cost}
          </span>
        </div>

        {/* Action buttons */}
        <div className="px-3 pb-4">
          {isOwned ? (
            <Button
              variant={isEquipped ? 'secondary' : 'primary'}
              size="sm"
              fullWidth
              onClick={handleEquipToggle}
              leftIcon={<Shirt size={13} aria-hidden="true" />}
              aria-pressed={isEquipped}
              aria-label={isEquipped ? `Unequip ${cosmetic.name}` : `Equip ${cosmetic.name}`}
            >
              {isEquipped ? 'Unequip' : 'Equip'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleBuy}
              loading={buying}
              disabled={!isAffordable}
              leftIcon={<ShoppingCart size={13} aria-hidden="true" />}
              aria-label={
                isAffordable
                  ? `Buy ${cosmetic.name} for ${cosmetic.cost} coins`
                  : `Not enough coins to buy ${cosmetic.name}`
              }
            >
              {isAffordable ? 'Buy' : 'Need more coins'}
            </Button>
          )}
        </div>
      </TiltCard>
    </motion.div>
  )
}
