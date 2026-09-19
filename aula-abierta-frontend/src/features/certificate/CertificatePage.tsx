/**
 * Learning Certificate — printable + shareable achievement document.
 *
 * Fetches the student's journey (level + progress) from the dashboard API.
 * On mount: fires confetti. Print button calls window.print() using an
 * injected @media print block that hides all app chrome. WhatsApp share
 * opens a wa.me URL with a celebratory message.
 */

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Award, Download, Printer, Share2 } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Button, Mascot, Skeleton } from '@core/ui'
import { celebrate } from '@core/motion'
import { useAuth } from '@core/auth/useAuth'
import { useSound } from '@core/hooks/useSound'
import { studentApi } from '@features/student/api'
import { whatsappShareUrl } from '@core/utils/share'
import { cn } from '@core/utils'
import { pageVariants } from '@core/config/motion'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCertDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Print stylesheet injected once per page mount ─────────────────────────────

const PRINT_STYLE_ID = 'lk-cert-print-style'

function injectPrintStyle() {
  if (document.getElementById(PRINT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = PRINT_STYLE_ID
  style.textContent = `
    @media print {
      /* Hide everything by default */
      body > * { display: none !important; }

      /* Show only the certificate card */
      #lk-certificate-print-root,
      #lk-certificate-print-root * { display: revert !important; }

      #lk-certificate-print-root {
        position: fixed !important;
        inset: 0 !important;
        z-index: 99999 !important;
        background: white !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 32px !important;
      }

      /* Remove action buttons inside the print root */
      #lk-certificate-actions { display: none !important; }

      /* Force print colors */
      #lk-certificate-card {
        box-shadow: none !important;
        border: 2px solid #1D95FB !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  `
  document.head.appendChild(style)
}

function removePrintStyle() {
  document.getElementById(PRINT_STYLE_ID)?.remove()
}

// ── Decorative border corner ──────────────────────────────────────────────────

function CornerOrnament({
  className,
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('absolute size-14 text-brand-blue', className)}
      aria-hidden="true"
    >
      <path
        d="M4 60 L4 4 L60 4"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <circle cx="4" cy="4" r="4" fill="currentColor" opacity="0.7" />
      <path
        d="M14 50 L14 14 L50 14"
        stroke="#FED401"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 6"
        opacity="0.6"
      />
    </svg>
  )
}

// ── Star row ornament ─────────────────────────────────────────────────────────

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4 text-brand-yellow"
        >
          <path d="M10 1l2.39 5.26 5.61.77-4.09 3.9.97 5.58L10 14l-4.88 2.51.97-5.58L2 6.03l5.61-.77z" />
        </svg>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CertificatePage() {
  const { user } = useAuth()
  const { play } = useSound()
  const prefersReduced = useReducedMotion()
  const hasLaunched = useRef(false)

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: studentApi.getDashboard,
  })

  const journey = dashboard?.journey ?? null
  const levelName = journey?.level.name ?? 'English Level'
  const programCode = journey?.program?.code ?? ''
  const progressPercent = journey?.progress.percent ?? 0
  const completedWeeks = journey?.progress.completed_weeks ?? 0
  const totalWeeks = journey?.progress.total_weeks ?? 0
  const classroomName = journey?.classroom.name ?? ''

  const studentName = user?.name ?? 'Student'
  const today = new Date()
  const certDate = formatCertDate(today)

  // Fire confetti on first mount, after a short delay for the reveal animation
  useEffect(() => {
    if (hasLaunched.current) return
    hasLaunched.current = true
    const timer = setTimeout(() => {
      if (!prefersReduced) celebrate({ x: 0.5, y: 0.4 })
      play('achievement')
    }, 600)
    return () => clearTimeout(timer)
  }, [prefersReduced, play])

  // Inject print style on mount, clean up on unmount
  useEffect(() => {
    injectPrintStyle()
    return removePrintStyle
  }, [])

  // ── Share text ──────────────────────────────────────────────────────────────
  const shareText = [
    `My child ${studentName} just earned their Learning Certificate at Aula Abierta!`,
    programCode
      ? `Program: ${programCode} — Level: ${levelName}`
      : `Level: ${levelName}`,
    `Progress: ${progressPercent}% complete (${completedWeeks}/${totalWeeks} weeks)`,
    classroomName ? `Classroom: ${classroomName}` : '',
    `Awarded: ${certDate}`,
    '',
    'Aula Abierta — Learning certificate',
  ]
    .filter(Boolean)
    .join('\n')

  const handlePrint = () => {
    play('tap')
    window.print()
  }

  const handleWhatsApp = () => {
    play('success')
    window.open(whatsappShareUrl(shareText), '_blank', 'noopener,noreferrer')
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppShell>
        <div className="page-container py-10">
          <div className="mx-auto max-w-2xl">
            <Skeleton height={560} rounded="md" className="rounded-3xl" />
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Certificate UI ──────────────────────────────────────────────────────────
  return (
    <AppShell>
      {/* Print root wrapper — this element becomes the sole visible thing at print time */}
      <div id="lk-certificate-print-root" className="w-full">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="page-container flex flex-col items-center gap-8 py-8 sm:py-12"
        >
          {/* Page heading (hidden in print) */}
          <div className="text-center print:hidden">
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand-red">
              Achievement unlocked
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
              Learning Certificate
            </h1>
            <p className="mt-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Celebrate every step of the journey — share it with the people who cheer you on.
            </p>
          </div>

          {/* ── Certificate card ────────────────────────────────────────────── */}
          <motion.div
            id="lk-certificate-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              // Base layout
              'relative w-full max-w-2xl overflow-hidden',
              // Shape & border
              'rounded-[32px] border-4 border-brand-blue/20',
              // Background: warm cream (prints as white)
              'bg-brand-cream dark:bg-surface-raised',
              // Shadow
              'shadow-[0_20px_60px_-10px_rgba(29,149,251,0.18),0_8px_24px_-4px_rgba(29,149,251,0.12)]',
            )}
            aria-label={`Learning Certificate for ${studentName}`}
          >
            {/* ── Top accent bar ────────────────────────────────────────────── */}
            <div
              className="h-3 w-full"
              style={{
                background: 'linear-gradient(90deg, #D31A2A 0%, #1D95FB 50%, #FED401 100%)',
              }}
              aria-hidden="true"
            />

            {/* ── Corner ornaments ──────────────────────────────────────────── */}
            <CornerOrnament className="left-4 top-4" />
            <CornerOrnament className="right-4 top-4 -scale-x-100" />
            <CornerOrnament className="bottom-4 left-4 -scale-y-100" />
            <CornerOrnament className="bottom-4 right-4 -scale-x-100 -scale-y-100" />

            {/* ── Inner content ─────────────────────────────────────────────── */}
            <div className="relative flex flex-col items-center gap-6 px-8 py-10 sm:px-14 sm:py-14">
              {/* Logo / brand lockup */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="font-display text-2xl font-extrabold text-brand-blue sm:text-3xl"
                  aria-label="Aula Abierta"
                >
                  Aula Abierta
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-brand-red">
                  Open learning for every classroom
                </span>
              </div>

              <StarRow count={5} />

              {/* Mascot */}
              <Mascot mood="cheer" size="lg" />

              {/* Certificate heading */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-yellow/20 px-4 py-1.5 dark:bg-brand-yellow/10">
                  <Award size={15} className="text-brand-red" aria-hidden="true" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-brand-red">
                    Certificate of Learning
                  </span>
                </div>

                <p className="mt-5 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  This certificate is proudly awarded to
                </p>

                {/* Student name — the hero element */}
                <h2
                  className={cn(
                    'mt-2 font-display font-extrabold text-neutral-900 dark:text-white',
                    'text-3xl sm:text-4xl',
                    'leading-tight',
                  )}
                >
                  {studentName}
                </h2>
              </div>

              {/* Achievement summary */}
              <div className="w-full rounded-2xl border border-brand-blue/15 bg-white/60 px-6 py-5 text-center dark:bg-white/[.04]">
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  For outstanding dedication and achievement in
                </p>
                <p className="mt-1 font-display text-xl font-extrabold text-brand-blue">
                  {levelName}
                  {programCode ? ` · ${programCode}` : ''}
                </p>
                {classroomName && (
                  <p className="mt-0.5 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                    {classroomName}
                  </p>
                )}
              </div>

              {/* Progress bar */}
              {journey && (
                <div className="w-full">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      Journey progress
                    </span>
                    <span className="text-xs font-extrabold text-brand-blue">
                      {completedWeeks}/{totalWeeks} weeks — {progressPercent}%
                    </span>
                  </div>
                  <div
                    className="h-3 w-full overflow-hidden rounded-full bg-brand-blue/10 dark:bg-white/10"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${progressPercent}% of the program completed`}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, #1D95FB 0%, #A1D5F8 100%)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              )}

              {/* Date + divider */}
              <div className="flex w-full flex-col items-center gap-3">
                <div className="h-px w-2/3 bg-brand-blue/15" aria-hidden="true" />
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Awarded on {certDate}
                </p>
                <StarRow count={3} />
              </div>
            </div>

            {/* ── Bottom accent bar ─────────────────────────────────────────── */}
            <div
              className="h-2 w-full"
              style={{
                background: 'linear-gradient(90deg, #FED401 0%, #1D95FB 50%, #D31A2A 100%)',
              }}
              aria-hidden="true"
            />
          </motion.div>

          {/* ── Action buttons (hidden in print) ───────────────────────────── */}
          <div
            id="lk-certificate-actions"
            className="flex flex-wrap items-center justify-center gap-3 print:hidden"
          >
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Printer size={17} aria-hidden="true" />}
              onClick={handlePrint}
              aria-label="Print or save the certificate as PDF"
            >
              Print / Save PDF
            </Button>

            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Share2 size={17} aria-hidden="true" />}
              onClick={handleWhatsApp}
              aria-label="Share the certificate on WhatsApp"
            >
              Share via WhatsApp
            </Button>
          </div>

          {/* Helper text */}
          <p className="max-w-md text-center text-xs font-semibold text-neutral-400 dark:text-neutral-500 print:hidden">
            Use "Print / Save PDF" to save a copy. Your browser will let you choose to save as PDF instead of printing.
          </p>
        </motion.div>
      </div>
    </AppShell>
  )
}
