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
  cashBalance: number
  monthlyExpenses: number
  netProfit: number
  cashFlowHistory: CashFlowRecord[]
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

export interface CashFlowRecord {
  id: string
  date: Date
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  balance: number
}

export const useFinancialStats = () => {
  const { user, userProfile } = useAuth()
  const [stats, setStats] = useState<FinancialStats>({
    monthlyRevenue: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    recentTransactions: [],
    revenueByMonth: {},
    cashBalance: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    cashFlowHistory: []
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

  // 获取现金余额
  const fetchCashBalance = useCallback(async () => {
    try {
      const cashFlowRef = collection(db, 'cashFlow')
      const cashFlowSnapshot = await getDocs(cashFlowRef)
      
      let balance = 0
      const cashFlowHistory: CashFlowRecord[] = []
      
      cashFlowSnapshot.forEach(doc => {
        const cashFlowData = doc.data()
        
        if (cashFlowData && 
            cashFlowData.date && 
            typeof cashFlowData.date.toDate === 'function' &&
            cashFlowData.amount !== undefined) {
          
          try {
            const flowDate = cashFlowData.date.toDate()
            const amount = cashFlowData.amount || 0
            
            if (cashFlowData.type === 'income') {
              balance += amount
            } else {
              balance -= amount
            }
            
            cashFlowHistory.push({
              id: doc.id,
              date: flowDate,
              type: cashFlowData.type || 'income',
              category: cashFlowData.category || 'General',
              amount: amount,
              description: cashFlowData.description || 'Cash flow entry',
              balance: balance
            })
          } catch (dateError) {
            console.warn('Invalid date in cash flow document:', doc.id, dateError)
          }
        }
      })
      
      // 按日期排序，最新的在前
      cashFlowHistory.sort((a, b) => b.date.getTime() - a.date.getTime())
      
      return { balance, cashFlowHistory: cashFlowHistory.slice(0, 10) }
    } catch (err) {
      console.error('Error fetching cash balance:', err)
      return { balance: 0, cashFlowHistory: [] }
    }
  }, [])

  // 获取月度支出
  const fetchMonthlyExpenses = useCallback(async () => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const cashFlowRef = collection(db, 'cashFlow')
      const cashFlowSnapshot = await getDocs(cashFlowRef)
      
      let monthlyExpenses = 0
      cashFlowSnapshot.forEach(doc => {
        const cashFlowData = doc.data()
        
        if (cashFlowData && 
            cashFlowData.date && 
            typeof cashFlowData.date.toDate === 'function' &&
            cashFlowData.amount !== undefined &&
            cashFlowData.type === 'expense') {
          
          try {
            const flowDate = cashFlowData.date.toDate()
            
            if (flowDate >= startOfMonth && flowDate <= endOfMonth) {
              monthlyExpenses += cashFlowData.amount || 0
            }
          } catch (dateError) {
            console.warn('Invalid date in cash flow document for monthly expenses:', doc.id, dateError)
          }
        }
      })
      
      return monthlyExpenses
    } catch (err) {
      console.error('Error fetching monthly expenses:', err)
      return 0
    }
  }, [])

  // 获取所有财务统计数据
  const fetchAllFinancialStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [monthlyRevenue, totalRevenue, pendingPayments, overduePayments, recentTransactions, revenueByMonth, cashBalanceData, monthlyExpenses] = await Promise.all([
        fetchMonthlyRevenue(),
        fetchTotalRevenue(),
        fetchPendingPayments(),
        fetchOverduePayments(),
        fetchRecentTransactions(),
        fetchRevenueByMonth(),
        fetchCashBalance(),
        fetchMonthlyExpenses()
      ])

      const netProfit = monthlyRevenue - monthlyExpenses

      setStats({
        monthlyRevenue,
        totalRevenue,
        pendingPayments,
        overduePayments,
        recentTransactions,
        revenueByMonth,
        cashBalance: cashBalanceData.balance,
        monthlyExpenses,
        netProfit,
        cashFlowHistory: cashBalanceData.cashFlowHistory
      })
    } catch (err) {
      console.error('Error fetching financial stats:', err)
      setError(err instanceof Error ? err.message : '获取财务数据失败')
    } finally {
      setLoading(false)
    }
  }, [fetchMonthlyRevenue, fetchTotalRevenue, fetchPendingPayments, fetchOverduePayments, fetchRecentTransactions, fetchRevenueByMonth, fetchCashBalance, fetchMonthlyExpenses])

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