import { apiClient } from '@core/api'
import type { Classroom, Week, Submission, Attendance, LearningVideo, WeekSession, ClassroomTheme, TrainerDashboardPayload } from '@core/types/models'
import type { ApiMessage } from '@features/student/api'

export const teacherApi = {
  getDashboard: () =>
    apiClient.get<{ data: TrainerDashboardPayload }>('/trainer/dashboard').then((r) => r.data.data),

  getClassrooms: () =>
    apiClient.get<{ data: Classroom[] }>('/trainer/classrooms').then((r) => r.data.data),

  getClassroom: (id: number) =>
    apiClient.get<{ data: Classroom }>(`/trainer/classrooms/${id}`).then((r) => r.data.data),

  getWeeks: (classroomId: number) =>
    apiClient.get<{ data: Week[] }>(`/classrooms/${classroomId}/weeks`).then((r) => r.data.data),

  getLearningVideos: (classroomId: number) =>
    apiClient.get<{ data: LearningVideo[] }>(`/classrooms/${classroomId}/learning-videos`).then((r) => r.data.data),

  getWeekSession: (classroomId: number, weekId: number) =>
    apiClient.get<{ data: WeekSession }>(`/classrooms/${classroomId}/weeks/${weekId}/session`).then((r) => r.data.data),

  updateWeekSession: (classroomId: number, weekId: number, payload: Partial<WeekSession>) =>
    apiClient.patch<{ data: WeekSession }>(`/classrooms/${classroomId}/weeks/${weekId}/session`, payload).then((r) => r.data.data),

  updateClassroomTheme: (classroomId: number, payload: Partial<{
    theme_primary_color: string
    theme_accent_color: string
    hero_background: ClassroomTheme['hero_background']
    welcome_message: string
  }>) =>
    apiClient.patch<{ data: Classroom }>(`/classrooms/${classroomId}/theme`, payload).then((r) => r.data.data),

  getPendingSubmissions: (classroomId: number) =>
    apiClient.get<{ data: Submission[] }>(`/trainer/classrooms/${classroomId}/submissions/pending`).then((r) => r.data.data),

  getAllSubmissions: (classroomId: number) =>
    apiClient.get<{ data: Submission[] }>(`/trainer/classrooms/${classroomId}/submissions`).then((r) => r.data.data),

  gradeSubmission: (submissionId: number, payload: {
    criterion_scores: { criterion_id: number; score: number }[]
    feedback?: string
  }) =>
    apiClient.post<{ data: { id: number } }>('/grades', { submission_id: submissionId, ...payload }).then((r) => r.data.data),

  saveAttendance: (classroomId: number, records: { student_id: number; date: string; present: boolean }[]) =>
    apiClient.post<{ data: Attendance[] }>('/attendance', { classroom_id: classroomId, records }).then((r) => r.data.data),

  getAttendance: (classroomId: number) =>
    apiClient.get<{ data: Attendance[] }>(`/classrooms/${classroomId}/attendance`).then((r) => r.data.data),

  getStudents: (classroomId: number) =>
    apiClient.get<{ data: { id: number; name: string; sis_id: string }[] }>(`/classrooms/${classroomId}/students`).then((r) => r.data.data),

  downloadGradesPdf: (classroomId: number) =>
    apiClient.get(`/classrooms/${classroomId}/reports/grades`, { responseType: 'blob' }).then((r) => r.data as Blob),

  downloadAttendancePdf: (classroomId: number) =>
    apiClient.get(`/classrooms/${classroomId}/reports/attendance`, { responseType: 'blob' }).then((r) => r.data as Blob),

  getMessages: (classroomId: number) =>
    apiClient.get<{ data: ApiMessage[] }>(`/trainer/classrooms/${classroomId}/messages`).then((r) => r.data.data),

  sendMessage: (classroomId: number, body: string, recipientId: number) =>
    apiClient.post<{ data: ApiMessage }>(`/trainer/classrooms/${classroomId}/messages`, {
      body,
      recipient_id: recipientId,
    }).then((r) => r.data.data),

  // ── Arena ──────────────────────────────────────────────────────────
  quizStart: (classroomId: number) =>
    apiClient.post<{ data: { id: number; status: string } }>(`/trainer/classrooms/${classroomId}/quiz`).then((r) => r.data.data),

  quizAddQuestion: (quizId: number, payload: { question_text: string; options: string[]; correct_index: number }) =>
    apiClient.post<{ data: { id: number; position: number } }>(`/trainer/quiz/${quizId}/questions`, payload).then((r) => r.data.data),

  quizDeleteQuestion: (quizId: number, questionId: number) =>
    apiClient.delete(`/trainer/quiz/${quizId}/questions/${questionId}`),

  quizRevealNext: (quizId: number) =>
    apiClient.patch<{ data: { question_id: number; position: number } }>(`/trainer/quiz/${quizId}/reveal`).then((r) => r.data.data),

  quizEnd: (quizId: number) =>
    apiClient.post(`/trainer/quiz/${quizId}/end`),

  quizTrainerState: (quizId: number) =>
    apiClient.get<{ data: QuizTrainerState }>(`/trainer/quiz/${quizId}/state`).then((r) => r.data.data),
}

export interface QuizQuestion {
  id: number
  question_text: string
  options: string[]
  correct_index: number
  position: number
  revealed: boolean
  answer_count: number
}

export interface QuizLeaderboardEntry {
  rank: number
  student_id: number
  name: string
  score: number
}

export interface QuizTrainerState {
  quiz: {
    id: number
    classroom_id: number
    status: 'pending' | 'active' | 'ended'
    current_question_id: number | null
  }
  questions: QuizQuestion[]
  leaderboard: QuizLeaderboardEntry[]
}
