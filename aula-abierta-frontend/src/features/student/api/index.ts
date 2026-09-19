import { apiClient, EP } from '@core/api'
import type { Classroom, ClassroomJourney, CourseTask, Grade, LearningVideo, StudentDashboardPayload, Week, WeekSession } from '@core/types/models'

export interface ApiMessage {
  id: number
  from: 'me' | 'other'
  sender_id: number
  sender_name: string
  body: string
  read_at: string | null
  timestamp: string
}

export interface InboxItem {
  classroom: Classroom
  latest_message: Pick<ApiMessage, 'id' | 'from' | 'body' | 'read_at' | 'timestamp'> | null
  unread_count: number
}

export const studentApi = {
  getDashboard: () =>
    apiClient.get<{ data: StudentDashboardPayload }>('/student/dashboard').then((r) => r.data.data),

  getClassrooms: () =>
    apiClient.get<{ data: Classroom[] }>('/student/classrooms').then((r) => r.data.data),

  getClassroom: (id: number) =>
    apiClient.get<{ data: Classroom }>(`/student/classrooms/${id}`).then((r) => r.data.data),

  getWeeks: (classroomId: number) =>
    apiClient.get<{ data: Week[] }>(`/student/classrooms/${classroomId}/weeks`).then((r) => r.data.data),

  getJourney: (classroomId: number) =>
    apiClient.get<{ data: ClassroomJourney }>(`/student/classrooms/${classroomId}/journey`).then((r) => r.data.data),

  getLearningVideos: (classroomId: number) =>
    apiClient.get<{ data: LearningVideo[] }>(`/classrooms/${classroomId}/learning-videos`).then((r) => r.data.data),

  getWeekSession: (classroomId: number, weekId: number) =>
    apiClient.get<{ data: WeekSession }>(`/classrooms/${classroomId}/weeks/${weekId}/session`).then((r) => r.data.data),

  getMaterialUrl: (materialId: number) =>
    apiClient.get<{ data: { url: string } }>(`/materials/${materialId}/signed-url`).then((r) => r.data.data.url),

  getUpcomingTasks: () =>
    apiClient.get<{ data: CourseTask[] }>('/student/tasks/upcoming').then((r) => r.data.data),

  getTask: (id: number) =>
    apiClient.get<{ data: CourseTask }>(`/student/tasks/${id}`).then((r) => r.data.data),

  getGrades: () =>
    apiClient.get<{ data: Grade[] }>('/student/grades').then((r) => r.data.data),

  submitTask: (taskId: number, formData: FormData) =>
    apiClient.post<{ data: { id: number } }>('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data),

  getMessages: (classroomId: number, beforeId?: number) =>
    apiClient.get<{ data: ApiMessage[]; meta?: { has_more: boolean; oldest_id: number | null } }>(
      `/student/classrooms/${classroomId}/messages`,
      { params: beforeId ? { before_id: beforeId } : undefined },
    ).then((r) => ({ data: r.data.data, meta: r.data.meta })),

  getInbox: () =>
    apiClient.get<{ data: InboxItem[] }>('/student/inbox').then((r) => r.data.data),

  sendMessage: (classroomId: number, body: string, recipientId: number) =>
    apiClient.post<{ data: ApiMessage }>(`/student/classrooms/${classroomId}/messages`, {
      body,
      recipient_id: recipientId,
    }).then((r) => r.data.data),

  // ── Arena ──────────────────────────────────────────────────────────
  quizGetActive: () =>
    apiClient.get<{ data: StudentQuizState | null }>('/student/quiz/active').then((r) => r.data.data),

  quizAnswer: (quizId: number, questionId: number, answerIndex: number) =>
    apiClient.post<{ data: { is_correct: boolean; correct_index: number } }>(`/student/quiz/${quizId}/answer`, {
      question_id: questionId,
      answer_index: answerIndex,
    }).then((r) => r.data.data),
}

export interface StudentQuizQuestion {
  id: number
  question_text: string
  options: string[]
  position: number
}

export interface StudentQuizState {
  quiz_id: number
  classroom_id: number
  status: 'active' | 'ended'
  current_question: StudentQuizQuestion | null
  already_answered: boolean
  my_answer_index: number | null
  correct_index: number | null
  my_score: number
}
