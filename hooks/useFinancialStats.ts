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
        description: '张三 - 学费',
        studentName: '张三',
        paymentMethod: '银行转账'
      },
      {
        id: '2',
        amount: 4800,
        status: 'completed',
        type: 'payment',
        date: new Date('2024-01-14'),
        description: '李四 - 学费',
        studentName: '李四',
        paymentMethod: '现金'
      },
      {
        id: '3',
        amount: 5200,
        status: 'pending',
        type: 'payment',
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
    },
    cashBalance: 125000,
    monthlyExpenses: 32000,
    netProfit: 13600,
    cashFlowHistory: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取真实财务数据
  const fetchAllFinancialStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 注意：认证现在在服务器端API路由中处理
      
      // 获取发票数据（添加错误处理）
      let invoices: any[] = []
      try {
        invoices = await fetchSecureData<any[]>('invoices', {
          fullList: true,
          sort: '-created'
        })
      } catch (error) {
        console.warn('⚠️ 获取发票数据失败，使用空数组:', error)
        invoices = []
      }
      
      // 获取支付数据（添加错误处理）
      let payments: any[] = []
      try {
        payments = await fetchSecureData<any[]>('payments', {
          fullList: true,
          sort: '-created'
        })
      } catch (error) {
        console.warn('⚠️ 获取支付数据失败，使用空数组:', error)
        payments = []
      }
      
      // 获取收据数据（添加错误处理）
      let receipts: any[] = []
      try {
        receipts = await fetchSecureData<any[]>('receipts', {
          fullList: true,
          sort: '-created'
        })
      } catch (error) {
        console.warn('⚠️ 获取收据数据失败，使用空数组:', error)
        receipts = []
      }

      // 计算月度收入
      const currentMonth = new Date().toISOString().slice(0, 7)
      const monthlyInvoices = invoices.filter(invoice => 
        invoice.created && invoice.created.startsWith(currentMonth)
      )
      const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => 
        sum + (Number(invoice.total_amount) || 0), 0
      )

      // 计算总收入
      const totalRevenue = invoices.reduce((sum, invoice) => 
        sum + (Number(invoice.total_amount) || 0), 0
      )

      // 计算待支付和逾期支付
      const pendingPayments = invoices.filter(invoice => 
        invoice.status === 'issued' || invoice.status === 'pending'
      ).length
      
      const overduePayments = invoices.filter(invoice => {
        if (!invoice.due_date) return false
        const dueDate = new Date(invoice.due_date)
        const today = new Date()
        return dueDate < today && (invoice.status === 'issued' || invoice.status === 'pending')
      }).length

      // 生成最近交易记录
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

      // 计算月度收入趋势
      const revenueByMonth: Record<string, number> = {}
      invoices.forEach(invoice => {
        if (invoice.created) {
          const month = invoice.created.slice(0, 7) // YYYY-MM
          revenueByMonth[month] = (revenueByMonth[month] || 0) + (Number(invoice.total_amount) || 0)
        }
      })

      // 计算现金余额（总收入 - 总支出，这里简化处理）
      const totalPaid = receipts.reduce((sum, receipt) => 
        sum + (Number(receipt.amount) || 0), 0
      )
      
      // 模拟月度支出（实际应该从支出记录中获取）
      const monthlyExpenses = Math.round(monthlyRevenue * 0.7) // 假设支出为收入的70%
      const netProfit = monthlyRevenue - monthlyExpenses

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