import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, Download } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Button, Card, SectionHeader, toast, WorkspaceHero } from '@core/ui'
import { coordinatorApi } from '../api'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  const { data: classrooms } = useQuery({
    queryKey: ['coordinator', 'classrooms'],
    queryFn:  coordinatorApi.getClassrooms,
  })

  const exportPdf = async (type: 'grades' | 'attendance', classroomId: number, name: string) => {
    const key = `${type}-${classroomId}`
    setLoadingMap((p) => ({ ...p, [key]: true }))
    try {
      const blob = type === 'grades'
        ? await coordinatorApi.downloadGradesPdf(classroomId)
        : await coordinatorApi.downloadAttendancePdf(classroomId)
      downloadBlob(blob, `${type}-${name.replace(/\s+/g, '-')}.pdf`)
      toast.success('Report downloaded.')
    } catch {
      toast.error('Export failed.')
    } finally {
      setLoadingMap((p) => ({ ...p, [key]: false }))
    }
  }

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="ACADEMIC REPORTING"
          title="Reports"
          description="Export grades and attendance records for any classroom as a ready-to-share PDF."
          image="placeholder"
          imageAlt="Aula Abierta illustration reviewing academic reports"
          tone="neutral"
          imagePosition="object-[60%_center]"
        />

        <section aria-labelledby="reports-list-title">
          <SectionHeader
            eyebrow="EXPORT BY CLASSROOM"
            title="Download reports"
            titleId="reports-list-title"
            description="Choose grades or attendance for each classroom. Files download immediately as PDF."
          />

          {classrooms?.length ? (
            <div className="flex flex-col gap-3">
              {classrooms.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-neutral-200 bg-white p-5 shadow-soft"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-sky/35 text-brand-blue">
                      <BarChart2 size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-display font-bold text-neutral-900">{c.name}</p>
                      <p className="text-xs font-semibold text-neutral-400">
                        {c.academic_period} · {c.enrollment_count ?? 0} students
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Download size={13} />}
                      loading={loadingMap[`grades-${c.id}`]}
                      onClick={() => exportPdf('grades', c.id, c.name)}
                    >
                      Grades
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Download size={13} />}
                      loading={loadingMap[`attendance-${c.id}`]}
                      onClick={() => exportPdf('attendance', c.id, c.name)}
                    >
                      Attendance
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card padding="md">
              <p className="py-6 text-center text-sm font-semibold text-neutral-400">No classrooms available.</p>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  )
}
