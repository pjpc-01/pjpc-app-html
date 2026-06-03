import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import { fetchSecureData } from '@/lib/secure-api-client'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllFinancialStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Fetch Invoices
      let invoices: any[] = []
      try {
        invoices = await fetchSecureData<any[]>('invoices', {
          fullList: true,
          sort: '-created'
        })
      } catch (e) {
        console.warn('⚠️ Invoices fetch failed:', e)
      }
      
      // 2. Fetch Payments (Receipts)
      let receipts: any[] = []
      try {
        receipts = await fetchSecureData<any[]>('receipts', {
          fullList: true,
          sort: '-created'
        })
      } catch (e) {
        console.warn('⚠️ Receipts fetch failed:', e)
      }

      // 3. Fetch Expenses
      let expenses: any[] = []
      try {
        expenses = await fetchSecureData<any[]>('expenses', {
          fullList: true,
          sort: '-date'
        })
      } catch (e) {
        console.warn('⚠️ Expenses fetch failed:', e)
      }
      
      const currentMonth = new Date().toISOString().slice(0, 7)

      // Calculate Monthly Revenue
      const monthlyInvoices = invoices.filter(invoice => 
        invoice.created && invoice.created.startsWith(currentMonth)
      )
      const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => 
        sum + (Number(invoice.total_amount) || 0), 0
      )

      // Calculate Total Revenue
      const totalRevenue = invoices.reduce((sum, invoice) => 
        sum + (Number(invoice.total_amount) || 0), 0
      )

      // Calculate Monthly Expenses
      const monthlyExpenses = expenses
        .filter(exp => exp.date && exp.date.startsWith(currentMonth))
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)

      // Calculate Net Profit
      const netProfit = monthlyRevenue - monthlyExpenses

      // Pending and Overdue
      const pendingPayments = invoices.filter(invoice => 
        invoice.status === 'issued' || invoice.status === 'pending'
      ).length
      
      const overduePayments = invoices.filter(invoice => {
        if (!invoice.due_date) return false
        const dueDate = new Date(invoice.due_date)
        const today = new Date()
        return dueDate < today && (invoice.status === 'issued' || invoice.status === 'pending')
      }).length

      // Recent Transactions
      const recentTransactions: Transaction[] = receipts.slice(0, 10).map(receipt => ({
        id: receipt.id,
        amount: Number(receipt.amount) || 0,
        status: 'completed' as const,
        type: 'payment' as const,
        date: new Date(receipt.receipt_date || receipt.created),
        description: `收据 #${receipt.receipt_id || receipt.id}`,
        studentName: '学生',
        paymentMethod: '银行转账'
      }))

      // Revenue Trend
      const revenueByMonth: Record<string, number> = {}
      invoices.forEach(invoice => {
        if (invoice.created) {
          const month = invoice.created.slice(0, 7)
          revenueByMonth[month] = (revenueByMonth[month] || 0) + (Number(invoice.total_amount) || 0)
        }
      })

      const totalPaid = receipts.reduce((sum, receipt) => 
        sum + (Number(receipt.amount) || 0), 0
      )
      
      setStats({
        monthlyRevenue,
        totalRevenue,
        pendingPayments,
        overduePayments,
        recentTransactions,
        revenueByMonth,
        cashBalance: totalPaid,
        monthlyExpenses,
        netProfit,
        cashFlowHistory: []
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
