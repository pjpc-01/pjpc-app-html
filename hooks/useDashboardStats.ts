import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import { useStudents } from '@/hooks/useStudents'
import { fetchMultipleCollections, fetchSecureData } from '@/lib/secure-api-client'

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
  const { students, loading: studentsLoading, error: studentsError } = useStudents()
  
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

  // 获取真实数据
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 注意：认证现在在服务器端API路由中处理
      
      // 并行获取所有数据
      const [
        usersResult,
        teachersResult,
        attendanceResult,
        invoicesResult,
        paymentsResult
      ] = await fetchMultipleCollections([
        { collection: 'users', options: { page: 1, perPage: 1 } },
        { collection: 'teachers', options: { page: 1, perPage: 1 } },
        { 
          collection: 'student_attendance', 
          options: { 
            page: 1, 
            perPage: 1,
            filter: `date >= "${new Date().toISOString().split('T')[0]}"`
          } 
        },
        { collection: 'invoices', options: { page: 1, perPage: 1 } },
        { collection: 'payments', options: { page: 1, perPage: 1 } }
      ]) as [{items: any[]}, {items: any[]}, {items: any[]}, {items: any[]}, {items: any[]}]

      // 计算月度收入
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const nextMonthStr = nextMonth.toISOString().slice(0, 7)
      
      // 获取月度发票数据（添加错误处理）
      let monthlyInvoices: { items: any[] } = { items: [] }
      try {
        const monthlyInvoicesResult = await fetchSecureData<{items: any[]}>('invoices', {
          page: 1,
          perPage: 100,
          filter: `created >= "${currentMonth}-01" && created < "${nextMonthStr}-01"`
        })
        monthlyInvoices = monthlyInvoicesResult as {items: any[]}
      } catch (error) {
        console.warn('⚠️ 获取月度发票数据失败，使用空数组:', error)
        monthlyInvoices = { items: [] }
      }
      
      const monthlyRevenue = monthlyInvoices.items.reduce((sum: number, invoice: any) => {
        return sum + (Number(invoice.total_amount) || 0)
      }, 0)

      // 计算今日出勤（添加错误处理）
      const today = new Date().toISOString().split('T')[0]
      let todayAttendanceResult: { items: any[], totalItems: number } = { items: [], totalItems: 0 }
      try {
        todayAttendanceResult = await fetchSecureData<{items: any[], totalItems: number}>('student_attendance', {
          page: 1,
          perPage: 100,
          filter: `date = "${today}" && status = "present"`
        }) as {items: any[], totalItems: number}
      } catch (error) {
        console.warn('⚠️ 获取今日出勤数据失败，使用空数据:', error)
        todayAttendanceResult = { items: [], totalItems: 0 }
      }

      // 获取最近活动
      const recentActivities: Activity[] = []
      
      // 从考勤记录获取活动（添加错误处理）
      let recentAttendance: { items: any[] } = { items: [] }
      try {
        recentAttendance = await fetchSecureData<{items: any[]}>('student_attendance', {
          page: 1,
          perPage: 5,
          sort: '-created'
        }) as {items: any[]}
      } catch (error) {
        console.warn('⚠️ 获取最近考勤数据失败，使用空数组:', error)
        recentAttendance = { items: [] }
      }
      
      recentAttendance.items.forEach((record: any) => {
        recentActivities.push({
          id: record.id,
          type: 'attendance',
          description: `${record.student_name} ${record.status === 'present' ? '出勤' : '缺勤'}`,
          timestamp: new Date(record.created),
          user: record.student_name || '未知学生'
        })
      })

      // 从积分交易获取活动（添加错误处理）
      let recentPoints: { items: any[] } = { items: [] }
      try {
        recentPoints = await fetchSecureData<{items: any[]}>('point_transactions', {
          page: 1,
          perPage: 3,
          sort: '-created'
        }) as {items: any[]}
      } catch (error) {
        console.warn('⚠️ 获取最近积分数据失败，使用空数组:', error)
        recentPoints = { items: [] }
      }
      
      recentPoints.items.forEach((record: any) => {
        recentActivities.push({
          id: record.id,
          type: 'payment',
          description: `积分交易: ${record.reason}`,
          timestamp: new Date(record.created),
          user: '系统'
        })
      })

      setStats({
        totalUsers: (usersResult as any).totalItems || usersResult.items.length,
        totalStudents: students.length,
        monthlyRevenue: monthlyRevenue,
        pendingApprovals: 0, // 需要根据实际业务逻辑计算
        todayAttendance: (todayAttendanceResult as any).totalItems || todayAttendanceResult.items.length,
        activeTeachers: (teachersResult as any).totalItems || teachersResult.items.length,
        totalParents: students.length, // 假设每个学生有一个家长
        systemHealth: 100, // 可以基于系统状态计算
        recentActivities: recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5)
      })
      
    } catch (err) {
      console.error('获取仪表板数据失败:', err)
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [students.length])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  return {
    stats,
    loading: loading || studentsLoading,
    error: error || studentsError,
    refetch: fetchDashboardStats
  }
}

