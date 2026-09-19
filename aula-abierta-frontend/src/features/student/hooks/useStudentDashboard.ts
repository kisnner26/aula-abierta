import { useQuery } from '@tanstack/react-query'
import { studentApi } from '../api'

export function useStudentDashboard() {
  const dashboard = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: studentApi.getDashboard,
  })

  return {
    dashboard,
    classrooms: { data: dashboard.data?.classrooms, isLoading: dashboard.isLoading },
    upcomingTasks: { data: dashboard.data?.upcoming_tasks, isLoading: dashboard.isLoading },
    grades: { data: dashboard.data?.grades, isLoading: dashboard.isLoading },
    journey: dashboard.data?.journey ?? null,
  }
}
