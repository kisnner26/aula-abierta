import {
  Crown, GraduationCap, Star, Sparkles, Glasses, Sun, Heart,
  Rocket, Flame, Zap, Wand2, Snowflake, Rainbow, Award, Ribbon,
  Cloud, Moon, Trees, Sunset, type LucideIcon,
} from 'lucide-react'

export type CosmeticSlot = 'hat' | 'eyewear' | 'neckwear' | 'aura' | 'companion' | 'backdrop'
export type Rarity = 'common' | 'rare' | 'epic'

export interface Cosmetic {
  id: string
  name: string
  slot: CosmeticSlot
  cost: number
  icon: LucideIcon
  /** Tailwind text-color class for the accessory + hex for custom-rendered slots. */
  color: string
  hex: string
  rarity: Rarity
}

export const SLOTS: { key: CosmeticSlot; label: string }[] = [
  { key: 'hat', label: 'Hats' },
  { key: 'eyewear', label: 'Eyewear' },
  { key: 'neckwear', label: 'Neckwear' },
  { key: 'aura', label: 'Auras' },
  { key: 'companion', label: 'Buddies' },
  { key: 'backdrop', label: 'Scenes' },
]

export const COSMETICS: Cosmetic[] = [
  // ── Hats ──────────────────────────────────────────────────────────────────
  { id: 'hat-grad', name: 'Scholar Cap', slot: 'hat', cost: 40, icon: GraduationCap, color: 'text-neutral-900', hex: '#1F1B16', rarity: 'common' },
  { id: 'hat-star', name: 'Star Topper', slot: 'hat', cost: 60, icon: Star, color: 'text-brand-yellow', hex: '#FED401', rarity: 'rare' },
  { id: 'hat-wizard', name: 'Word Wizard', slot: 'hat', cost: 90, icon: Wand2, color: 'text-purple-500', hex: '#A855F7', rarity: 'rare' },
  { id: 'hat-crown', name: 'Learning Crown', slot: 'hat', cost: 140, icon: Crown, color: 'text-brand-yellow', hex: '#FED401', rarity: 'epic' },

  // ── Eyewear (custom sunglasses overlay) ─────────────────────────────────────
  { id: 'eye-cool', name: 'Cool Shades', slot: 'eyewear', cost: 50, icon: Glasses, color: 'text-neutral-900', hex: '#1A1A1A', rarity: 'common' },
  { id: 'eye-sun', name: 'Sunny Specs', slot: 'eyewear', cost: 70, icon: Sun, color: 'text-orange-400', hex: '#FB923C', rarity: 'rare' },
  { id: 'eye-heart', name: 'Heart Lenses', slot: 'eyewear', cost: 85, icon: Heart, color: 'text-pink-500', hex: '#EC4899', rarity: 'rare' },
  { id: 'eye-3d', name: 'Learning Goggles', slot: 'eyewear', cost: 120, icon: Glasses, color: 'text-brand-blue', hex: '#1D95FB', rarity: 'epic' },

  // ── Neckwear (custom band overlay) ──────────────────────────────────────────
  { id: 'neck-scarf', name: 'Cozy Scarf', slot: 'neckwear', cost: 45, icon: Ribbon, color: 'text-brand-blue', hex: '#1D95FB', rarity: 'common' },
  { id: 'neck-bow', name: 'Bow Tie', slot: 'neckwear', cost: 55, icon: Ribbon, color: 'text-brand-red', hex: '#D31A2A', rarity: 'common' },
  { id: 'neck-medal', name: 'Gold Medal', slot: 'neckwear', cost: 100, icon: Award, color: 'text-brand-yellow', hex: '#FED401', rarity: 'epic' },

  // ── Auras ───────────────────────────────────────────────────────────────────
  { id: 'aura-spark', name: 'Sparkle Aura', slot: 'aura', cost: 80, icon: Sparkles, color: 'text-brand-blue', hex: '#1D95FB', rarity: 'rare' },
  { id: 'aura-frost', name: 'Frost Glow', slot: 'aura', cost: 80, icon: Snowflake, color: 'text-sky-400', hex: '#38BDF8', rarity: 'rare' },
  { id: 'aura-fire', name: 'Streak Fire', slot: 'aura', cost: 110, icon: Flame, color: 'text-orange-500', hex: '#F97316', rarity: 'epic' },
  { id: 'aura-rainbow', name: 'Rainbow Glow', slot: 'aura', cost: 150, icon: Rainbow, color: 'text-fuchsia-500', hex: '#D946EF', rarity: 'epic' },

  // ── Companions ───────────────────────────────────────────────────────────────
  { id: 'comp-heart', name: 'Heart Friend', slot: 'companion', cost: 45, icon: Heart, color: 'text-pink-500', hex: '#EC4899', rarity: 'common' },
  { id: 'comp-bolt', name: 'Spark Buddy', slot: 'companion', cost: 55, icon: Zap, color: 'text-brand-yellow', hex: '#FED401', rarity: 'common' },
  { id: 'comp-star', name: 'Star Pal', slot: 'companion', cost: 65, icon: Star, color: 'text-brand-yellow', hex: '#FED401', rarity: 'rare' },
  { id: 'comp-rocket', name: 'Pocket Rocket', slot: 'companion', cost: 80, icon: Rocket, color: 'text-brand-red', hex: '#D31A2A', rarity: 'rare' },

  // ── Backdrops (custom scene behind the avatar) ─────────────────────────────────
  { id: 'bg-sky', name: 'Blue Sky', slot: 'backdrop', cost: 30, icon: Cloud, color: 'text-brand-sky', hex: '#A1D5F8', rarity: 'common' },
  { id: 'bg-sunset', name: 'Warm Sunset', slot: 'backdrop', cost: 70, icon: Sunset, color: 'text-orange-400', hex: '#FB923C', rarity: 'rare' },
  { id: 'bg-forest', name: 'Green Forest', slot: 'backdrop', cost: 70, icon: Trees, color: 'text-emerald-500', hex: '#10B981', rarity: 'rare' },
  { id: 'bg-galaxy', name: 'Galaxy', slot: 'backdrop', cost: 130, icon: Moon, color: 'text-indigo-400', hex: '#818CF8', rarity: 'epic' },
]

export const cosmeticById = (id: string | null | undefined): Cosmetic | undefined =>
  id ? COSMETICS.find((c) => c.id === id) : undefined

export const rarityRing: Record<Rarity, string> = {
  common: 'ring-neutral-200 dark:ring-white/10',
  rare: 'ring-brand-blue/40',
  epic: 'ring-brand-yellow/60',
}

export const rarityGlow: Record<Rarity, string> = {
  common: '',
  rare: 'shadow-[0_0_24px_-4px_rgba(29,149,251,0.5)]',
  epic: 'shadow-[0_0_28px_-2px_rgba(254,212,1,0.6)]',
}
