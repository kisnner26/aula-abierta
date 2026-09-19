export const ROUTES = {
  login: '/login',
  qrAccess: '/qr-access',
  profile: '/profile',

  student: {
    dashboard:       '/student',
    classroom:       (id: number | string = ':classroomId') => `/student/classrooms/${id}`,
    task:            (id: number | string = ':taskId')       => `/student/tasks/${id}`,
    calendar:        '/student/calendar',
    grades:          '/student/grades',
    messagesHub:     '/student/messages',
    messages:        (classroomId: number | string = ':classroomId') => `/student/classrooms/${classroomId}/messages`,
    tv:              '/student/tv',
    arena:           '/student/arena',
    shop:            '/student/shop',
    wordLab:         '/student/word-lab',
    pronunciation:   '/student/pronunciation',
    certificate:     '/student/certificate',
  },

  family: {
    dashboard: '/family',
  },

  teacher: {
    dashboard:  '/trainer',
    classroom:  (id: number | string = ':classroomId') => `/trainer/classrooms/${id}`,
    grading:    (classroomId: number | string = ':classroomId') => `/trainer/classrooms/${classroomId}/grading`,
    attendance: (classroomId: number | string = ':classroomId') => `/trainer/classrooms/${classroomId}/attendance`,
    reports:    (classroomId: number | string = ':classroomId') => `/trainer/classrooms/${classroomId}/reports`,
    messages:   (classroomId: number | string = ':classroomId') => `/trainer/classrooms/${classroomId}/messages`,
    arena:      (classroomId: number | string = ':classroomId') => `/trainer/classrooms/${classroomId}/arena`,
  },

  coordinator: {
    dashboard:   '/coordinator',
    programs:    '/coordinator/programs',
    templates:   '/coordinator/templates',
    template:    (id: number | string = ':templateId') => `/coordinator/templates/${id}`,
    classrooms:  '/coordinator/classrooms',
    classroom:   (id: number | string = ':classroomId') => `/coordinator/classrooms/${id}`,
    students:    '/coordinator/students',
    reports:     '/coordinator/reports',
  },

  admin: {
    dashboard: '/admin',
    users:     '/admin/users',
    auditLog:  '/admin/audit-log',
  },
} as const
