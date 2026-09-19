import type { Role } from './roles'

export interface User {
  id: number
  sis_id: string
  name: string
  role: Role
  avatar_url?: string
  teacher_profile?: TeacherProfile
  created_at: string
}

export interface TeacherProfile {
  id: number
  user_id: number
  has_signed_nda: boolean
  bio?: string
}

export interface Program {
  id: number
  name: string
  code: string
  level_count: number
  weeks_per_level: number
  is_active: boolean
  levels?: Level[]
}

export interface Level {
  id: number
  program_id: number
  name: string
  order: number
}

export interface Template {
  id: number
  level_id: number
  title: string
  cover_image_url?: string | null
  is_frozen: boolean
  created_by: number
  weeks_count: number
  classrooms_count?: number | null
  created_at: string
  level?: {
    id: number
    name: string
    order: number
    program: { id: number; name: string; code: string } | null
  }
  weeks?: TemplateWeek[]
}

export interface Classroom {
  id: number
  template_id: number
  level_id: number
  trainer_id: number | null
  name: string
  academic_period: string
  starts_at: string
  ends_at: string
  is_active: boolean
  enrollment_count?: number
  theme?: ClassroomTheme
  level?: {
    id: number
    name: string
    order: number
    program: { id: number; name: string; code: string } | null
  }
}

export interface ClassroomTheme {
  primary_color: string
  accent_color: string
  hero_background: 'mascot-studio' | 'reading-cove' | 'coding-lab' | 'science-wall' | 'sky-classroom'
  welcome_message?: string | null
}

export interface TemplateWeek {
  id: number
  template_id: number
  number: number
  title: string
  vocabulary?: string | null
  materials: TemplateMaterial[]
  tasks: TemplateCourseTask[]
}

export interface TemplateMaterial {
  id: number
  template_week_id: number
  title: string
  type: Material['type']
  is_protected: boolean
  has_file: boolean
  external_url?: string | null
}

export interface TemplateCourseTask {
  id: number
  template_week_id: number
  title: string
  description: string
  deadline_offset_days: number
  is_open: boolean
}

export interface WeekSession {
  week_id: number
  meet_link?: string | null
  provider: 'google_meet'
  google_event_id?: string | null
  google_calendar_url?: string | null
  session_scheduled_at?: string | null
  session_is_live: boolean
}

export interface StudentDashboardPayload {
  classrooms: Classroom[]
  upcoming_tasks: CourseTask[]
  grades: Grade[]
  journey: ClassroomJourney | null
}

export interface TrainerDashboardPayload {
  classrooms: Classroom[]
  pending_by_classroom: Record<string, number>
  pending_total: number
  student_total: number
}

export interface Week {
  id: number
  classroom_id: number
  number: number
  title: string
  vocabulary?: string
  materials: Material[]
  tasks: CourseTask[]
  session: WeekSession
}

export type JourneyWeekState = 'completed' | 'current' | 'locked'

export interface JourneyWeek extends Week {
  state: JourneyWeekState
  materials_count: number
  tasks_count: number
  completed_tasks_count: number
}

export interface ClassroomStar {
  grade_id: number
  student_name: string
  task_title: string
  numeric_score: number
  letter_grade: 'A+'
  awarded_at: string
}

export interface ClassroomJourney {
  classroom: Classroom
  program: { id: number; name: string; code: string }
  level: { id: number; name: string; order: number }
  progress: {
    completed_weeks: number
    total_weeks: number
    remaining_weeks: number
    percent: number
  }
  motivation: { message: string; pending_tasks: number; program_code: string } | null
  weeks: JourneyWeek[]
  star_wall: ClassroomStar[]
}

export interface LearningVideo {
  id: number
  program_id: number
  level_id: number
  title: string
  description?: string | null
  youtube_url: string
  embed_url: string
  sort_order: number
  is_active: boolean
}

export interface Material {
  id: number
  week_id: number
  title: string
  type: 'slide' | 'link' | 'vocabulary' | 'audio' | 'document'
  is_protected: boolean
  signed_url?: string
  external_url?: string
}

export interface CourseTask {
  id: number
  week_id: number
  title: string
  description: string
  deadline: string
  is_open: boolean
  rubric?: Rubric
  submission?: Submission
  status: 'pending' | 'submitted' | 'graded' | 'closed' | 'overdue'
}

export interface Rubric {
  id: number
  course_task_id: number
  title: string
  criteria: RubricCriterion[]
}

export interface RubricCriterion {
  id: number
  rubric_id: number
  name: string
  description?: string
  max_score: number
}

export interface Submission {
  id: number
  course_task_id: number
  student_id: number
  submitted_at: string
  notes?: string
  evidence_urls: EvidenceFile[]
  grade?: Grade
  student?: Pick<User, 'id' | 'sis_id' | 'name'>
  course_task?: Pick<CourseTask, 'id' | 'title' | 'description' | 'deadline'> & { rubric?: Rubric }
}

export interface EvidenceFile {
  id: number
  submission_id: number
  filename: string
  mime_type: string
  signed_url: string
}

export interface Grade {
  id: number
  submission_id: number
  numeric_score: number
  letter_grade: 'A+' | 'A' | 'B' | 'C'
  criterion_scores: CriterionScore[]
  graded_at: string
  graded_by: number
  feedback?: string
  task_title?: string
  classroom_name?: string
}

export interface CriterionScore {
  criterion_id: number
  score: number
}

export interface Attendance {
  id: number
  classroom_id: number
  student_id: number
  date: string
  present: boolean
  notes?: string
}

export interface Enrollment {
  id: number
  student_id: number
  classroom_id: number
  enrolled_at: string
  is_active: boolean
}

export interface AuditLog {
  id: number
  user_id: number
  user_name: string
  category: string
  action: string
  entity_type: string
  entity_id: number
  metadata: Record<string, unknown>
  ip_address: string
  created_at: string
}
