import { useMemo, useState } from 'react'
import { RotateCcw, Volume2 } from 'lucide-react'
import { Modal } from '@core/ui'
import { cn } from '@core/utils'

interface VocabularyGamesProps {
  open: boolean
  onClose: () => void
  vocabulary?: string
}

interface Pair { english: string; spanish: string }
interface MemoryCard { id: string; pair: string; label: string; language: 'English' | 'Spanish' }

function parseVocabulary(value = ''): Pair[] {
  return value.split(',').map((entry) => {
    const [english, spanish] = entry.trim().split(':')
    return { english: english?.trim() ?? '', spanish: spanish?.trim() || english?.trim() || '' }
  }).filter((pair) => pair.english)
}

export function VocabularyGames({ open, onClose, vocabulary }: VocabularyGamesProps) {
  const pairs = useMemo(() => parseVocabulary(vocabulary), [vocabulary])
  const [game, setGame] = useState<'spelling' | 'memory'>('spelling')

  return (
    <Modal open={open} onClose={onClose} title="Word Lab" size="lg">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Vocabulary games">
        <button type="button" role="tab" aria-selected={game === 'spelling'} onClick={() => setGame('spelling')} className={cn('min-h-11 rounded-lg text-sm font-bold', game === 'spelling' ? 'bg-white text-brand-red shadow-sm' : 'text-neutral-500')}>Spelling activity</button>
        <button type="button" role="tab" aria-selected={game === 'memory'} onClick={() => setGame('memory')} className={cn('min-h-11 rounded-lg text-sm font-bold', game === 'memory' ? 'bg-white text-brand-blue shadow-sm' : 'text-neutral-500')}>Memory match</button>
      </div>
      {game === 'spelling' ? <SpellingGame pairs={pairs} /> : <MemoryGame pairs={pairs} />}
    </Modal>
  )
}

function SpellingGame({ pairs }: { pairs: Pair[] }) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const pair = pairs[index % Math.max(1, pairs.length)]

  const speak = () => {
    if (!pair || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(pair.english)
    utterance.lang = 'en-US'
    utterance.rate = 0.78
    window.speechSynthesis.speak(utterance)
  }

  if (!pair) return <p className="py-12 text-center text-sm font-semibold text-neutral-500">Vocabulary will appear when this week is published.</p>

  const check = () => setResult(answer.trim().toLowerCase() === pair.english.toLowerCase() ? 'correct' : 'wrong')
  const next = () => { setIndex((current) => (current + 1) % pairs.length); setAnswer(''); setResult('idle') }

  return (
    <div className="rounded-2xl bg-brand-cream p-6 text-center">
      <p className="text-xs font-extrabold text-brand-red">LISTEN AND TYPE</p>
      <button type="button" onClick={speak} className="mx-auto mt-5 flex size-20 items-center justify-center rounded-full bg-brand-blue text-white shadow-md transition-transform duration-150 hover:scale-105 motion-reduce:hover:scale-100" aria-label="Play word audio"><Volume2 size={30} aria-hidden="true" /></button>
      <p className="mt-4 text-sm font-semibold text-neutral-500">Spanish clue: <strong className="text-neutral-800">{pair.spanish}</strong></p>
      <label htmlFor="spelling-answer" className="sr-only">Type the word you heard</label>
      <input id="spelling-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setResult('idle') }} onKeyDown={(event) => event.key === 'Enter' && check()} className="mt-5 min-h-14 w-full rounded-xl border-2 border-neutral-200 bg-white px-4 text-center text-lg font-bold text-neutral-900 focus:border-brand-blue focus:ring-brand-blue" autoComplete="off" />
      <div className="mt-4 min-h-6" aria-live="polite">
        {result === 'correct' && <p className="font-bold text-green-700">Correct. Great listening.</p>}
        {result === 'wrong' && <p className="font-bold text-brand-red">Listen once more and try again.</p>}
      </div>
      <button type="button" onClick={result === 'correct' ? next : check} className="mt-3 min-h-11 rounded-xl bg-brand-red px-6 text-sm font-bold text-white hover:bg-red-700">{result === 'correct' ? 'Next word' : 'Check spelling'}</button>
    </div>
  )
}

function MemoryGame({ pairs }: { pairs: Pair[] }) {
  const cards = useMemo<MemoryCard[]>(() => pairs.slice(0, 6).flatMap((pair, index) => [
    { id: `${index}-en`, pair: `${index}`, label: pair.english, language: 'English' as const },
    { id: `${index}-es`, pair: `${index}`, label: pair.spanish, language: 'Spanish' as const },
  ]).sort(() => Math.random() - 0.5), [pairs])
  const [selected, setSelected] = useState<MemoryCard[]>([])
  const [matched, setMatched] = useState<string[]>([])

  const choose = (card: MemoryCard) => {
    if (matched.includes(card.pair) || selected.some((item) => item.id === card.id)) return
    if (selected.length === 0) { setSelected([card]); return }
    const first = selected[0]!
    if (first.pair === card.pair && first.language !== card.language) setMatched((current) => [...current, card.pair])
    setSelected([])
  }

  const reset = () => { setSelected([]); setMatched([]) }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-neutral-500" aria-live="polite">{matched.length} of {Math.min(6, pairs.length)} pairs found</p>
        <button type="button" onClick={reset} className="flex size-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200" aria-label="Restart memory game"><RotateCcw size={17} aria-hidden="true" /></button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card) => {
          const found = matched.includes(card.pair)
          const active = selected.some((item) => item.id === card.id)
          return <button key={card.id} type="button" disabled={found} onClick={() => choose(card)} className={cn('min-h-24 rounded-xl border-2 px-3 text-sm font-extrabold transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0', found ? 'border-green-300 bg-green-50 text-green-800' : active ? 'border-brand-yellow bg-brand-yellow text-neutral-900' : card.language === 'English' ? 'border-brand-blue bg-white text-brand-blue' : 'border-brand-red bg-white text-brand-red')}><span className="block text-[10px] font-bold opacity-60">{card.language}</span><span className="mt-1 block">{found ? 'Matched' : card.label}</span></button>
        })}
      </div>
    </div>
  )
}
