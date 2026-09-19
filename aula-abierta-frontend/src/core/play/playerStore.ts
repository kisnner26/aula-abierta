import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Client-side "player progress" — coins and avatar cosmetics. This is a v1
 * economy persisted to localStorage (no backend yet); the same API can later
 * be backed by a server. Keyed per user so a shared device stays separate.
 */
export interface PlayerProgress {
  coins: number
  /** Whether the starting coin grant (derived from real activity) was applied. */
  seeded: boolean
  owned: string[]
  equipped: Record<string, string | null>
}

const empty = (): PlayerProgress => ({ coins: 0, seeded: false, owned: [], equipped: {} })

interface PlayState {
  byUser: Record<string, PlayerProgress>
  progress: (userId: string | number) => PlayerProgress
  /** Apply a one-time starting balance derived from the student's activity. */
  seed: (userId: string | number, coins: number) => void
  award: (userId: string | number, coins: number) => void
  buy: (userId: string | number, itemId: string, slot: string, cost: number) => boolean
  equip: (userId: string | number, slot: string, itemId: string | null) => void
}

function mutate(state: PlayState, userId: string | number, fn: (p: PlayerProgress) => PlayerProgress) {
  const key = String(userId)
  const current = state.byUser[key] ?? empty()
  return { byUser: { ...state.byUser, [key]: fn({ ...current }) } }
}

export const usePlayerStore = create<PlayState>()(
  persist(
    (set, get) => ({
      byUser: {},

      progress: (userId) => get().byUser[String(userId)] ?? empty(),

      seed: (userId, coins) => set((s) => mutate(s, userId, (p) => (p.seeded ? p : { ...p, coins: p.coins + coins, seeded: true }))),

      award: (userId, coins) => set((s) => mutate(s, userId, (p) => ({ ...p, coins: Math.max(0, p.coins + coins) }))),

      buy: (userId, itemId, slot, cost) => {
        const p = get().progress(userId)
        if (p.owned.includes(itemId) || p.coins < cost) return false
        set((s) => mutate(s, userId, (prev) => ({
          ...prev,
          coins: prev.coins - cost,
          owned: [...prev.owned, itemId],
          equipped: { ...prev.equipped, [slot]: itemId },
        })))
        return true
      },

      equip: (userId, slot, itemId) => set((s) => mutate(s, userId, (p) => ({ ...p, equipped: { ...p.equipped, [slot]: itemId } }))),
    }),
    {
      name: 'aula_play',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (s) => ({ byUser: s.byUser }),
    },
  ),
)
