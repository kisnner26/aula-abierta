/**
 * Parses the "word:translation, word2:translation2" vocabulary string
 * from JourneyWeek.vocabulary into a clean array of pairs.
 */
export interface VocabPair {
  word: string
  translation: string
}

export function parseVocabulary(raw: string | null | undefined): VocabPair[] {
  if (!raw || raw.trim() === '') return []

  return raw
    .split(',')
    .map((chunk) => {
      const colonIdx = chunk.indexOf(':')
      if (colonIdx === -1) return null
      const word = chunk.slice(0, colonIdx).trim()
      const translation = chunk.slice(colonIdx + 1).trim()
      if (!word || !translation) return null
      return { word, translation } satisfies VocabPair
    })
    .filter((p): p is VocabPair => p !== null)
}
