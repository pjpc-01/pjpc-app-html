import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, sum } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Formatter } from '@/lib/utils'

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

      // 这里应该从实际的支付记录集合获取
      // 暂时使用模拟数据，实际应该从 payments 集合获取
      const monthlyRevenue = 45600 // 实际应该计算当月收入
      
      return monthlyRevenue
    } catch (err) {
      console.error('Error fetching monthly revenue:', err)
      return 0
    }
  }, [])

  // 获取总收入
  const fetchTotalRevenue = useCallback(async () => {
    try {
      // 这里应该从实际的支付记录集合获取
      const totalRevenue = 125000 // 实际应该计算总收入
      
      return totalRevenue
    } catch (err) {
      console.error('Error fetching total revenue:', err)
      return 0
    }
  }, [])

  // 获取待处理支付
  const fetchPendingPayments = useCallback(async () => {
    try {
      // 这里应该从实际的支付记录集合获取
      const pendingPayments = 5 // 实际应该计算待处理支付数量
      
      return pendingPayments
    } catch (err) {
      console.error('Error fetching pending payments:', err)
      return 0
    }
  }, [])

  // 获取逾期支付
  const fetchOverduePayments = useCallback(async () => {
    try {
      // 这里应该从实际的支付记录集合获取
      const overduePayments = 2 // 实际应该计算逾期支付数量
      
      return overduePayments
    } catch (err) {
      console.error('Error fetching overdue payments:', err)
      return 0
    }
  }, [])

  // 获取最近交易
  const fetchRecentTransactions = useCallback(async () => {
    try {
      const transactions: Transaction[] = []
      
      // 这里应该从实际的交易记录集合获取
      // 暂时使用模拟数据
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          amount: 5000,
          type: 'payment',
          status: 'completed',
          description: '学费缴纳',
          studentName: '王小明',
          date: new Date(),
          paymentMethod: '银行转账'
        },
        {
          id: '2',
          amount: 3000,
          type: 'payment',
          status: 'pending',
          description: '教材费用',
          studentName: '李小红',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          paymentMethod: '现金'
        },
        {
          id: '3',
          amount: 2000,
          type: 'refund',
          status: 'completed',
          description: '退费',
          studentName: '张小华',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          paymentMethod: '银行转账'
        }
      ]
      
      return mockTransactions
    } catch (err) {
      console.error('Error fetching recent transactions:', err)
      return []
    }
  }, [])

  // 获取按月收入统计
  const fetchRevenueByMonth = useCallback(async () => {
    try {
      // 这里应该从实际的支付记录集合获取
      const revenueByMonth: Record<string, number> = {
        '2024-01': 42000,
        '2024-02': 38000,
        '2024-03': 45000,
        '2024-04': 48000,
        '2024-05': 52000,
        '2024-06': 49000,
        '2024-07': 51000,
        '2024-08': 45600
      }
      
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
    fetchAllFinancialStats()

    // 设置实时监听（可选，用于实时更新）
    // 这里可以监听支付记录的变化
    const unsubscribePayments = onSnapshot(collection(db, 'payments'), () => {
      fetchAllFinancialStats()
    })

    return () => {
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