import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'

export interface Activity {
  id: string
  type: 'login' | 'payment' | 'registration' | 'attendance'
  description: string
  timestamp: Date
  user: string
}

export interface DashboardStats {
  totalUsers: number
  totalStudents: number
  monthlyRevenue: number
  pendingApprovals: number
  todayAttendance: number
  activeTeachers: number
  totalParents: number
  systemHealth: number
  recentActivities: Activity[]
}

export const useDashboardStats = () => {
  const { user, userProfile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 156,
    totalStudents: 89,
    monthlyRevenue: 45600,
    pendingApprovals: 5,
    todayAttendance: 82,
    activeTeachers: 12,
    totalParents: 89,
    systemHealth: 98,
    recentActivities: [
      {
        id: '1',
        type: 'payment',
        description: '张三完成学费缴纳',
        timestamp: new Date('2024-01-15T10:30:00'),
        user: '张三'
      },
      {
        id: '2',
        type: 'attendance',
        description: '李四今日出勤',
        timestamp: new Date('2024-01-15T08:15:00'),
        user: '李四'
      },
      {
        id: '3',
        type: 'registration',
        description: '新学生王五注册',
        timestamp: new Date('2024-01-14T14:20:00'),
        user: '王五'
      }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 模拟获取统计数据
  const fetchAllStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      // 使用模拟数据
      setStats({
        totalUsers: 156,
        totalStudents: 89,
        monthlyRevenue: 45600,
        pendingApprovals: 5,
        todayAttendance: 82,
        activeTeachers: 12,
        totalParents: 89,
        systemHealth: 98,
        recentActivities: [
          {
            id: '1',
            type: 'payment',
            description: '张三完成学费缴纳',
            timestamp: new Date('2024-01-15T10:30:00'),
            user: '张三'
          },
          {
            id: '2',
            type: 'attendance',
            description: '李四今日出勤',
            timestamp: new Date('2024-01-15T08:15:00'),
            user: '李四'
          },
          {
            id: '3',
            type: 'registration',
            description: '新学生王五注册',
            timestamp: new Date('2024-01-14T14:20:00'),
            user: '王五'
          }
        ]
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error ? err.message : '获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllStats()
  }, [fetchAllStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchAllStats
  }
} 