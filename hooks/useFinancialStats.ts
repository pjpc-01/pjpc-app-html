import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'

export interface Transaction {
  id: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  type: 'payment' | 'refund'
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
  cashBalance: number
  monthlyExpenses: number
  netProfit: number
  cashFlowHistory: CashFlowRecord[]
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
    monthlyRevenue: 45600,
    totalRevenue: 285000,
    pendingPayments: 8,
    overduePayments: 3,
    recentTransactions: [
      {
        id: '1',
        amount: 5000,
        status: 'completed',
        type: 'payment',
        date: new Date('2024-01-15'),
        description: 'Student - Fee Payment',
        studentName: 'Student',
        paymentMethod: 'Bank Transfer'
      },
      {
        id: '2',
        amount: 4800,
        status: 'completed',
        type: 'payment',
        date: new Date('2024-01-14'),
        description: 'Student - Fee Payment',
        studentName: 'Student',
        paymentMethod: 'Cash'
      },
      {
        id: '3',
        amount: 5200,
        status: 'pending',
        type: 'payment',
        date: new Date('2024-01-13'),
        description: 'Student - Fee Payment',
        studentName: 'Student',
        paymentMethod: 'Payment'
      }
    ],
    revenueByMonth: {
      '2024-01': 45600,
      '2023-12': 42800,
      '2023-11': 41200,
      '2023-10': 39800,
      '2023-09': 38500,
      '2023-08': 37200
    },
    cashBalance: 125000,
    monthlyExpenses: 32000,
    netProfit: 13600,
    cashFlowHistory: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllFinancialStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await new Promise(resolve => setTimeout(resolve, 500))
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
            type: 'payment',
            date: new Date('2024-01-15'),
            description: 'Student - Fee Payment',
            studentName: 'Student',
            paymentMethod: 'Bank Transfer'
          },
          {
            id: '2',
            amount: 4800,
            status: 'completed',
            type: 'payment',
            date: new Date('2024-01-14'),
            description: 'Student - Fee Payment',
            studentName: 'Student',
            paymentMethod: 'Cash'
          },
          {
            id: '3',
            amount: 5200,
            status: 'pending',
            type: 'payment',
            date: new Date('2024-01-13'),
            description: 'Student - Fee Payment',
            studentName: 'Student',
            paymentMethod: 'Payment'
          }
        ],
        revenueByMonth: {
          '2024-01': 45600,
          '2023-12': 42800,
          '2023-11': 41200,
          '2023-10': 39800,
          '2023-09': 38500,
          '2023-08': 37200
        },
        cashBalance: 125000,
        monthlyExpenses: 32000,
        netProfit: 13600,
        cashFlowHistory: []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch financial data')
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