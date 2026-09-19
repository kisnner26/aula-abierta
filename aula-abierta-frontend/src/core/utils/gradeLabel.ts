export type LetterGrade = 'A+' | 'A' | 'B' | 'C'

export function numericToLetter(score: number): LetterGrade {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  return 'C'
}

export function letterColor(letter: LetterGrade): string {
  const map: Record<LetterGrade, string> = {
    'A+': 'text-green-700',
    'A':  'text-blue-700',
    'B':  'text-yellow-700',
    'C':  'text-brand-red',
  }
  return map[letter]
}

export function letterBg(letter: LetterGrade): string {
  const map: Record<LetterGrade, string> = {
    'A+': 'bg-green-50 border-green-200',
    'A':  'bg-blue-50 border-blue-200',
    'B':  'bg-yellow-50 border-yellow-200',
    'C':  'bg-red-50 border-red-200',
  }
  return map[letter]
}
