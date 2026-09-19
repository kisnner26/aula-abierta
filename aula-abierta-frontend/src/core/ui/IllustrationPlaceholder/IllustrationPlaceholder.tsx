import { cn } from '@core/utils'

interface IllustrationPlaceholderProps {
  variant?: string
  className?: string
  size?: 'card' | 'scene'
}

export function IllustrationPlaceholder({ variant = 'learning', className, size = 'card' }: IllustrationPlaceholderProps) {
  const accent = variant.includes('red') || variant.includes('grading') ? '#D31A2A' : '#1D95FB'
  const secondary = variant.includes('yellow') || variant.includes('template') ? '#FED401' : '#54C7F0'

  return (
    <div className={cn('relative isolate overflow-hidden bg-[#EAF6FF]', size === 'scene' ? 'min-h-full' : 'min-h-44', className)} aria-hidden="true">
      <span className="absolute -right-10 -top-10 size-40 rounded-full bg-white/70" />
      <span className="absolute -bottom-16 -left-10 size-48 rounded-full bg-white/55" />
      <svg viewBox="0 0 640 360" className="absolute inset-0 size-full" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <path d="M0 292C89 246 152 318 240 272C330 225 397 304 486 260C550 229 596 244 640 215V360H0V292Z" fill={secondary} fillOpacity=".18" />
        <path d="M0 318C97 274 166 338 259 296C353 254 411 334 504 285C559 256 604 276 640 250V360H0V318Z" fill={accent} fillOpacity=".12" />
        <path d="M160 230C196 191 232 188 268 230L320 289H108L160 230Z" fill="#C98D59" />
        <path d="M112 204C136 158 293 158 318 204C289 242 140 242 112 204Z" fill="#8FD14F" />
        <path d="M172 217C193 195 230 195 253 217" stroke="#4B9D49" strokeWidth="7" strokeLinecap="round" />
        <path d="M208 244L255 276L302 244V312H208V244Z" fill="#FFF7E8" stroke="#25354A" strokeWidth="5" strokeLinejoin="round" />
        <path d="M255 276V312" stroke="#25354A" strokeWidth="5" />
        <path d="M213 247C232 231 252 231 255 276C258 231 279 231 297 247" stroke="#25354A" strokeWidth="5" strokeLinejoin="round" />
        <path d="M213 247L197 231M297 247L313 231" stroke="#25354A" strokeWidth="5" strokeLinecap="round" />
        <path d="M392 88L400 111L425 113L406 129L412 154L392 140L371 154L378 129L358 113L384 111L392 88Z" fill={secondary} stroke="#25354A" strokeWidth="5" strokeLinejoin="round" />
        <circle cx="147" cy="101" r="10" fill={accent} fillOpacity=".8" />
        <circle cx="492" cy="214" r="14" fill={secondary} fillOpacity=".85" />
        <path d="M467 85H548" stroke="#25354A" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 14" />
      </svg>
    </div>
  )
}
