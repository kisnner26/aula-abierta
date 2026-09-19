import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ExternalLink, File, FileText, Gamepad2, Link2, Lock, MessageCircle, Play, Tv, Volume2, X } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { EmptyState, IllustrationPlaceholder, Skeleton } from '@core/ui'
import { useSound } from '@core/hooks/useSound'
import { ROUTES } from '@router/routes'
import { cn } from '@core/utils'
import { studentApi } from '../api'
import { TaskCard } from '../components/TaskCard'
import { LearningWorldMap } from '../components/LearningWorldMap'
import { VocabularyGames } from '../components/VocabularyGames'
import { StarWall } from '../components/StarWall'
import type { ClassroomTheme, JourneyWeek, Material } from '@core/types/models'
import type { LucideIcon } from 'lucide-react'

const materialIcons: Record<string, LucideIcon> = { slide: FileText, link: Link2, vocabulary: BookOpen, audio: Volume2, document: File }
export default function ClassroomPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const { play } = useSound()
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [motivationOpen, setMotivationOpen] = useState(true)

  const journeyQuery = useQuery({
    queryKey: ['student', 'classroom', id, 'journey'],
    queryFn: () => studentApi.getJourney(id),
    enabled: Boolean(id),
  })

  if (journeyQuery.isLoading) return <AppShell><div className="page-container flex flex-col gap-4 py-8"><Skeleton.Line width={320} height={40} /><Skeleton.Card /><Skeleton.Card /></div></AppShell>
  if (!journeyQuery.data) return <AppShell><div className="page-container py-8"><EmptyState title="Course unavailable" description="Refresh the page or ask your trainer for help." /></div></AppShell>

  const journey = journeyQuery.data
  const classroomTheme = journey.classroom.theme
  const primaryColor = classroomTheme?.primary_color ?? '#D31A2A'
  const accentColor = classroomTheme?.accent_color ?? '#1D95FB'
  const heroImage = classroomTheme?.hero_background ?? 'sky-classroom'
  const currentWeek = journey.weeks.find((week) => week.state === 'current') ?? journey.weeks[0]
  const activeWeek = journey.weeks.find((week) => week.id === selectedWeekId) ?? currentWeek
  if (!activeWeek) return <AppShell><div className="page-container py-8"><EmptyState title="No units published" description="Your course will appear when coordination publishes the first unit." /></div></AppShell>

  return (
    <AppShell>
      <div className="min-h-full bg-surface-paper pb-12 dark:bg-surface-page">
        <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-surface-card sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-neutral-500 dark:text-neutral-400"><span>{journey.level.name}</span><span className="tabular-nums">{journey.progress.completed_weeks}/{journey.progress.total_weeks} regions</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${journey.progress.percent}%` }} /></div>
            </div>
            <span className="hidden text-sm font-extrabold text-brand-red sm:block">{journey.progress.remaining_weeks} weeks to the final review</span>
          </div>
        </div>

        <div className="page-container flex flex-col gap-8 py-6 sm:py-8">
          <header className="grid overflow-hidden rounded-[24px] text-white shadow-md lg:grid-cols-[1fr_360px]" style={{ backgroundColor: primaryColor }}>
            <div className="p-6 sm:p-9">
              <p className="text-xs font-extrabold text-brand-yellow">{journey.program.code} · {journey.level.name}</p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white text-balance sm:text-5xl">{journey.classroom.name}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/80 text-pretty">{classroomTheme?.welcome_message || 'Every region unlocks new words, stories, activities, and classroom practice.'}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={ROUTES.student.tv} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-yellow px-4 text-sm font-bold text-neutral-900 no-underline hover:bg-yellow-300 hover:no-underline"><Tv size={17} aria-hidden="true" /> Video Library</Link>
                <Link to={ROUTES.student.arena} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white no-underline hover:bg-emerald-600 hover:no-underline"><Gamepad2 size={17} aria-hidden="true" /> Arena</Link>
                <Link to={ROUTES.student.messages(id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-bold text-white no-underline hover:bg-white/20 hover:no-underline"><MessageCircle size={17} aria-hidden="true" /> Message trainer</Link>
              </div>
            </div>
            <IllustrationPlaceholder variant={heroImage} size="scene" className="relative min-h-56" />
          </header>

          {journey.motivation && motivationOpen && (
            <section className="grid items-center gap-5 rounded-[22px] border border-brand-yellow bg-brand-cream p-5 shadow-sm dark:border-yellow-700 dark:bg-yellow-950/25 sm:grid-cols-[96px_1fr_auto]" aria-label="Message from the Aula Abierta illustration">
              <IllustrationPlaceholder variant="support" className="size-24 rounded-2xl" />
              <div><p className="text-xs font-extrabold text-brand-red">A MESSAGE FOR YOU</p><p className="mt-2 font-display text-xl font-extrabold leading-7 text-neutral-900 dark:text-white text-pretty">{journey.motivation.message}</p></div>
              <button type="button" onClick={() => setMotivationOpen(false)} className="flex size-11 items-center justify-center rounded-xl text-neutral-500 hover:bg-white dark:text-neutral-300 dark:hover:bg-white/10" aria-label="Dismiss motivation message"><X size={18} aria-hidden="true" /></button>
            </section>
          )}

          <LearningWorldMap weeks={journey.weeks} selectedWeekId={activeWeek.id} onSelect={(week) => { play('tap'); setSelectedWeekId(week.id) }} />

          <section className="grid gap-6 lg:grid-cols-2" aria-labelledby="active-region-title">
            <div>
              <p className="text-xs font-extrabold text-brand-blue">REGION {activeWeek.number} · {activeWeek.state.toUpperCase()}</p>
              <h2 id="active-region-title" className="mt-1 font-display text-3xl font-extrabold text-neutral-900 dark:text-white text-balance">{activeWeek.title}</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {activeWeek.session.session_is_live && activeWeek.session.meet_link && <a href={activeWeek.session.meet_link} target="_blank" rel="noreferrer" onClick={() => play('focus')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-bold text-white no-underline hover:bg-red-700 hover:no-underline"><Play size={17} fill="currentColor" aria-hidden="true" /> Join live class</a>}
                <button type="button" onClick={() => { play('focus'); setGamesOpen(true) }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-bold text-white hover:bg-blue-600"><Gamepad2 size={17} aria-hidden="true" /> Open Word Lab</button>
              </div>

              <div className="mt-7">
                <h3 className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">Explorer materials</h3>
                {activeWeek.materials.length === 0 ? <div className="mt-3"><EmptyState title="No materials in this region" description="Word Lab and activities are still available." /></div> : <div className="mt-3 grid grid-cols-2 gap-3">{activeWeek.materials.map((material) => <MaterialTile key={material.id} material={material} />)}</div>}
              </div>
            </div>

            <aside className="flex flex-col overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-card">
              <div className="border-b border-neutral-100 bg-brand-cream px-5 py-4 dark:border-white/10 dark:bg-white/[.04]"><p className="text-xs font-extrabold text-brand-red">REGION ACTIVITIES</p><h3 className="mt-1 font-display text-xl font-extrabold text-neutral-900 dark:text-white">Complete to move forward</h3></div>
              <div className="flex flex-1 flex-col gap-2 p-4">{activeWeek.tasks.length === 0 ? <EmptyState title="No activities yet" /> : activeWeek.tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div>
            </aside>
          </section>

          <StarWall stars={journey.star_wall} />
        </div>
      </div>

      <VocabularyGames open={gamesOpen} onClose={() => setGamesOpen(false)} vocabulary={activeWeek.vocabulary} />
    </AppShell>
  )
}

function MaterialTile({ material }: { material: Material }) {
  const [opening, setOpening] = useState(false)
  const Icon = materialIcons[material.type] ?? File
  const open = async () => {
    setOpening(true)
    try {
      const url = material.is_protected ? await studentApi.getMaterialUrl(material.id) : material.external_url
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } finally { setOpening(false) }
  }
  return <button type="button" onClick={open} disabled={opening || (!material.is_protected && !material.external_url)} className={cn('group flex h-[5.5rem] w-full items-center gap-4 rounded-[18px] border border-neutral-200 bg-white p-4 text-left shadow-sm transition-colors duration-150 hover:border-brand-blue disabled:opacity-50 dark:border-white/10 dark:bg-surface-card', opening && 'cursor-wait')}><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-sky/30 text-brand-blue"><Icon size={19} aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-neutral-800 group-hover:text-brand-blue dark:text-white">{material.title}</span><span className="mt-1 block text-xs font-semibold capitalize text-neutral-400">{opening ? 'Opening securely' : material.type}</span></span>{material.is_protected ? <Lock size={15} className="text-brand-red" aria-label="Protected material" /> : <ExternalLink size={15} className="text-neutral-300" aria-hidden="true" />}</button>
}
