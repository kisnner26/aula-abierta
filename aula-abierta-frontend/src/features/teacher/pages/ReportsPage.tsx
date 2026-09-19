import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, CheckCircle2, Download, FileCheck2, ShieldCheck, Users } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Button, toast, WorkspaceHero } from '@core/ui'
import { teacherApi } from '../api'
import { useSound } from '@core/hooks/useSound'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const id = Number(classroomId)
  const { play } = useSound()
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  const exportGrades = async () => {
    setLoadingGrades(true)
    try {
      const blob = await teacherApi.downloadGradesPdf(id)
      downloadBlob(blob, `grades-classroom-${id}.pdf`)
      play('success')
      toast.success('Grades report downloaded.')
    } catch {
      play('error')
      toast.error('Failed to generate report.')
    } finally {
      setLoadingGrades(false)
    }
  }

  const exportAttendance = async () => {
    setLoadingAttendance(true)
    try {
      const blob = await teacherApi.downloadAttendancePdf(id)
      downloadBlob(blob, `attendance-classroom-${id}.pdf`)
      play('success')
      toast.success('Attendance report downloaded.')
    } catch {
      play('error')
      toast.error('Failed to generate report.')
    } finally {
      setLoadingAttendance(false)
    }
  }

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-8 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="VERIFIED EXPORTS"
          title="Classroom reports"
          description="Generate server-built PDF records from saved grades and attendance. Every export uses the same verified classroom data."
          image="placeholder"
          imageAlt="Aula Abierta illustration presenting academic progress"
          tone="neutral"
        />

        <section className="grid gap-5 lg:grid-cols-2" aria-label="Available reports">
          <article className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-soft">
            <div className="flex min-h-44 items-center justify-between gap-5 bg-brand-blue p-6 text-white sm:p-8">
              <div>
                <p className="text-xs font-bold text-brand-yellow">ACADEMIC RECORD</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold text-white">Grades PDF</h2>
              </div>
              <span className="flex size-16 items-center justify-center rounded-[20px] bg-white/15">
                <BarChart3 size={28} aria-hidden="true" />
              </span>
            </div>
            <div className="p-6 sm:p-8">
              <ul className="flex flex-col gap-3 text-sm font-semibold text-neutral-600">
                <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" /> Numeric and letter grades</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" /> Saved rubric criterion scores</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" /> Trainer feedback and dates</li>
              </ul>
              <Button
                className="mt-6"
                fullWidth
                variant="danger"
                leftIcon={<Download size={16} aria-hidden="true" />}
                loading={loadingGrades}
                onClick={exportGrades}
              >
                Download grades PDF
              </Button>
            </div>
          </article>

          <article className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-soft">
            <div className="flex min-h-44 items-center justify-between gap-5 bg-brand-yellow p-6 text-neutral-900 sm:p-8">
              <div>
                <p className="text-xs font-bold text-brand-red">CLASS REGISTER</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold text-neutral-900">Attendance PDF</h2>
              </div>
              <span className="flex size-16 items-center justify-center rounded-[20px] bg-white/60 text-brand-red">
                <Users size={28} aria-hidden="true" />
              </span>
            </div>
            <div className="p-6 sm:p-8">
              <ul className="flex flex-col gap-3 text-sm font-semibold text-neutral-600">
                <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" /> Full enrolled student roster</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" /> Attendance grouped by date</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" /> Present and absent totals</li>
              </ul>
              <Button
                className="mt-6"
                fullWidth
                leftIcon={<Download size={16} aria-hidden="true" />}
                loading={loadingAttendance}
                onClick={exportAttendance}
              >
                Download attendance PDF
              </Button>
            </div>
          </article>
        </section>

        <section className="flex flex-col justify-between gap-5 rounded-[24px] border border-neutral-200 bg-brand-cream p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-blue shadow-soft">
              <ShieldCheck size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-neutral-900">Saved data, complete exports</h2>
              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-neutral-600 text-pretty">
                Reports are generated by the backend from persisted records. They do not rely on browser-only values.
              </p>
            </div>
          </div>
          <FileCheck2 size={26} className="hidden shrink-0 text-brand-red sm:block" aria-hidden="true" />
        </section>
      </div>
    </AppShell>
  )
}
