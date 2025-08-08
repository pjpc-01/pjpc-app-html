import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'

export interface Transaction {
  id: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  date: Date
  description: string
  studentName: string
  paymentMethod: string
}

export interface FinancialStats {
  monthlyRevenue: number
  totalRevenue: number
  pendingPayments: number
  overduePayments: number
  recentTransactions: Transaction[]
  revenueByMonth: Record<string, number>
}

export const useFinancialStats = () => {
  const { user, userProfile } = useAuth()
  const [stats, setStats] = useState<FinancialStats>({
    monthlyRevenue: 45600,
    totalRevenue: 285000,
    pendingPayments: 8,
    overduePayments: 3,
    recentTransactions: [
      {
        id: '1',
        amount: 5000,
        status: 'completed',
        date: new Date('2024-01-15'),
        description: '张三 - 学费',
        studentName: '张三',
        paymentMethod: '银行转账'
      },
      {
        id: '2',
        amount: 4800,
        status: 'completed',
        date: new Date('2024-01-14'),
        description: '李四 - 学费',
        studentName: '李四',
        paymentMethod: '现金'
      },
      {
        id: '3',
        amount: 5200,
        status: 'pending',
        date: new Date('2024-01-13'),
        description: '王五 - 学费',
        studentName: '王五',
        paymentMethod: '支票'
      }
    ],
    revenueByMonth: {
      '2024-01': 45600,
      '2023-12': 42800,
      '2023-11': 41200,
      '2023-10': 39800,
      '2023-09': 38500,
      '2023-08': 37200
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 模拟获取财务数据
  const fetchAllFinancialStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      // 使用模拟数据
      setStats({
        monthlyRevenue: 45600,
        totalRevenue: 285000,
        pendingPayments: 8,
        overduePayments: 3,
        recentTransactions: [
          {
            id: '1',
            amount: 5000,
            status: 'completed',
            date: new Date('2024-01-15'),
            description: '张三 - 学费',
            studentName: '张三',
            paymentMethod: '银行转账'
          },
          {
            id: '2',
            amount: 4800,
            status: 'completed',
            date: new Date('2024-01-14'),
            description: '李四 - 学费',
            studentName: '李四',
            paymentMethod: '现金'
          },
          {
            id: '3',
            amount: 5200,
            status: 'pending',
            date: new Date('2024-01-13'),
            description: '王五 - 学费',
            studentName: '王五',
            paymentMethod: '支票'
          }
        ],
        revenueByMonth: {
          '2024-01': 45600,
          '2023-12': 42800,
          '2023-11': 41200,
          '2023-10': 39800,
          '2023-09': 38500,
          '2023-08': 37200
        }
      })
    } catch (err) {
      console.error('Error fetching financial stats:', err)
      setError(err instanceof Error ? err.message : '获取财务数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllFinancialStats()
  }, [fetchAllFinancialStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchAllFinancialStats
  }
} 