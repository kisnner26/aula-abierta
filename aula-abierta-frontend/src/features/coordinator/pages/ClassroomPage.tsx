import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarClock, CalendarDays, Download, Plus, QrCode, Tv, UserRoundCheck, Users } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Badge, Button, EmptyState, IllustrationPlaceholder, Input, MetricCard, MetricGrid, PageCanvas, Skeleton, toast, WorkspaceHero } from '@core/ui'
import { coordinatorApi } from '../api'
import { cn } from '@core/utils'
import { formatDate } from '@core/utils/date'

type Panel = 'overview' | 'access' | 'tv' | 'sessions'

export default function ClassroomPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const queryClient = useQueryClient()
  const [panel, setPanel] = useState<Panel>('overview')
  const [studentId, setStudentId] = useState<number | null>(null)
  const [accessPass, setAccessPass] = useState<{ access_url: string; expires_at: string } | null>(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  const classroom = useQuery({ queryKey: ['coordinator', 'classroom', id], queryFn: () => coordinatorApi.getClassroom(id), enabled: Boolean(id) })
  const students = useQuery({ queryKey: ['coordinator', 'classroom', id, 'students'], queryFn: () => coordinatorApi.getClassroomStudents(id), enabled: panel === 'access' })
  const videos = useQuery({ queryKey: ['coordinator', 'classroom', id, 'videos'], queryFn: () => coordinatorApi.getLearningVideos(id), enabled: panel === 'tv' })
  const sessions = useQuery({ queryKey: ['coordinator', 'classroom', id, 'sessions'], queryFn: () => coordinatorApi.getSessionHistory(id), enabled: panel === 'sessions' })
  const createPass = useMutation({ mutationFn: () => coordinatorApi.createAccessPass(id, studentId!), onSuccess: (data) => { setAccessPass(data); toast.success('One-time classroom QR created.') }, onError: () => toast.error('The QR pass could not be created.') })
  const addVideo = useMutation({
    mutationFn: () => coordinatorApi.addLearningVideo({ program_id: classroom.data!.level!.program!.id, level_id: classroom.data!.level!.id, title: videoTitle, youtube_url: videoUrl, description: videoDescription, is_active: true }),
    onSuccess: () => { setVideoTitle(''); setVideoUrl(''); setVideoDescription(''); queryClient.invalidateQueries({ queryKey: ['coordinator', 'classroom', id, 'videos'] }); toast.success('Video added to Video Library.') },
    onError: () => toast.error('Check the YouTube link and try again.'),
  })

  if (classroom.isLoading) return <AppShell><div className="page-container py-8"><Skeleton.Card /></div></AppShell>
  if (!classroom.data) return <AppShell><div className="page-container py-8"><EmptyState title="Classroom not found" /></div></AppShell>

  const tabs: { id: Panel; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: 'Overview', icon: Users }, { id: 'access', label: 'QR access', icon: QrCode }, { id: 'tv', label: 'Video Library', icon: Tv }, { id: 'sessions', label: 'Session history', icon: CalendarClock },
  ]

  return (
    <AppShell><div className="min-h-full bg-surface-paper dark:bg-surface-page"><PageCanvas>
      <WorkspaceHero
        eyebrow="ACADEMIC COORDINATION"
        title={classroom.data.name}
        description={`${classroom.data.academic_period} · ${classroom.data.level?.program?.name ?? 'Program'} · ${classroom.data.level?.name ?? 'Level'}`}
        image="placeholder"
        imageAlt="Aula Abierta illustration managing classroom learning resources"
        tone="blue"
        actions={<Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={async () => { try { const blob = await coordinatorApi.downloadGradesPdf(id); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `grades-${id}.pdf`; anchor.click(); URL.revokeObjectURL(url) } catch { toast.error('Export failed.') } }}>Grades PDF</Button>}
        metric={<Badge status={classroom.data.is_active ? 'active' : 'closed'} />}
      />

      <nav className="flex gap-2 overflow-x-auto" aria-label="Classroom management sections">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setPanel(tab.id)} aria-pressed={panel === tab.id} className={cn('inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold', panel === tab.id ? 'bg-brand-blue text-white' : 'border border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-surface-card dark:text-neutral-300')}><tab.icon size={16} aria-hidden="true" />{tab.label}</button>)}</nav>

      {panel === 'overview' && <MetricGrid className="xl:grid-cols-3"><MetricCard icon={Users} label="Students" value={classroom.data.enrollment_count ?? 0} tone="blue" /><MetricCard icon={UserRoundCheck} label="Trainer ID" value={classroom.data.trainer_id ? `#${classroom.data.trainer_id}` : 'Unassigned'} tone="red" /><MetricCard icon={CalendarDays} label="Starts" value={classroom.data.starts_at ? formatDate(classroom.data.starts_at) : 'Not scheduled'} tone="yellow" /></MetricGrid>}

      {panel === 'access' && <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]"><div><p className="text-xs font-extrabold text-brand-red">SHARED TABLET ACCESS</p><h2 className="mt-1 font-display text-3xl font-extrabold text-neutral-900 dark:text-white text-balance">One scan. One student. One classroom.</h2><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-neutral-500 text-pretty">Each QR expires after ten minutes and can only be used once. Generate it when the student is ready to scan.</p><label htmlFor="qr-student" className="mt-7 block text-sm font-bold text-neutral-700 dark:text-neutral-200">Student</label><select id="qr-student" value={studentId ?? ''} onChange={(event) => { setStudentId(Number(event.target.value)); setAccessPass(null) }} className="mt-2 min-h-12 w-full rounded-xl border-neutral-300 bg-white text-sm font-semibold dark:border-white/10 dark:bg-surface-card dark:text-white"><option value="">Choose an enrolled student</option>{students.data?.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.sis_id}</option>)}</select><Button className="mt-4" disabled={!studentId} loading={createPass.isPending} onClick={() => createPass.mutate()}><QrCode size={17} aria-hidden="true" /> Generate secure QR</Button></div><div className="flex min-h-96 items-center justify-center rounded-[22px] border border-neutral-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-surface-card">{accessPass ? <div className="text-center"><div className="rounded-2xl bg-white p-5"><QRCodeSVG value={accessPass.access_url} size={240} level="H" includeMargin title="Student classroom access QR" /></div><p className="mt-4 font-display text-xl font-extrabold text-neutral-900 dark:text-white">Ready to scan</p><p className="mt-1 text-xs font-semibold text-neutral-500">Expires {new Date(accessPass.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div> : <EmptyState icon={<QrCode size={22} />} title="No active pass" description="Choose a student and generate a one-time QR." />}</div></section>}

      {panel === 'tv' && <section className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]"><form onSubmit={(event) => { event.preventDefault(); addVideo.mutate() }} className="rounded-[22px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-card"><p className="text-xs font-extrabold text-brand-red">CURATE THE CHANNEL</p><h2 className="mt-1 font-display text-2xl font-extrabold text-neutral-900 dark:text-white">Add a YouTube video</h2><div className="mt-5 space-y-4"><Input label="Video title" value={videoTitle} onChange={(event) => setVideoTitle(event.target.value)} required fullWidth /><Input label="YouTube link" type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} required fullWidth /><Input label="Short description" value={videoDescription} onChange={(event) => setVideoDescription(event.target.value)} fullWidth /><Button type="submit" loading={addVideo.isPending} disabled={!videoTitle || !videoUrl}><Plus size={17} aria-hidden="true" /> Add to channel</Button></div></form><div><p className="text-xs font-extrabold text-brand-blue">CURRENT PLAYLIST</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{videos.isLoading ? <><Skeleton.Card /><Skeleton.Card /></> : videos.data?.length ? videos.data.map((video) => <article key={video.id} className="rounded-[18px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-surface-card"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-red text-white"><Tv size={17} aria-hidden="true" /></span><div><h3 className="font-bold text-neutral-900 dark:text-white">{video.title}</h3><p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-neutral-500">{video.description}</p></div></div></article>) : <EmptyState title="No curated videos" description="Add the first video for this program and level." />}</div></div></section>}

      {panel === 'sessions' && <section><p className="text-xs font-extrabold text-brand-red">READ-ONLY HISTORY</p><h2 className="mt-1 font-display text-3xl font-extrabold text-neutral-900 dark:text-white">Scheduled classroom sessions</h2><div className="mt-5 overflow-hidden rounded-[20px] border border-neutral-200 bg-white dark:border-white/10 dark:bg-surface-card">{sessions.isLoading ? <div className="p-5"><Skeleton.Card /></div> : sessions.data?.length ? <ul className="divide-y divide-neutral-100 dark:divide-white/10">{sessions.data.map((session) => <li key={session.week_id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-display text-lg font-extrabold text-neutral-900 dark:text-white">Week {session.week_number} · {session.week_title}</p><p className="mt-1 text-xs font-semibold text-neutral-500">{session.session_scheduled_at ? new Date(session.session_scheduled_at).toLocaleString() : 'Started without a scheduled time'}</p></div><Badge status={session.session_is_live ? 'active' : 'pending'} /></li>)}</ul> : <div className="p-6"><EmptyState icon={<CalendarClock size={22} />} title="No sessions scheduled" /></div>}</div></section>}
    </PageCanvas></div></AppShell>
  )
}
