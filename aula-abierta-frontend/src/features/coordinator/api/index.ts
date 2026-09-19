import { apiClient } from '@core/api'
import type { Program, Template, Classroom, User, LearningVideo, Week, WeekSession, Level, TemplateWeek } from '@core/types/models'

export const coordinatorApi = {
  // Programs
  getPrograms: () =>
    apiClient.get<{ data: Program[] }>('/programs').then((r) => r.data.data),

  createProgram: (payload: Partial<Program>) =>
    apiClient.post<{ data: Program }>('/programs', payload).then((r) => r.data.data),

  getLevels: (programId: number) =>
    apiClient.get<{ data: Level[] }>(`/programs/${programId}/levels`).then((r) => r.data.data),

  // Templates
  getTemplates: () =>
    apiClient.get<{ data: Template[] }>('/templates').then((r) => r.data.data),

  getTemplate: (id: number) =>
    apiClient.get<{ data: Template }>(`/templates/${id}`).then((r) => r.data.data),

  createTemplate: (payload: Partial<Template>) =>
    apiClient.post<{ data: Template }>('/templates', payload).then((r) => r.data.data),

  uploadTemplateCover: (templateId: number, file: File) => {
    const form = new FormData()
    form.append('cover', file)
    return apiClient.post<{ data: Template }>(`/templates/${templateId}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data)
  },

  uploadTemplateMaterial: (weekId: number, payload: { title: string; type: string; is_protected: boolean; file: File }) => {
    const form = new FormData()
    form.append('title', payload.title)
    form.append('type', payload.type)
    form.append('is_protected', payload.is_protected ? '1' : '0')
    form.append('file', payload.file)
    return apiClient.post<{ data: Template }>(`/template-weeks/${weekId}/materials`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data)
  },

  addTemplateWeek: (templateId: number, payload: {
    number: number
    title: string
    vocabulary?: string
    materials?: { title: string; type: string; is_protected: boolean; external_url?: string }[]
    tasks?: { title: string; description: string; deadline_offset_days?: number }[]
  }) =>
    apiClient.post<{ data: Template }>(`/templates/${templateId}/weeks`, payload).then((r) => r.data.data),

  updateTemplateWeek: (weekId: number, payload: Partial<TemplateWeek>) =>
    apiClient.patch<{ data: Template }>(`/template-weeks/${weekId}`, payload).then((r) => r.data.data),

  updateTemplate: (id: number, payload: Partial<Template>) =>
    apiClient.put<{ data: Template }>(`/templates/${id}`, payload).then((r) => r.data.data),

  freezeTemplate: (id: number) =>
    apiClient.post<{ data: Template }>(`/templates/${id}/freeze`).then((r) => r.data.data),

  deleteTemplate: (id: number) =>
    apiClient.delete<{ data: { deleted: boolean } }>(`/templates/${id}`).then((r) => r.data.data),

  cloneTemplate: (id: number, payload: { classroom_name: string; academic_period: string; trainer_id?: number; starts_at?: string; ends_at?: string }) =>
    apiClient.post<{ data: Classroom }>(`/templates/${id}/clone`, payload).then((r) => r.data.data),

  // Classrooms
  getClassrooms: () =>
    apiClient.get<{ data: Classroom[] }>('/classrooms').then((r) => r.data.data),

  getClassroom: (id: number) =>
    apiClient.get<{ data: Classroom }>(`/classrooms/${id}`).then((r) => r.data.data),

  getWeeks: (id: number) =>
    apiClient.get<{ data: Week[] }>(`/classrooms/${id}/weeks`).then((r) => r.data.data),

  getClassroomStudents: (id: number) =>
    apiClient.get<{ data: User[] }>(`/classrooms/${id}/students`).then((r) => r.data.data),

  createAccessPass: (classroomId: number, studentId: number) =>
    apiClient.post<{ data: { token: string; access_url: string; expires_at: string } }>(`/classrooms/${classroomId}/access-passes`, { student_id: studentId }).then((r) => r.data.data),

  getLearningVideos: (classroomId: number) =>
    apiClient.get<{ data: LearningVideo[] }>(`/classrooms/${classroomId}/learning-videos`).then((r) => r.data.data),

  addLearningVideo: (payload: Pick<LearningVideo, 'program_id' | 'level_id' | 'title' | 'youtube_url'> & Partial<LearningVideo>) =>
    apiClient.post<{ data: LearningVideo }>('/learning-videos', payload).then((r) => r.data.data),

  updateLearningVideo: (videoId: number, payload: Partial<LearningVideo>) =>
    apiClient.patch<{ data: LearningVideo }>(`/learning-videos/${videoId}`, payload).then((r) => r.data.data),

  deleteLearningVideo: (videoId: number) => apiClient.delete(`/learning-videos/${videoId}`),

  getSessionHistory: (classroomId: number) =>
    apiClient.get<{ data: (WeekSession & { week_number: number; week_title: string })[] }>(`/classrooms/${classroomId}/sessions`).then((r) => r.data.data),

  assignTrainer: (classroomId: number, trainerId: number) =>
    apiClient.post(`/classrooms/${classroomId}/assign-trainer`, { trainer_id: trainerId }),

  reopenTask: (taskId: number, newDeadline?: string) =>
    apiClient.post(`/course-tasks/${taskId}/reopen`, { deadline: newDeadline }),

  // Students
  getStudents: (params?: { classroom_id?: number; program_id?: number }) =>
    apiClient.get<{ data: User[] }>('/users', { params: { role: 'student', ...params } }).then((r) => r.data.data),

  // Trainers (for assignment dropdowns)
  getTrainers: () =>
    apiClient.get<{ data: User[] }>('/users', { params: { role: 'teacher' } }).then((r) => r.data.data),

  // Reports
  downloadGradesPdf: (classroomId: number) =>
    apiClient.get(`/classrooms/${classroomId}/reports/grades`, { responseType: 'blob' }).then((r) => r.data as Blob),

  downloadAttendancePdf: (classroomId: number) =>
    apiClient.get(`/classrooms/${classroomId}/reports/attendance`, { responseType: 'blob' }).then((r) => r.data as Blob),

  // Metrics
  getMetrics: () =>
    apiClient.get<{ data: {
      active_classrooms: number
      total_students: number
      task_completion_rate: number
      pending_submissions: number
    } }>('/coordinator/metrics').then((r) => r.data.data),
}
