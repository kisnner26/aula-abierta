import { apiClient } from '@core/api'

export interface FamilyChild {
  id: number
  name: string
  sis_id: string
  avatar_url?: string
  relationship: string
}

export interface FamilyChildDashboard {
  student: { id: number; name: string; sis_id: string; avatar_url?: string }
  classrooms: { id: number; name: string; academic_period: string; is_active: boolean }[]
  grades: { id: number; numeric_score: number; feedback?: string; graded_at: string; task_title?: string }[]
  average_score: number | null
  upcoming_tasks: { id: number; title: string; deadline: string }[]
  attendance_30d: { attended: number; total: number; rate: number | null }
}

export const familyApi = {
  getChildren: () =>
    apiClient.get<{ data: FamilyChild[] }>('/family/children').then((r) => r.data.data),

  getChildDashboard: (studentId: number) =>
    apiClient.get<{ data: FamilyChildDashboard }>(`/family/children/${studentId}/dashboard`).then((r) => r.data.data),
}
