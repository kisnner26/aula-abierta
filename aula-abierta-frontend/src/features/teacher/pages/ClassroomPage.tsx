import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, BookOpen, CheckSquare2, ClipboardCheck, Gamepad2, MessageCircle, Palette, Presentation, Save, UserCheck, Wand2 } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, Button, EmptyState, IllustrationPlaceholder, Skeleton, toast } from '@core/ui'
import { teacherApi } from '../api'
import { ROUTES } from '@router/routes'
import { cn } from '@core/utils'
import { WeekSessionPanel } from '../components/WeekSessionPanel'
import ClassroomToolkit from '../toolkit/ClassroomToolkit'
import { PresentationMode } from '@features/classroom/components/PresentationMode'
import type { Classroom, ClassroomTheme } from '@core/types/models'

const heroImages: Record<ClassroomTheme['hero_background'], string> = {
  'mascot-studio': 'placeholder',
  'reading-cove': 'placeholder',
  'coding-lab': 'placeholder',
  'science-wall': 'placeholder',
  'sky-classroom': 'placeholder',
}

export default function ClassroomPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const queryClient = useQueryClient()
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null)
  const [presentationOpen, setPresentationOpen] = useState(false)
  const [toolkitOpen, setToolkitOpen] = useState(false)
  const classroomQuery = useQuery({ queryKey: ['trainer', 'classroom', id], queryFn: () => teacherApi.getClassroom(id), enabled: Boolean(id) })
  const weeksQuery = useQuery({ queryKey: ['trainer', 'classroom', id, 'weeks'], queryFn: () => teacherApi.getWeeks(id), enabled: Boolean(id) })
  const studentsQuery = useQuery({ queryKey: ['trainer', 'classroom', id, 'students'], queryFn: () => teacherApi.getStudents(id), enabled: Boolean(id) && toolkitOpen })

  if (classroomQuery.isLoading) return <AppShell><div className="page-container flex flex-col gap-4 py-8"><Skeleton.Line width={300} height={40} /><Skeleton.Card /></div></AppShell>
  if (!classroomQuery.data) return <AppShell><div className="page-container py-8"><EmptyState title="Classroom unavailable" /></div></AppShell>
  const weeks = weeksQuery.data ?? []
  const activeWeek = weeks.find((week) => week.id === selectedWeekId) ?? weeks[0]
  const tools = [
    { label: 'Grade submissions', to: ROUTES.teacher.grading(id), icon: ClipboardCheck, tone: 'bg-brand-red text-white' },
    { label: 'Take attendance', to: ROUTES.teacher.attendance(id), icon: UserCheck, tone: 'bg-brand-blue text-white' },
    { label: 'Arena', to: ROUTES.teacher.arena(id), icon: Gamepad2, tone: 'bg-emerald-500 text-white' },
    { label: 'Export reports', to: ROUTES.teacher.reports(id), icon: BarChart3, tone: 'bg-brand-yellow text-neutral-900' },
    { label: 'Messages', to: ROUTES.teacher.messages(id), icon: MessageCircle, tone: 'bg-neutral-900 text-white' },
  ]

  return (
    <AppShell>
      <div className="min-h-full bg-surface-paper dark:bg-surface-page"><div className="page-container flex flex-col gap-8 py-6 sm:py-8">
        <TrainerHero classroom={classroomQuery.data} />

        <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Classroom tools">{tools.map((tool) => <Link key={tool.label} to={tool.to} className="group flex min-h-20 items-center gap-4 rounded-[18px] border border-neutral-200 bg-white p-4 text-neutral-900 no-underline shadow-sm hover:border-brand-blue hover:no-underline dark:border-white/10 dark:bg-surface-card dark:text-white"><span className={`flex size-11 items-center justify-center rounded-xl ${tool.tone}`}><tool.icon size={18} aria-hidden="true" /></span><span className="font-display text-base font-extrabold">{tool.label}</span></Link>)}</nav>

        {weeksQuery.isLoading ? <Skeleton.Card /> : !activeWeek ? <EmptyState icon={<BookOpen size={22} />} title="No weeks published" /> : (
          <>
            <section aria-labelledby="week-studio-title">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold text-brand-red">CLASS FLOW</p><h2 id="week-studio-title" className="mt-1 font-display text-3xl font-extrabold text-neutral-900 dark:text-white text-balance">Week studio</h2></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setToolkitOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-bold text-neutral-700 hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:bg-surface-card dark:text-neutral-200"><Wand2 size={17} aria-hidden="true" /> Classroom toolkit</button><button type="button" onClick={() => setPresentationOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-bold text-white hover:bg-red-700"><Presentation size={17} aria-hidden="true" /> Present week</button></div></div>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{weeks.map((week) => <button key={week.id} type="button" onClick={() => setSelectedWeekId(week.id)} aria-pressed={week.id === activeWeek.id} className={cn('min-h-12 min-w-24 shrink-0 rounded-xl border px-4 text-sm font-bold', week.id === activeWeek.id ? 'border-brand-blue bg-brand-blue text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-blue dark:border-white/10 dark:bg-surface-card dark:text-neutral-300')}>Week {week.number}</button>)}</div>
            </section>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section className="rounded-[22px] border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-surface-card" aria-labelledby="selected-week-title"><p className="text-xs font-extrabold text-brand-blue">WEEK {activeWeek.number}</p><h2 id="selected-week-title" className="mt-2 font-display text-3xl font-extrabold text-neutral-900 dark:text-white text-balance">{activeWeek.title}</h2><p className="mt-3 text-sm font-semibold leading-6 text-neutral-500 dark:text-neutral-400">{activeWeek.tasks.length} activities · {activeWeek.materials.length} materials</p>{activeWeek.vocabulary && <div className="mt-6 rounded-xl bg-brand-cream p-5 dark:bg-white/[.04]"><p className="text-xs font-extrabold text-brand-red">VOCABULARY</p><p className="mt-2 text-sm font-semibold leading-6 text-neutral-700 dark:text-neutral-200">{activeWeek.vocabulary.split(',').map((pair) => pair.split(':')[0]?.trim() ?? '').join(' · ')}</p></div>}<div className="mt-6"><p className="text-xs font-extrabold text-neutral-400">ACTIVITIES</p><ul className="mt-3 space-y-2">{activeWeek.tasks.map((task) => <li key={task.id} className="rounded-xl border border-neutral-200 p-4 dark:border-white/10"><p className="font-bold text-neutral-900 dark:text-white">{task.title}</p><p className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-500">{task.description}</p></li>)}</ul></div></section>
              <div className="flex flex-col gap-6">
                <WeekSessionPanel key={activeWeek.id} classroomId={id} week={activeWeek} />
                <ClassroomThemePanel
                  classroom={classroomQuery.data}
                  onSaved={(classroom) => {
                    queryClient.setQueryData(['trainer', 'classroom', id], classroom)
                    toast.success('Classroom style saved.')
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div></div>
      {activeWeek && <PresentationMode open={presentationOpen} onClose={() => setPresentationOpen(false)} week={activeWeek} />}
      <ClassroomToolkit open={toolkitOpen} onClose={() => setToolkitOpen(false)} students={studentsQuery.data ?? []} />
    </AppShell>
  )
}

function TrainerHero({ classroom }: { classroom: Classroom }) {
  const theme = classroom.theme
  const primary = theme?.primary_color ?? '#D31A2A'
  const accent = theme?.accent_color ?? '#1D95FB'
  const image = heroImages[theme?.hero_background ?? 'mascot-studio']

  return (
    <header className="grid overflow-hidden rounded-[26px] text-white shadow-sm lg:grid-cols-[1fr_360px]" style={{ backgroundColor: primary }}>
      <div className="p-6 sm:p-8">
        <div className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-xs font-extrabold text-white">
          <CheckSquare2 size={16} aria-hidden="true" />
          TRAINER CLASSROOM
        </div>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white text-balance sm:text-5xl">{classroom.name}</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/85 text-pretty">{theme?.welcome_message || `${classroom.academic_period} · Run the live class, present the active week, and keep student progress connected.`}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge status={classroom.is_active ? 'active' : 'closed'} />
          <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold tabular-nums" style={{ color: accent }}>
            {classroom.enrollment_count ?? 0} students
          </span>
        </div>
      </div>
      <div className="relative min-h-64 overflow-hidden" style={{ backgroundColor: accent }}>
        <IllustrationPlaceholder variant={image} size="scene" className="absolute inset-0 size-full" />
      </div>
    </header>
  )
}

function ClassroomThemePanel({ classroom, onSaved }: { classroom: Classroom; onSaved: (classroom: Classroom) => void }) {
  const theme = classroom.theme
  const [primary, setPrimary] = useState(theme?.primary_color ?? '#D31A2A')
  const [accent, setAccent] = useState(theme?.accent_color ?? '#1D95FB')
  const [background, setBackground] = useState<ClassroomTheme['hero_background']>(theme?.hero_background ?? 'mascot-studio')
  const [message, setMessage] = useState(theme?.welcome_message ?? '')

  const save = useMutation({
    mutationFn: () => teacherApi.updateClassroomTheme(classroom.id, {
      theme_primary_color: primary,
      theme_accent_color: accent,
      hero_background: background,
      welcome_message: message,
    }),
    onSuccess: onSaved,
    onError: () => toast.error('Could not save the classroom style.'),
  })

  return (
    <section className="rounded-[22px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-card" aria-labelledby="theme-panel-title">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-neutral-950">
          <Palette size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-extrabold text-brand-red">TRAINER COPY</p>
          <h3 id="theme-panel-title" className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">Virtual classroom style</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">Personalize this classroom without changing the base template.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Primary" value={primary} onChange={setPrimary} />
          <ColorField label="Accent" value={accent} onChange={setAccent} />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Classroom scene</span>
          <select value={background} onChange={(event) => setBackground(event.target.value as ClassroomTheme['hero_background'])} className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-deep dark:text-white">
            <option value="mascot-studio">Illustration studio</option>
            <option value="reading-cove">Reading cove</option>
            <option value="coding-lab">Coding lab</option>
            <option value="science-wall">Science wall</option>
            <option value="sky-classroom">Sky classroom</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Welcome message</span>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={180} rows={3} className="rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-blue dark:border-white/10 dark:bg-surface-deep dark:text-white" />
        </label>
        <Button onClick={() => save.mutate()} loading={save.isPending} leftIcon={<Save size={16} />}>Save style</Button>
      </div>
    </section>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{label}</span>
      <span className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-2 dark:border-white/10 dark:bg-surface-deep">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-8 rounded-lg border-0 bg-transparent p-0" aria-label={`${label} color`} />
        <span className="text-xs font-extrabold uppercase tabular-nums text-neutral-500">{value}</span>
      </span>
    </label>
  )
}
