import { Award, Star } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { SPRING_POP, staggerContainer } from '@core/motion'
import type { ClassroomStar } from '@core/types/models'

const tileVariants = {
  hidden: { opacity: 0, scale: 0.85, rotate: -4 },
  show: { opacity: 1, scale: 1, rotate: 0, transition: SPRING_POP },
}

export function StarWall({ stars }: { stars: ClassroomStar[] }) {
  const prefersReduced = useReducedMotion()

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-gradient-red p-6 text-white shadow-red-soft sm:p-8" aria-labelledby="star-wall-title">
      {/* Floating glow accents for depth. */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-brand-yellow/20 blur-2xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 size-48 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-yellow text-neutral-900 shadow-glow-yellow">
          <Award size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-extrabold text-brand-yellow">CLASSROOM CELEBRATIONS</p>
          <h2 id="star-wall-title" className="mt-1 font-display text-2xl font-extrabold text-white text-balance">Wall of stars</h2>
        </div>
      </div>

      {stars.length === 0 ? (
        <p className="relative mt-6 text-sm font-semibold text-white/80">The first A+ achievement will shine here. Keep going — your star is next.</p>
      ) : (
        <motion.ul
          className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          variants={prefersReduced ? undefined : staggerContainer(0.08)}
          initial={prefersReduced ? undefined : 'hidden'}
          whileInView={prefersReduced ? undefined : 'show'}
          viewport={{ once: true, amount: 0.2 }}
        >
          {stars.map((star) => (
            <motion.li
              key={star.grade_id}
              variants={prefersReduced ? undefined : tileVariants}
              whileHover={prefersReduced ? undefined : { y: -4 }}
              className="group relative flex min-h-28 items-start gap-3 overflow-hidden rounded-2xl bg-white p-4 text-neutral-900 shadow-sm"
            >
              {/* Diagonal sheen sweep on hover. */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-shimmer transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <Star
                size={20}
                className="relative mt-0.5 shrink-0 fill-brand-yellow text-brand-yellow group-hover:animate-wiggle motion-reduce:group-hover:animate-none"
                aria-hidden="true"
              />
              <span className="relative">
                <strong className="block font-display text-lg font-extrabold">{star.student_name}</strong>
                <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-5 text-neutral-500">{star.task_title}</span>
                <span className="mt-2 block text-sm font-extrabold text-brand-red">A+ · {star.numeric_score}%</span>
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  )
}
