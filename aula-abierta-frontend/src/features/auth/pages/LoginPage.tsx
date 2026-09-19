import { motion, useReducedMotion } from 'framer-motion'
import { BookOpenCheck, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'
import { IllustrationPlaceholder, Logo } from '@core/ui'
import { EASE_OUT, fadeInUp, staggerContainer } from '@core/motion'
import { LoginForm } from '../components/LoginForm'

const highlights = [
  { label: 'Live classes', value: '12+', icon: BookOpenCheck, tone: 'bg-brand-yellow text-neutral-900' },
  { label: 'Roles', value: '4', icon: GraduationCap, tone: 'bg-white text-brand-blue' },
  { label: 'Protected', value: '24/7', icon: ShieldCheck, tone: 'bg-brand-red text-white' },
]

export default function LoginPage() {
  const reduceMotion = useReducedMotion()
  const stagger = reduceMotion ? undefined : staggerContainer(0.08, 0.04)
  const item = reduceMotion ? undefined : fadeInUp

  return (
    <main className="min-h-dvh overflow-x-hidden bg-white text-neutral-900 dark:bg-surface-page dark:text-white lg:h-dvh lg:overflow-hidden">
      <div className="login-layout">
        <section className="login-hero-panel relative isolate overflow-hidden bg-brand-blue text-white" aria-label="Aula Abierta learning platform">
          <IllustrationPlaceholder variant="login course progress" size="scene" className="absolute inset-0 size-full" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,84,156,.86),rgba(29,149,251,.36)_48%,rgba(255,252,247,.06))]" aria-hidden="true" />

          <div className="relative z-10 flex h-full flex-col px-12 py-9 xl:px-16">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={reduceMotion ? undefined : { duration: 0.45, ease: EASE_OUT }}
              className="flex items-center justify-between gap-4"
            >
              <span className="inline-flex rounded-xl bg-white px-3 py-2 shadow-md">
                <Logo variant="horizontal" height={32} />
              </span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 text-xs font-extrabold uppercase">
                <ShieldCheck size={15} aria-hidden="true" />
                Secure LMS
              </span>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" animate="show" className="mt-auto max-w-3xl pb-10">
              <motion.p variants={item} className="inline-flex items-center gap-2 rounded-full bg-neutral-900/30 px-4 py-2 text-xs font-extrabold uppercase text-brand-yellow">
                <Sparkles size={15} aria-hidden="true" />
                English learning
              </motion.p>
              <motion.h1 variants={item} className="mt-5 max-w-[11ch] text-balance font-display text-6xl font-extrabold leading-[.92] text-white xl:text-7xl">
                Aula Abierta
              </motion.h1>
              <motion.p variants={item} className="mt-5 max-w-xl text-pretty text-lg font-semibold leading-8 text-white/90">
                A bright learning space for classes, progress, messages, and the next small win.
              </motion.p>
              <motion.div variants={item} className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
                {highlights.map((highlight) => (
                  <div key={highlight.label} className="border-t border-white/35 pt-4">
                    <span className={`flex size-10 items-center justify-center rounded-xl ${highlight.tone}`}>
                      <highlight.icon size={18} aria-hidden="true" />
                    </span>
                    <p className="mt-4 font-display text-3xl font-extrabold leading-none text-white">{highlight.value}</p>
                    <p className="mt-1 text-xs font-bold uppercase text-white/75">{highlight.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="login-access-panel relative flex min-h-dvh flex-col bg-surface-paper px-6 py-6 dark:bg-surface-sunken sm:px-10 lg:bg-white lg:px-12 lg:py-10 dark:lg:bg-surface-sunken">
          <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col">
            <motion.header
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={reduceMotion ? undefined : { duration: 0.45, ease: EASE_OUT }}
              className="flex items-center justify-between gap-4"
            >
              <Logo variant="horizontal" height={34} />
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-sky/25 px-4 text-xs font-extrabold uppercase text-brand-blue dark:bg-brand-blue/15">
                <ShieldCheck size={15} aria-hidden="true" />
                Secure
              </span>
            </motion.header>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="flex flex-1 flex-col justify-center py-10"
            >
              <motion.div variants={item} className="border-l-4 border-brand-red pl-5">
                <p className="text-xs font-extrabold uppercase text-brand-red">Welcome back</p>
                <h2 className="mt-3 max-w-[11ch] text-balance font-display text-4xl font-extrabold leading-tight text-neutral-900 dark:text-white sm:text-5xl">
                  Sign in to your space
                </h2>
                <p className="mt-4 max-w-md text-pretty text-base font-semibold leading-7 text-neutral-500 dark:text-neutral-400">
                  Use your Aula Abierta ID and password to continue.
                </p>
              </motion.div>

              <motion.div variants={item} className="mt-8">
                <LoginForm />
              </motion.div>

              <motion.div variants={item} className="mt-6 flex items-start gap-3 border-t border-neutral-200 pt-5 text-sm font-semibold leading-6 text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white">
                  <ShieldCheck size={16} aria-hidden="true" />
                </span>
                <span>Protected access for students, trainers, families, and coordinators.</span>
              </motion.div>
            </motion.div>

            <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500">Open source learning platform</p>
          </div>
        </section>
      </div>
    </main>
  )
}
