// 权限定义：谁可以做什么
// 用法：can(userRole, 'students.delete')

export type UserRole = 'admin' | 'teacher' | 'accountant' | 'parent'

export type Permission =
  // 学生管理
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'students.import'
  | 'students.export'
  // 教师管理
  | 'teachers.view'
  | 'teachers.create'
  | 'teachers.edit'
  | 'teachers.delete'
  // 财务管理
  | 'finance.view'
  | 'finance.create'
  | 'finance.edit'
  | 'finance.delete'
  | 'finance.export'
  // 课程管理
  | 'courses.view'
  | 'courses.create'
  | 'courses.edit'
  | 'courses.delete'
  // 考勤管理
  | 'attendance.view'
  | 'attendance.create'
  | 'attendance.edit'
  // 课表管理
  | 'schedule.view'
  | 'schedule.create'
  | 'schedule.edit'
  | 'schedule.delete'
  // 系统设置
  | 'settings.view'
  | 'settings.edit'
  // 积分管理
  | 'points.view'
  | 'points.create'
  | 'points.edit'

// 权限矩阵
const PERMISSION_MATRIX: Record<UserRole, Set<Permission>> = {
  admin: new Set([
    'students.view', 'students.create', 'students.edit', 'students.delete',
    'students.import', 'students.export',
    'teachers.view', 'teachers.create', 'teachers.edit', 'teachers.delete',
    'finance.view', 'finance.create', 'finance.edit', 'finance.delete', 'finance.export',
    'courses.view', 'courses.create', 'courses.edit', 'courses.delete',
    'attendance.view', 'attendance.create', 'attendance.edit',
    'schedule.view', 'schedule.create', 'schedule.edit', 'schedule.delete',
    'settings.view', 'settings.edit',
    'points.view', 'points.create', 'points.edit',
  ]),
  teacher: new Set([
    'students.view', 'students.create', 'students.edit',
    'students.import', 'students.export',
    'teachers.view',
    'courses.view',
    'attendance.view', 'attendance.create', 'attendance.edit',
    'schedule.view',
    'points.view', 'points.create', 'points.edit',
  ]),
  accountant: new Set([
    'students.view',
    'teachers.view',
    'finance.view', 'finance.create', 'finance.edit', 'finance.export',
    'attendance.view',
    'schedule.view',
    'points.view',
  ]),
  parent: new Set([
    'students.view',
    'attendance.view',
    'finance.view',
    'schedule.view',
    'points.view',
  ]),
}

export function can(role: UserRole, permission: Permission): boolean {
  const permissions = PERMISSION_MATRIX[role]
  if (!permissions) return false
  return permissions.has(permission)
}

export function usePermissions(userRole: UserRole = 'admin') {
  return {
    can: (permission: Permission) => can(userRole, permission),
    isAdmin: userRole === 'admin',
    isTeacher: userRole === 'teacher',
    isAccountant: userRole === 'accountant',
    isParent: userRole === 'parent',
  }
}
