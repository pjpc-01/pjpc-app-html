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
        const invResult = await fetchSecureData<any>('invoices', {
          fullList: true,
          sort: '-created'
        })
        invoices = Array.isArray(invResult) ? invResult : (invResult?.items || [])
      } catch (e) {
        console.warn('⚠️ Invoices fetch failed:', e)
      }
      
      // 2. Fetch Payments
      let payments: any[] = []
      try {
        const payResult = await fetchSecureData<any>('payments', {
          fullList: true,
          sort: '-created'
        })
        payments = Array.isArray(payResult) ? payResult : (payResult?.items || [])
      } catch (e) {
        console.warn('⚠️ Payments fetch failed:', e)
      }

      // 3. Fetch Expenses
      let expenses: any[] = []
      try {
        const expResult = await fetchSecureData<any>('expenses', {
          fullList: true,
          sort: '-date'
        })
        expenses = Array.isArray(expResult) ? expResult : (expResult?.items || [])
      } catch (e) {
        console.warn('⚠️ Expenses fetch failed:', e)
      }
      
      const currentMonth = new Date().toISOString().slice(0, 7)

      // Calculate Monthly Revenue
      const monthlyInvoices = safeInvoicesList.filter(invoice => 
        invoice.created && invoice.created.startsWith(currentMonth)
      )
      const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => 
        sum + (Number(invoice.total_amount) || 0), 0
      )

      const safeInvoicesList = Array.isArray(invoices) ? invoices : []
      
      // Calculate Total Revenue
      const totalRevenue = safeInvoicesList.reduce((sum, invoice) => 
        sum + (Number(invoice.total_amount) || 0), 0
      )

      // Calculate Monthly Expenses
      const monthlyExpenses = expenses
        .filter(exp => exp.date && exp.date.startsWith(currentMonth))
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)

      // Calculate Net Profit
      const netProfit = monthlyRevenue - monthlyExpenses

      // Pending and Overdue
      const pendingPayments = safeInvoicesList.filter(invoice => 
        invoice.status === 'issued' || invoice.status === 'pending'
      ).length
      
      const overduePayments = safeInvoicesList.filter(invoice => {
        if (!invoice.due_date) return false
        const dueDate = new Date(invoice.due_date)
        const today = new Date()
        return dueDate < today && (invoice.status === 'issued' || invoice.status === 'pending')
      }).length

      // Recent Transactions
      const safePaymentsList = Array.isArray(payments) ? payments : []
      const recentTransactions: Transaction[] = safePaymentsList.slice(0, 10).map(payment => ({
        id: payment.id,
        amount: Number(payment.amount) || 0,
        status: 'completed' as const,
        type: 'payment' as const,
        date: new Date(payment.date || payment.created),
        description: `付款 #${payment.id}`,
        studentName: '学生',
        paymentMethod: payment.method || '银行转账'
      }))

      // Revenue Trend
      const revenueByMonth: Record<string, number> = {}
      safeInvoicesList.forEach(invoice => {
        if (invoice.created) {
          const month = invoice.created.slice(0, 7)
          revenueByMonth[month] = (revenueByMonth[month] || 0) + (Number(invoice.total_amount) || 0)
        }
      })

      const totalPaid = safePaymentsList.reduce((sum, payment) => 
        sum + (Number(payment.amount) || 0), 0
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
