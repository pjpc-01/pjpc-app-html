"use client"

import { useAuth } from '@/contexts/pocketbase-auth-context'

interface Permission {
  id: string
  name: string
  description: string
  roles: string[]
}

const PERMISSIONS: Permission[] = [
  // 学生管理权限
  { id: 'view_students', name: '查看学生', description: '查看学生信息', roles: ['admin', 'teacher', 'parent'] },
  { id: 'manage_students', name: '管理学生', description: '添加、编辑、删除学生', roles: ['admin', 'teacher'] },
  { id: 'view_own_children', name: '查看自己的孩子', description: '家长查看自己孩子的信息', roles: ['parent'] },
  
  // 教师管理权限
  { id: 'view_teachers', name: '查看教师', description: '查看教师信息', roles: ['admin'] },
  { id: 'manage_teachers', name: '管理教师', description: '添加、编辑、删除教师', roles: ['admin'] },
  
  // 积分管理权限
  { id: 'view_points', name: '查看积分', description: '查看积分信息', roles: ['admin', 'teacher', 'parent'] },
  { id: 'operate_points', name: '积分操作', description: '加分、扣分、兑换积分', roles: ['admin', 'teacher'] },
  { id: 'manage_points', name: '积分管理', description: '完整积分管理权限', roles: ['admin'] },
  
  // 考勤管理权限
  { id: 'view_attendance', name: '查看考勤', description: '查看考勤记录', roles: ['admin', 'teacher', 'parent'] },
  { id: 'manage_attendance', name: '管理考勤', description: '管理考勤记录', roles: ['admin', 'teacher'] },
  
  // 课程管理权限
  { id: 'view_schedule', name: '查看课程表', description: '查看课程安排', roles: ['admin', 'teacher', 'parent'] },
  { id: 'manage_schedule', name: '管理课程表', description: '管理课程安排', roles: ['admin', 'teacher'] },
  
  // 系统管理权限
  { id: 'system_settings', name: '系统设置', description: '系统配置管理', roles: ['admin'] },
  { id: 'view_reports', name: '查看报表', description: '查看统计报表', roles: ['admin', 'teacher'] },
  { id: 'manage_all', name: '全部管理', description: '完整系统管理权限', roles: ['admin'] }
]

export function usePermission() {
  const { user, userProfile } = useAuth()
  
  const hasPermission = (permissionId: string): boolean => {
    if (!userProfile) return false
    
    const permission = PERMISSIONS.find(p => p.id === permissionId)
    if (!permission) return false
    
    return permission.roles.includes(userProfile.role)
  }
  
  const getRolePermissions = (role: string): Permission[] => {
    return PERMISSIONS.filter(p => p.roles.includes(role))
  }
  
  const getUserPermissions = (): Permission[] => {
    if (!userProfile) return []
    return getRolePermissions(userProfile.role)
  }
  
  const canAccess = (permissionId: string): boolean => {
    return hasPermission(permissionId)
  }
  
  return {
    hasPermission,
    getRolePermissions,
    getUserPermissions,
    canAccess,
    userRole: userProfile?.role,
    permissions: PERMISSIONS
  }
}
