import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { RoleGuard } from './guards/RoleGuard'
import { ROUTES } from './routes'
import { Role } from '@core/types/roles'
import { Mascot } from '@core/ui'

const Loading = () => (
  <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-paper p-8 dark:bg-surface-page">
    <Mascot mood="think" size="xl" />
    <p className="font-display text-sm font-bold text-neutral-500 dark:text-neutral-400">Opening your learning space...</p>
    <div className="h-2 w-40 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10"><div className="h-full w-2/3 animate-pulse rounded-full bg-brand-red" /></div>
  </div>
)

const wrap = (C: React.ComponentType) => (
  <Suspense fallback={<Loading />}>
    <C />
  </Suspense>
)

// Auth
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'))
const QrAccessPage = lazy(() => import('@features/auth/pages/QrAccessPage'))
const ProfilePage = lazy(() => import('@features/profile/pages/ProfilePage'))

// Student
const StudentDashboard  = lazy(() => import('@features/student/pages/DashboardPage'))
const StudentClassroom  = lazy(() => import('@features/student/pages/ClassroomPage'))
const StudentTask       = lazy(() => import('@features/student/pages/TaskDetailPage'))
const StudentCalendar   = lazy(() => import('@features/student/pages/CalendarPage'))
const StudentGrades     = lazy(() => import('@features/student/pages/GradesPage'))
const StudentMessages    = lazy(() => import('@features/student/pages/MessagesPage'))
const StudentMessagesHub = lazy(() => import('@features/student/pages/MessagesHubPage'))
const StudentTV            = lazy(() => import('@features/student/pages/ClassTVPage'))
const StudentArena         = lazy(() => import('@features/student/pages/ArenaPage'))
const StudentWordLab       = lazy(() => import('@features/student/wordlab/WordLabPage'))
const StudentPronunciation = lazy(() => import('@features/student/pronunciation/PronunciationPage'))
const StudentShop          = lazy(() => import('@features/shop/ShopPage'))
const StudentCertificate   = lazy(() => import('@features/certificate/CertificatePage'))

// Family
const FamilyDashboard   = lazy(() => import('@features/family/pages/DashboardPage'))

// Teacher
const TeacherDashboard  = lazy(() => import('@features/teacher/pages/DashboardPage'))
const TeacherClassroom  = lazy(() => import('@features/teacher/pages/ClassroomPage'))
const TeacherGrading    = lazy(() => import('@features/teacher/pages/GradingPage'))
const TeacherAttendance = lazy(() => import('@features/teacher/pages/AttendancePage'))
const TeacherReports    = lazy(() => import('@features/teacher/pages/ReportsPage'))
const TeacherMessages   = lazy(() => import('@features/teacher/pages/MessagesPage'))
const TeacherArena      = lazy(() => import('@features/teacher/pages/ArenaPage'))

// Coordinator
const CoordDashboard    = lazy(() => import('@features/coordinator/pages/DashboardPage'))
const CoordPrograms     = lazy(() => import('@features/coordinator/pages/ProgramsPage'))
const CoordTemplates    = lazy(() => import('@features/coordinator/pages/TemplatesPage'))
const CoordTemplateDetail = lazy(() => import('@features/coordinator/pages/TemplateDetailPage'))
const CoordClassrooms   = lazy(() => import('@features/coordinator/pages/ClassroomsPage'))
const CoordClassroom    = lazy(() => import('@features/coordinator/pages/ClassroomPage'))
const CoordStudents     = lazy(() => import('@features/coordinator/pages/StudentsPage'))
const CoordReports      = lazy(() => import('@features/coordinator/pages/ReportsPage'))

// Admin
const AdminDashboard    = lazy(() => import('@features/admin/pages/DashboardPage'))
const AdminUsers        = lazy(() => import('@features/admin/pages/UsersPage'))
const AdminAuditLog     = lazy(() => import('@features/admin/pages/AuditLogPage'))

export const router = createBrowserRouter([
  { path: ROUTES.login, element: wrap(LoginPage) },
  { path: ROUTES.qrAccess, element: wrap(QrAccessPage) },
  { path: '/', element: <Navigate to={ROUTES.login} replace /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: ROUTES.profile, element: wrap(ProfilePage) },
      {
        element: <RoleGuard allowed={[Role.Student]} />,
        children: [
          { path: ROUTES.student.dashboard,          element: wrap(StudentDashboard) },
          { path: ROUTES.student.classroom(),        element: wrap(StudentClassroom) },
          { path: ROUTES.student.task(),             element: wrap(StudentTask) },
          { path: ROUTES.student.calendar,           element: wrap(StudentCalendar) },
          { path: ROUTES.student.grades,             element: wrap(StudentGrades) },
          { path: ROUTES.student.messagesHub,        element: wrap(StudentMessagesHub) },
          { path: ROUTES.student.messages(),         element: wrap(StudentMessages) },
          { path: ROUTES.student.tv,                 element: wrap(StudentTV) },
          { path: ROUTES.student.arena,              element: wrap(StudentArena) },
          { path: ROUTES.student.wordLab,            element: wrap(StudentWordLab) },
          { path: ROUTES.student.pronunciation,      element: wrap(StudentPronunciation) },
          { path: ROUTES.student.shop,               element: wrap(StudentShop) },
          { path: ROUTES.student.certificate,        element: wrap(StudentCertificate) },
        ],
      },
      {
        element: <RoleGuard allowed={[Role.Teacher]} />,
        children: [
          { path: ROUTES.teacher.dashboard,          element: wrap(TeacherDashboard) },
          { path: ROUTES.teacher.classroom(),        element: wrap(TeacherClassroom) },
          { path: ROUTES.teacher.grading(),          element: wrap(TeacherGrading) },
          { path: ROUTES.teacher.attendance(),       element: wrap(TeacherAttendance) },
          { path: ROUTES.teacher.reports(),          element: wrap(TeacherReports) },
          { path: ROUTES.teacher.messages(),         element: wrap(TeacherMessages) },
          { path: ROUTES.teacher.arena(),            element: wrap(TeacherArena) },
        ],
      },
      {
        element: <RoleGuard allowed={[Role.Admin, Role.SuperAdmin]} />,
        children: [
          { path: ROUTES.coordinator.dashboard,      element: wrap(CoordDashboard) },
          { path: ROUTES.coordinator.programs,       element: wrap(CoordPrograms) },
          { path: ROUTES.coordinator.templates,      element: wrap(CoordTemplates) },
          { path: ROUTES.coordinator.template(),     element: wrap(CoordTemplateDetail) },
          { path: ROUTES.coordinator.classrooms,     element: wrap(CoordClassrooms) },
          { path: ROUTES.coordinator.classroom(),    element: wrap(CoordClassroom) },
          { path: ROUTES.coordinator.students,       element: wrap(CoordStudents) },
          { path: ROUTES.coordinator.reports,        element: wrap(CoordReports) },
        ],
      },
      {
        element: <RoleGuard allowed={[Role.Family]} />,
        children: [
          { path: ROUTES.family.dashboard, element: wrap(FamilyDashboard) },
        ],
      },
      {
        element: <RoleGuard allowed={[Role.SuperAdmin]} />,
        children: [
          { path: ROUTES.admin.dashboard,            element: wrap(AdminDashboard) },
          { path: ROUTES.admin.users,                element: wrap(AdminUsers) },
          { path: ROUTES.admin.auditLog,             element: wrap(AdminAuditLog) },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to={ROUTES.login} replace /> },
])
