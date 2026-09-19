/**
 * Word Lab SRS — Leitner/SM-2-ish spaced repetition engine.
 *
 * Cards advance through boxes 0–5 on correct answers; a wrong answer
 * sends them back to box 0 (due immediately). Each box maps to a review
 * interval in days. State is persisted to localStorage per userId so it
 * survives page reloads without a backend.
 */

// ── Box intervals (days) ─────────────────────────────────────────────────────
export const BOX_INTERVALS: readonly number[] = [0, 1, 3, 7, 16, 30]

// ── Types ────────────────────────────────────────────────────────────────────
export interface WordPair {
  word: string
  translation: string
}

export interface SrsCard {
  id: string           // word (lowercased) used as stable id
  word: string
  translation: string
  box: number          // 0..5
  dueAt: number        // timestamp ms
  lapses: number
}

type StoredCard = Omit<SrsCard, 'word' | 'translation'>

type StoredState = Record<string, StoredCard>

// ── Persistence helpers ───────────────────────────────────────────────────────
function storageKey(userId: number | string): string {
  return `aula-abierta:srs:${userId}`
}

function loadState(userId: number | string): StoredState {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return {}
    return JSON.parse(raw) as StoredState
  } catch {
    return {}
  }
}

function saveState(userId: number | string, state: StoredState): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    // Storage quota — silently ignore
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function wordId(word: string): string {
  return word.trim().toLowerCase()
}

function daysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Merge the provided word list with stored SRS state.
 * New words start at box 0, due immediately.
 */
export function getDeck(userId: number | string, words: WordPair[]): SrsCard[] {
  const state = loadState(userId)
  const now = Date.now()

  return words.map((pair): SrsCard => {
    const id = wordId(pair.word)
    const stored = state[id]
    if (stored) {
      return {
        id,
        word: pair.word,
        translation: pair.translation,
        box: stored.box,
        dueAt: stored.dueAt,
        lapses: stored.lapses,
      }
    }
    return {
      id,
      word: pair.word,
      translation: pair.translation,
      box: 0,
      dueAt: now,
      lapses: 0,
    }
  })
}

/**
 * Record a review result and persist the updated state.
 * Returns the updated card.
 */
export function review(userId: number | string, wordId_: string, correct: boolean): SrsCard {
  const state = loadState(userId)
  const existing = state[wordId_]

  let newBox: number
  let newDueAt: number
  let newLapses: number

  if (!existing) {
    // Card not yet in state — bootstrap it
    newBox = correct ? 1 : 0
    newDueAt = correct ? daysFromNow(BOX_INTERVALS[1] ?? 1) : Date.now()
    newLapses = correct ? 0 : 1
  } else if (correct) {
    newBox = Math.min(existing.box + 1, BOX_INTERVALS.length - 1)
    const interval = BOX_INTERVALS[newBox] ?? 30
    newDueAt = daysFromNow(interval)
    newLapses = existing.lapses
  } else {
    newBox = 0
    newDueAt = Date.now()
    newLapses = existing.lapses + 1
  }

  const updated: StoredCard = { id: wordId_, box: newBox, dueAt: newDueAt, lapses: newLapses }
  state[wordId_] = updated
  saveState(userId, state)

  return {
    word: '',          // caller fills word/translation from their list
    translation: '',
    ...updated,
  }
}

/**
 * Filter the deck to only cards due for review right now.
 */
export function dueCards(userId: number | string, words: WordPair[]): SrsCard[] {
  const deck = getDeck(userId, words)
  const now = Date.now()
  return deck.filter((c) => c.dueAt <= now)
}
