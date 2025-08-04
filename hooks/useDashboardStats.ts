import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Formatter } from '@/lib/utils'

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

export interface Activity {
  id: string
  time: string
  action: string
  user: string
  type: 'user' | 'attendance' | 'assignment' | 'payment' | 'login' | 'system'
  timestamp: Date
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    todayAttendance: 0,
    activeTeachers: 0,
    totalParents: 0,
    systemHealth: 100,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取用户统计
  const fetchUserStats = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      let totalUsers = 0
      let pendingApprovals = 0
      let activeTeachers = 0
      let totalParents = 0

      usersSnapshot.forEach(doc => {
        const userData = doc.data()
        totalUsers++
        
        if (userData.status === 'pending') {
          pendingApprovals++
        }
        
        if (userData.role === 'teacher' && userData.status === 'approved') {
          activeTeachers++
        }
        
        if (userData.role === 'parent' && userData.status === 'approved') {
          totalParents++
        }
      })

      return { totalUsers, pendingApprovals, activeTeachers, totalParents }
    } catch (err) {
      console.error('Error fetching user stats:', err)
      return { totalUsers: 0, pendingApprovals: 0, activeTeachers: 0, totalParents: 0 }
    }
  }, [])

  // 获取学生统计
  const fetchStudentStats = useCallback(async () => {
    try {
      // 获取小学学生
      const primaryStudentsRef = collection(db, 'primary_students')
      const primarySnapshot = await getDocs(primaryStudentsRef)
      const primaryCount = primarySnapshot.size

      // 获取中学学生
      const secondaryStudentsRef = collection(db, 'secondary_students')
      const secondarySnapshot = await getDocs(secondaryStudentsRef)
      const secondaryCount = secondarySnapshot.size

      const totalStudents = primaryCount + secondaryCount

      // 计算今日出勤（这里可以根据实际需求调整）
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const attendanceRate = 0.92 // 92% 出勤率，实际应该从数据库获取
      const todayAttendance = Math.round(totalStudents * attendanceRate)

      return { totalStudents, todayAttendance }
    } catch (err) {
      console.error('Error fetching student stats:', err)
      return { totalStudents: 0, todayAttendance: 0 }
    }
  }, [])

  // 获取财务统计
  const fetchFinancialStats = useCallback(async () => {
    try {
      // 这里应该从实际的财务数据集合获取
      // 暂时使用模拟数据，实际应该从 payments 或 invoices 集合获取
      const monthlyRevenue = 45600 // 实际应该计算当月收入
      
      return { monthlyRevenue }
    } catch (err) {
      console.error('Error fetching financial stats:', err)
      return { monthlyRevenue: 0 }
    }
  }, [])

  // 获取最近活动
  const fetchRecentActivities = useCallback(async () => {
    try {
      const activities: Activity[] = []
      
      // 获取最近登录的用户
      const usersRef = collection(db, 'users')
      const recentUsersQuery = query(
        usersRef,
        where('lastLogin', '!=', null),
        orderBy('lastLogin', 'desc'),
        limit(5)
      )
      
      const recentUsersSnapshot = await getDocs(recentUsersQuery)
      recentUsersSnapshot.forEach(doc => {
        const userData = doc.data()
        if (userData.lastLogin) {
          activities.push({
            id: doc.id,
            time: Formatter.formatDate(userData.lastLogin.toDate(), 'short'),
            action: '用户登录',
            user: userData.name || userData.email,
            type: 'login',
            timestamp: userData.lastLogin.toDate()
          })
        }
      })

      // 获取待审核用户
      const pendingUsersQuery = query(
        usersRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(3)
      )
      
      const pendingUsersSnapshot = await getDocs(pendingUsersQuery)
      pendingUsersSnapshot.forEach(doc => {
        const userData = doc.data()
        activities.push({
          id: doc.id,
          time: Formatter.formatDate(userData.createdAt?.toDate(), 'short'),
          action: '新用户注册',
          user: userData.name || userData.email,
          type: 'user',
          timestamp: userData.createdAt?.toDate() || new Date()
        })
      })

      // 按时间排序
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      
      return activities.slice(0, 10) // 返回最近10个活动
    } catch (err) {
      console.error('Error fetching recent activities:', err)
      return []
    }
  }, [])

  // 计算系统健康度
  const calculateSystemHealth = useCallback(() => {
    // 基于各种指标计算系统健康度
    // 这里可以根据实际需求调整计算逻辑
    return 98 // 暂时返回固定值，实际应该基于多个指标计算
  }, [])

  // 获取所有统计数据
  const fetchAllStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [userStats, studentStats, financialStats, recentActivities] = await Promise.all([
        fetchUserStats(),
        fetchStudentStats(),
        fetchFinancialStats(),
        fetchRecentActivities()
      ])

      const systemHealth = calculateSystemHealth()

      setStats({
        ...userStats,
        ...studentStats,
        ...financialStats,
        systemHealth,
        recentActivities
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error ? err.message : '获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }, [fetchUserStats, fetchStudentStats, fetchFinancialStats, fetchRecentActivities, calculateSystemHealth])

  // 实时监听数据变化
  useEffect(() => {
    fetchAllStats()

    // 设置实时监听（可选，用于实时更新）
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), () => {
      // 当用户数据变化时，重新获取统计
      fetchAllStats()
    })

    const unsubscribeStudents = onSnapshot(collection(db, 'primary_students'), () => {
      fetchAllStats()
    })

    const unsubscribeSecondaryStudents = onSnapshot(collection(db, 'secondary_students'), () => {
      fetchAllStats()
    })

    return () => {
      unsubscribeUsers()
      unsubscribeStudents()
      unsubscribeSecondaryStudents()
    }
  }, [fetchAllStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchAllStats
  }
} 