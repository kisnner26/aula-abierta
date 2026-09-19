import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { AppShell } from '@core/ui/Layout'
import { Avatar, Card, SectionHeader, Skeleton, Table, WorkspaceHero } from '@core/ui'
import type { Column } from '@core/ui'
import { coordinatorApi } from '../api'
import { formatDate } from '@core/utils/date'
import type { User } from '@core/types/models'

const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Student',
    render: (u) => (
      <div className="flex items-center gap-3">
        <Avatar name={u.name} role="student" size="sm" />
        <div>
          <p className="text-sm font-semibold text-neutral-800">{u.name}</p>
          <p className="text-xs text-neutral-400">{u.sis_id}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'enrolled',
    header: 'Enrolled since',
    render: (u) => <span className="text-sm text-neutral-600">{formatDate(u.created_at)}</span>,
  },
]

export default function StudentsPage() {
  const { data: students, isLoading } = useQuery({
    queryKey: ['coordinator', 'students'],
    queryFn:  () => coordinatorApi.getStudents(),
  })

  return (
    <AppShell>
      <div className="page-container flex flex-col gap-7 py-6 sm:py-8">
        <WorkspaceHero
          eyebrow="STUDENT DIRECTORY"
          title="Students"
          description={`${students?.length ?? 0} learners enrolled across all active classrooms — track records and enrollment dates.`}
          image="placeholder"
          imageAlt="Aula Abierta illustration reviewing student progress"
          tone="blue"
          imagePosition="object-[60%_center]"
        />

        <section aria-labelledby="students-list-title">
          <SectionHeader
            eyebrow="ENROLLED LEARNERS"
            title="All students"
            titleId="students-list-title"
            description="Full directory of students across all active classrooms and programs."
          />
          <Card padding="none">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-6">
                {[0, 1, 2, 3].map((i) => <Skeleton.Line key={i} height={56} />)}
              </div>
            ) : (
              <Table
                columns={columns}
                data={students ?? []}
                rowKey={(u) => u.id}
                emptyTitle="No students yet"
                emptyDescription="Students will appear here once enrolled."
                emptyIcon={<Users size={22} />}
              />
            )}
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
