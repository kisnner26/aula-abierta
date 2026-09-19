/**
 * Dependency-free canvas confetti for celebration moments — completing a
 * activity, earning an A+, finishing a quiz. Respects prefers-reduced-motion.
 *
 *   import { celebrate } from '@core/motion'
 *   celebrate()                       // burst from screen center-top
 *   celebrate({ x: 0.5, y: 0.4 })     // burst from a normalized origin
 */

const BRAND_COLORS = ['#1D95FB', '#D31A2A', '#FED401', '#A1D5F8', '#34D399', '#FB7185']

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  color: string
  shape: 'rect' | 'circle'
  life: number
}

type CelebrateOptions = {
  /** Normalized origin (0–1). Default { x: 0.5, y: 0.3 }. */
  x?: number
  y?: number
  count?: number
  spread?: number
  power?: number
}

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let rafId = 0

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '9999',
    } satisfies Partial<CSSStyleDeclaration>)
    document.body.appendChild(canvas)
    ctx = canvas.getContext('2d')
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function loop() {
  if (!ctx || !canvas) return
  const w = window.innerWidth
  const h = window.innerHeight
  ctx.clearRect(0, 0, w, h)

  particles = particles.filter((p) => p.life > 0 && p.y < h + 40)
  for (const p of particles) {
    p.vy += 0.18 // gravity
    p.vx *= 0.99
    p.x += p.vx
    p.y += p.vy
    p.rot += p.vr
    p.life -= 1

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 40))
    ctx.fillStyle = p.color
    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
    } else {
      ctx.beginPath()
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  if (particles.length > 0) {
    rafId = requestAnimationFrame(loop)
  } else {
    cancelAnimationFrame(rafId)
    if (canvas) {
      canvas.remove()
      canvas = null
      ctx = null
    }
  }
}

export function celebrate(options: CelebrateOptions = {}) {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const context = ensureCanvas()
  if (!context) return

  const { x = 0.5, y = 0.3, count = 120, spread = 70, power = 14 } = options
  const originX = x * window.innerWidth
  const originY = y * window.innerHeight
  const spreadRad = (spread * Math.PI) / 180

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad
    const velocity = power * (0.5 + Math.random())
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: 6 + Math.random() * 8,
      color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)] ?? '#1D95FB',
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      life: 70 + Math.random() * 40,
    })
  }

  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(loop)
}
