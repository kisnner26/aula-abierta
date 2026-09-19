import type { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'full'
}

const roundedMap = {
  none: 'rounded-none',
  sm:   'rounded',
  md:   'rounded-input',
  full: 'rounded-full',
}

function Base({ width, height, rounded = 'md', className = '', style, ...rest }: SkeletonProps) {
  return (
    <div
      className={['relative overflow-hidden bg-neutral-200/80 dark:bg-white/[.06]', roundedMap[rounded], className].join(' ')}
      style={{ width, height, ...style }}
      aria-hidden
      {...rest}
    >
      <span className="shimmer-overlay" />
    </div>
  )
}

function Line({ width = '100%', height = 16, className = '' }: SkeletonProps) {
  return <Base width={width} height={height} rounded="md" className={className} />
}

function Circle({ size = 36 }: { size?: number }) {
  return <Base width={size} height={size} rounded="full" />
}

function Card() {
  return (
    <div className="surface p-6 flex flex-col gap-4" aria-hidden>
      <div className="flex items-center gap-3">
        <Circle size={40} />
        <div className="flex flex-col gap-2 flex-1">
          <Line width="60%" height={14} />
          <Line width="40%" height={12} />
        </div>
      </div>
      <Line height={12} />
      <Line width="85%" height={12} />
      <Line width="70%" height={12} />
    </div>
  )
}

function CardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => <Card key={i} />)}
    </div>
  )
}

function Unit() {
  return (
    <div className="relative min-h-[180px] overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-white/10 dark:to-white/5" aria-hidden>
      <div className="skeleton-base h-full w-full" />
    </div>
  )
}

function ClassroomList() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-2">
          <Circle size={32} />
          <Line width="70%" height={12} />
        </div>
      ))}
    </div>
  )
}

export const Skeleton = Object.assign(Base, { Line, Circle, Card, CardGrid, Unit, ClassroomList })
