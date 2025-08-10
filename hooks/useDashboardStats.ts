import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import { useStudents } from '@/hooks/useStudents'

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
  const { students, loading: studentsLoading, error: studentsError } = useStudents({ dataType: undefined })
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 156,
    totalStudents: 0,
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

  const fetchAllStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)



      setStats(prevStats => ({
        ...prevStats,
        totalStudents: students.length,
        totalParents: students.length,
      }))
    } catch (err) {
      console.error('获取统计数据失败:', err)
      setError('获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }, [students])

  useEffect(() => {
    if (students.length > 0 || !studentsLoading) {
      fetchAllStats()
    }
  }, [fetchAllStats, students, studentsLoading])

  return {
    stats,
    loading: loading || studentsLoading,
    error: error || studentsError,
    refetch: fetchAllStats
  }
}

