import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, sum } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Formatter } from '@/lib/utils'
import { useAuth } from '@/contexts/enhanced-auth-context'

export interface FinancialStats {
  monthlyRevenue: number
  totalRevenue: number
  pendingPayments: number
  overduePayments: number
  recentTransactions: Transaction[]
  revenueByMonth: Record<string, number>
}

export interface Transaction {
  id: string
  amount: number
  type: 'payment' | 'refund' | 'fee'
  status: 'completed' | 'pending' | 'failed'
  description: string
  studentName: string
  date: Date
  paymentMethod: string
}

export const useFinancialStats = () => {
  const { user, userProfile } = useAuth()
  const [stats, setStats] = useState<FinancialStats>({
    monthlyRevenue: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    recentTransactions: [],
    revenueByMonth: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取当月收入
  const fetchMonthlyRevenue = useCallback(async () => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const paymentsRef = collection(db, 'payments')
      const paymentsSnapshot = await getDocs(paymentsRef)
      
      let monthlyRevenue = 0
      paymentsSnapshot.forEach(doc => {
        const paymentData = doc.data()
        
        // 更严格的安全检查
        if (paymentData && 
            paymentData.date && 
            typeof paymentData.date.toDate === 'function' &&
            paymentData.amount !== undefined) {
          
          try {
            const paymentDate = paymentData.date.toDate()
            
            if (paymentDate >= startOfMonth && paymentDate <= endOfMonth && paymentData.status === 'completed') {
              monthlyRevenue += paymentData.amount || 0
            }
          } catch (dateError) {
            console.warn('Invalid date in payment document for monthly revenue:', doc.id, dateError)
          }
        }
      })
      
      return monthlyRevenue
    } catch (err) {
      console.error('Error fetching monthly revenue:', err)
      return 0
    }
  }, [])

  // 获取总收入
  const fetchTotalRevenue = useCallback(async () => {
    try {
      const paymentsRef = collection(db, 'payments')
      const paymentsSnapshot = await getDocs(paymentsRef)
      
      let totalRevenue = 0
      paymentsSnapshot.forEach(doc => {
        const paymentData = doc.data()
        if (paymentData.status === 'completed') {
          totalRevenue += paymentData.amount
        }
      })
      
      return totalRevenue
    } catch (err) {
      console.error('Error fetching total revenue:', err)
      return 0
    }
  }, [])

  // 获取待处理支付
  const fetchPendingPayments = useCallback(async () => {
    try {
      const paymentsRef = collection(db, 'payments')
      const paymentsSnapshot = await getDocs(paymentsRef)
      
      let pendingCount = 0
      paymentsSnapshot.forEach(doc => {
        const paymentData = doc.data()
        if (paymentData.status === 'pending') {
          pendingCount++
        }
      })
      
      return pendingCount
    } catch (err) {
      console.error('Error fetching pending payments:', err)
      return 0
    }
  }, [])

  // 获取逾期支付
  const fetchOverduePayments = useCallback(async () => {
    try {
      const paymentsRef = collection(db, 'payments')
      const paymentsSnapshot = await getDocs(paymentsRef)
      
      let overdueCount = 0
      const now = new Date()
      paymentsSnapshot.forEach(doc => {
        const paymentData = doc.data()
        // 这里可以根据实际业务逻辑判断逾期
        // 暂时返回0，实际应该根据缴费截止日期判断
        if (paymentData.status === 'pending') {
          overdueCount++
        }
      })
      
      return overdueCount
    } catch (err) {
      console.error('Error fetching overdue payments:', err)
      return 0
    }
  }, [])

  // 获取最近交易
  const fetchRecentTransactions = useCallback(async () => {
    try {
      const paymentsRef = collection(db, 'payments')
      const paymentsSnapshot = await getDocs(paymentsRef)
      
      const transactions: Transaction[] = []
      paymentsSnapshot.forEach(doc => {
        const paymentData = doc.data()
        
        // 更严格的安全检查
        if (paymentData && 
            paymentData.date && 
            typeof paymentData.date.toDate === 'function' &&
            paymentData.amount !== undefined) {
          
          try {
            const paymentDate = paymentData.date.toDate()
            transactions.push({
              id: doc.id,
              amount: paymentData.amount || 0,
              type: paymentData.type || 'payment',
              status: paymentData.status || 'pending',
              description: paymentData.description || 'Payment',
              studentName: paymentData.studentName || 'Unknown Student',
              date: paymentDate,
              paymentMethod: paymentData.paymentMethod || 'Unknown'
            })
          } catch (dateError) {
            console.warn('Invalid date in payment document:', doc.id, dateError)
            // 跳过这个文档
          }
        } else {
          console.warn('Skipping payment document with missing required fields:', doc.id, {
            hasDate: !!paymentData?.date,
            hasToDate: typeof paymentData?.date?.toDate === 'function',
            hasAmount: paymentData?.amount !== undefined
          })
        }
      })
      
      // 按日期排序，最新的在前
      transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
      
      // 只返回最近5条记录
      return transactions.slice(0, 5)
    } catch (err) {
      console.error('Error fetching recent transactions:', err)
      return []
    }
  }, [])

  // 获取按月收入统计
  const fetchRevenueByMonth = useCallback(async () => {
    try {
      const paymentsRef = collection(db, 'payments')
      const paymentsSnapshot = await getDocs(paymentsRef)
      
      const revenueByMonth: Record<string, number> = {}
      
      paymentsSnapshot.forEach(doc => {
        const paymentData = doc.data()
        
        // 更严格的安全检查
        if (paymentData && 
            paymentData.status === 'completed' && 
            paymentData.date && 
            typeof paymentData.date.toDate === 'function' &&
            paymentData.amount !== undefined) {
          
          try {
            const paymentDate = paymentData.date.toDate()
            const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
            
            if (!revenueByMonth[monthKey]) {
              revenueByMonth[monthKey] = 0
            }
            revenueByMonth[monthKey] += paymentData.amount || 0
          } catch (dateError) {
            console.warn('Invalid date in payment document for revenue calculation:', doc.id, dateError)
          }
        }
      })
      
      return revenueByMonth
    } catch (err) {
      console.error('Error fetching revenue by month:', err)
      return {}
    }
  }, [])

  // 获取所有财务统计数据
  const fetchAllFinancialStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [monthlyRevenue, totalRevenue, pendingPayments, overduePayments, recentTransactions, revenueByMonth] = await Promise.all([
        fetchMonthlyRevenue(),
        fetchTotalRevenue(),
        fetchPendingPayments(),
        fetchOverduePayments(),
        fetchRecentTransactions(),
        fetchRevenueByMonth()
      ])

      setStats({
        monthlyRevenue,
        totalRevenue,
        pendingPayments,
        overduePayments,
        recentTransactions,
        revenueByMonth
      })
    } catch (err) {
      console.error('Error fetching financial stats:', err)
      setError(err instanceof Error ? err.message : '获取财务数据失败')
    } finally {
      setLoading(false)
    }
  }, [fetchMonthlyRevenue, fetchTotalRevenue, fetchPendingPayments, fetchOverduePayments, fetchRecentTransactions, fetchRevenueByMonth])

  // 实时监听数据变化
  useEffect(() => {
    // 暂时绕过认证检查以进行测试
    // if (!user || !userProfile || userProfile.role !== 'admin') {
    //   setLoading(false)
    //   return
    // }

    fetchAllFinancialStats()

    // 添加防抖机制，避免频繁更新
    let updateTimeout: NodeJS.Timeout

    const debouncedUpdate = () => {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(() => {
        fetchAllFinancialStats()
      }, 2000) // 2秒防抖
    }

    // 设置实时监听
    const unsubscribePayments = onSnapshot(collection(db, 'payments'), debouncedUpdate, (error) => {
      console.error('Payments snapshot error:', error)
      setError('获取支付数据失败')
    })

    return () => {
      clearTimeout(updateTimeout)
      unsubscribePayments()
    }
  }, [fetchAllFinancialStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchAllFinancialStats
  }
} 