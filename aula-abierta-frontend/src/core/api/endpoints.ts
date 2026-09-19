export const EP = {
  auth: {
    login:   '/auth/login',
    logout:  '/auth/logout',
    refresh: '/auth/refresh',
    me:      '/auth/me',
  },
  users: {
    list:       '/users',
    show:       (id: number) => `/users/${id}`,
    store:      '/users',
    update:     (id: number) => `/users/${id}`,
    destroy:    (id: number) => `/users/${id}`,
    bulkImport: '/users/bulk-import',
  },
  programs: {
    list:  '/programs',
    show:  (id: number) => `/programs/${id}`,
    store: '/programs',
  },
  levels: {
    list:  (programId: number) => `/programs/${programId}/levels`,
  },
  templates: {
    list:   '/templates',
    show:   (id: number) => `/templates/${id}`,
    store:  '/templates',
    update: (id: number) => `/templates/${id}`,
    freeze: (id: number) => `/templates/${id}/freeze`,
    clone:  (id: number) => `/templates/${id}/clone`,
  },
  classrooms: {
    list:          '/classrooms',
    show:          (id: number) => `/classrooms/${id}`,
    store:         '/classrooms',
    update:        (id: number) => `/classrooms/${id}`,
    assignTrainer: (id: number) => `/classrooms/${id}/assign-trainer`,
    weeks:         (id: number) => `/classrooms/${id}/weeks`,
    students:      (id: number) => `/classrooms/${id}/students`,
  },
  materials: {
    signedUrl: (id: number) => `/materials/${id}/signed-url`,
  },
  courseTasks: {
    show:   (id: number) => `/course-tasks/${id}`,
    update: (id: number) => `/course-tasks/${id}`,
    reopen: (id: number) => `/course-tasks/${id}/reopen`,
  },
  submissions: {
    store:  '/submissions',
    show:   (id: number) => `/submissions/${id}`,
  },
  grades: {
    store:  '/grades',
    update: (id: number) => `/grades/${id}`,
  },
  attendance: {
    store:         '/attendance',
    byClassroom:   (classroomId: number) => `/classrooms/${classroomId}/attendance`,
  },
  enrollments: {
    store:   '/enrollments',
    destroy: (id: number) => `/enrollments/${id}`,
  },
  reports: {
    grades:     (classroomId: number) => `/classrooms/${classroomId}/reports/grades`,
    attendance: (classroomId: number) => `/classrooms/${classroomId}/reports/attendance`,
  },
  auditLogs: {
    list: '/audit-logs',
  },
} as const
