export const Role = {
  SuperAdmin:  'super_admin',
  Admin:       'admin',
  Teacher:     'teacher',
  Student:     'student',
  Family:      'family',
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const RoleLabel: Record<Role, string> = {
  super_admin: 'Super Administrator',
  admin:       'Coordinator',
  teacher:     'Trainer',
  student:     'Student',
  family:      'Family',
}
