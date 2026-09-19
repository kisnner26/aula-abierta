import { useEffect, useState } from 'react'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'
type AvatarRole = 'student' | 'teacher' | 'coordinator' | 'admin' | 'super_admin' | 'family'

interface AvatarProps {
  name: string
  role?: AvatarRole
  src?: string
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'w-7 h-7',   text: 'text-xs' },
  md: { container: 'w-9 h-9',   text: 'text-sm' },
  lg: { container: 'w-11 h-11', text: 'text-base' },
  xl: { container: 'w-14 h-14', text: 'text-lg' },
}

const roleRingClasses: Record<AvatarRole, string> = {
  student:     'ring-brand-sky',
  teacher:     'ring-green-400',
  coordinator: 'ring-brand-yellow',
  admin:       'ring-brand-red',
  super_admin: 'ring-purple-400',
  family:      'ring-pink-400',
}

const roleBgClasses: Record<AvatarRole, string> = {
  student:     'bg-brand-sky/60 text-blue-800',
  teacher:     'bg-green-100 text-green-800',
  coordinator: 'bg-yellow-100 text-yellow-800',
  admin:       'bg-red-100 text-brand-red',
  super_admin: 'bg-purple-100 text-purple-800',
  family:      'bg-pink-100 text-pink-700',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

export function Avatar({ name, role, src, size = 'md', className = '' }: AvatarProps) {
  const { container, text } = sizeClasses[size]
  const ringClass = role ? `ring-2 ${roleRingClasses[role]}` : ''
  const bgClass   = role ? roleBgClasses[role] : 'bg-neutral-200 text-neutral-700'
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => { setImgFailed(false) }, [src])

  const showImage = src && !imgFailed

  return (
    <div
      className={[
        'rounded-full shrink-0 overflow-hidden flex items-center justify-center font-display font-bold',
        container,
        text,
        bgClass,
        ringClass,
        'ring-offset-1',
        className,
      ].join(' ')}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
