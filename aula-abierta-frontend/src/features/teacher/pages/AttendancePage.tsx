import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, Save, UserCheck, UserX, Users } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Avatar, Button, EmptyState, SectionHeader, Skeleton, toast, WorkspaceHero } from '@core/ui'
import { teacherApi } from '../api'
import { cn } from '@core/utils'
import { useSound } from '@core/hooks/useSound'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function AttendancePage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const queryClient = useQueryClient()
  const { play } = useSound()
  const [date, setDate] = useState(todayISO)
  const [present, setPresent] = useState<Record<number, boolean>>({})

  const { data: students, isLoading } = useQuery({
    queryKey: ['trainer', 'classroom', id, 'students'],
    queryFn: () => teacherApi.getStudents(id),
    enabled: Boolean(id),
  })

  const { data: savedAttendance } = useQuery({
    queryKey: ['trainer', 'classroom', id, 'attendance'],
    queryFn: () => teacherApi.getAttendance(id),
    enabled: Boolean(id),
  })

  // Hydrate the toggles from what was actually saved for the selected date.
  // Students with no record yet default to present. Re-runs when the date or
  // the saved data changes (e.g. after a save refetch), so the trainer always
  // sees the real persisted register instead of a blank "all present" reset.
  useEffect(() => {
    if (!students) return
    const recordsForDate = new Map(
      (savedAttendance ?? [])
        .filter((record) => record.date.slice(0, 10) === date)
        .map((record) => [record.student_id, record.present]),
    )
    setPresent(Object.fromEntries(students.map((student) => [student.id, recordsForDate.get(student.id) ?? true])))
  }, [students, savedAttendance, date])

  const hasSavedRecord = (savedAttendance ?? []).some((record) => record.date.slice(0, 10) === date)

  const save = useMutation({
    mutationFn: () => teacherApi.saveAttendance(id, (students ?? []).map((student) => ({
      student_id: student.id,
      date,
      present: present[student.id] ?? false,
    }))),
    onSuccess: () => {
      play('success')
      toast.success('Attendance saved.')
      queryClient.invalidateQueries({ queryKey: ['trainer', 'classroom', id, 'attendance'] })
    },
    onError: () => {
      play('error')
      toast.error('Failed to save attendance.')
    },
  })

  const presentCount = Object.values(present).filter(Boolean).length
  const totalStudents = students?.length ?? 0
  const attendanceRate = totalStudents ? Math.round((presentCount / totalStudents) * 100) : 0

  const setEveryone = (value: boolean) => {
    setPresent(Object.fromEntries((students ?? []).map((student) => [student.id, value])))
  }

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="DAILY REGISTER"
          title="Attendance"
          description="Mark the group, verify the count, and save one complete record."
          image="placeholder"
          imageAlt="Aula Abierta illustration checking a classroom attendance list"
          tone="blue"
          imagePosition="object-[50%_center]"
          metric={(
            <div className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-white/15 px-4 text-white">
              <UserCheck size={19} aria-hidden="true" />
              <span className="font-display text-2xl font-extrabold tabular-nums">{presentCount}/{totalStudents}</span>
              <span className="text-xs font-semibold text-white/75">present · {attendanceRate}%</span>
            </div>
          )}
        />

        <div className="flex flex-col justify-between gap-4 rounded-[22px] border border-neutral-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
          <label className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-cream text-brand-red">
              <CalendarDays size={18} aria-hidden="true" />
            </span>
            <span>
              <span className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                CLASS DATE
                {hasSavedRecord ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Check size={11} aria-hidden="true" /> Saved
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-white/[.06] dark:text-neutral-400">
                    Not saved yet
                  </span>
                )}
              </span>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-bold text-neutral-800 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue"
              />
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                play('tap')
                setEveryone(true)
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-700 transition-colors duration-150 hover:border-emerald-500 hover:text-emerald-700"
            >
              <UserCheck size={15} aria-hidden="true" /> All present
            </button>
            <button
              type="button"
              onClick={() => {
                play('tap')
                setEveryone(false)
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-700 transition-colors duration-150 hover:border-brand-red hover:text-brand-red"
            >
              <UserX size={15} aria-hidden="true" /> Clear all
            </button>
            <Button onClick={() => save.mutate()} loading={save.isPending} leftIcon={<Save size={16} aria-hidden="true" />} variant="danger">
              Save register
            </Button>
          </div>
        </div>

        <section aria-labelledby="attendance-list-title">
          <SectionHeader eyebrow="STUDENT ROSTER" title="Today's group" titleId="attendance-list-title" description="Select a student to switch between present and absent." />
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((index) => <Skeleton.Line key={index} height={78} />)}
            </div>
          ) : !students?.length ? (
            <EmptyState icon={<Users size={22} />} title="No students enrolled" description="This classroom does not have an active roster." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {students.map((student) => {
                const isPresent = present[student.id] ?? false
                return (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() => {
                        play('tap')
                        setPresent((current) => ({ ...current, [student.id]: !current[student.id] }))
                      }}
                      className={cn(
                        'flex min-h-20 w-full items-center gap-4 rounded-[20px] border bg-white p-4 text-left shadow-soft transition-colors duration-150',
                        isPresent ? 'border-emerald-200 hover:border-emerald-400' : 'border-red-200 bg-red-50/40 hover:border-brand-red',
                      )}
                      aria-pressed={isPresent}
                      aria-label={`${student.name}: ${isPresent ? 'present' : 'absent'}`}
                    >
                      <Avatar name={student.name} role="student" size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-neutral-800">{student.name}</span>
                        <span className="block truncate text-xs font-semibold text-neutral-400">{student.sis_id}</span>
                      </span>
                      <span className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        isPresent ? 'bg-emerald-500 text-white' : 'bg-white text-brand-red ring-1 ring-inset ring-red-200',
                      )}>
                        {isPresent ? <Check size={18} aria-hidden="true" /> : <UserX size={18} aria-hidden="true" />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}
