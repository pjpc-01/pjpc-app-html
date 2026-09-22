import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import { fetchSecureData } from '@/lib/secure-api-client'
import { toLocalMonthKey } from "@/lib/utils"
import {
  buildCenterMaps, inCenterScope, centerOfInvoice, centerOfInvoiceId,
  centerOfExpense, centerOfSalary,
} from '@/lib/center-scope'

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

export interface MonthPoint {
  month: string        // YYYY-MM
  revenue: number      // 当月实收（收款 - 退款）
  expense: number      // 当月支出（expenses）
  salary: number       // 当月薪资（净发 + 雇主 EPF/SOCSO/EIS）
  cost: number         // 当月总成本 = expense + salary
  profit: number       // 当月利润 = revenue - cost
  invoices: number     // 当月开票张数
  invoiceAmount: number // 当月开票金额（应收）
}

export interface FinancialStats {
  // ── 口径（2026-09-16 与用户确认）──
  // 收入：按【收款日】算，只认真的到账的钱（payments.status='completed'），减去退款
  // 成本：支出(expenses) + 薪资(teacher_salary_records，净发+雇主法定缴款)，薪资按【发放日 payment_date】归月
  // 应收：发票总额（invoices.totalAmount，排除已删），未收 = 应收 - 实收
  monthlyRevenue: number       // 本月实收（净）
  totalRevenue: number         // 累计实收（净）
  monthlyExpenses: number      // 本月支出
  monthlySalary: number        // 本月薪资成本
  monthlyCost: number          // 本月总成本
  netProfit: number            // 本月利润
  totalCost: number            // 累计总成本

  totalReceivable: number      // 累计应收（开票总额）
  totalReceived: number        // 累计实收
  totalUnreceived: number      // 未收 = 应收 - 实收
  pendingPayments: number      // 未缴发票张数
  overduePayments: number      // 逾期发票张数
  pendingAmount: number        // 未缴金额
  overdueAmount: number        // 逾期金额

  monthlySeries: MonthPoint[]  // 月度序列（图表用）

  recentTransactions: Transaction[]
  revenueByMonth: Record<string, number>
  cashBalance: number
  cashFlowHistory: CashFlowRecord[]
  centers: { code: string; name: string }[]   // 分行列表（供页面筛选）
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

const monthOf = (v: any): string => {
  if (!v) return ''
  const s = String(v)
  // 本地化：'2026-09-14 14:43:34.934Z' / '2026-09-14' 都取前 7 位
  return s.slice(0, 7)
}

export const useFinancialStats = (centerCode?: string) => {
  const { user, userProfile } = useAuth()
  const [stats, setStats] = useState<FinancialStats>({
    monthlyRevenue: 0, totalRevenue: 0,
    monthlyExpenses: 0, monthlySalary: 0, monthlyCost: 0, netProfit: 0, totalCost: 0,
    totalReceivable: 0, totalReceived: 0, totalUnreceived: 0,
    pendingPayments: 0, overduePayments: 0, pendingAmount: 0, overdueAmount: 0,
    monthlySeries: [],
    recentTransactions: [], revenueByMonth: {}, cashBalance: 0, cashFlowHistory: [], centers: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllFinancialStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 只有带 deleted 字段的集合才能过滤；否则 PB 遇到未知字段会直接报错，这里 catch 后静默返回空
      const HAS_DELETED = new Set(['invoices', 'payments', 'receipts', 'refunds', 'teacher_salary_records'])
      const grab = async (coll: string, sort: string): Promise<any[]> => {
        try {
          const opts: any = { fullList: true, sort }
          if (HAS_DELETED.has(coll)) opts.filter = 'deleted=false'
          const r = await fetchSecureData<any>(coll, opts)
          return Array.isArray(r) ? r : (r?.items || [])
        } catch (e) {
          console.warn(`⚠️ ${coll} fetch failed:`, e)
          return []
        }
      }

      const [invoices, payments, expenses, salaries, refunds, centers, students, teachers] = await Promise.all([
        grab('invoices', '-created'),
        grab('payments', '-date'),
        grab('expenses', '-date'),
        grab('teacher_salary_records', '-payment_date'),
        grab('refunds', '-created'),
        grab('centers', 'code'),
        grab('students', 'name'),
        grab('teachers', 'name'),
      ])

      // ── 分行归属（统一逻辑在 lib/center-scope.ts）──
      const cm = buildCenterMaps(centers, students, teachers, invoices)
      const payById: Record<string, any> = {}
      for (const p of payments) payById[p.id] = p
      const centerOfPayment = (pay: any): string => centerOfInvoiceId(pay?.invoiceId, cm)

      const fInvoices = invoices.filter(i => inCenterScope(centerOfInvoice(i, cm), centerCode))
      const fPayments = payments.filter(p => inCenterScope(centerOfPayment(p), centerCode))
      const fExpenses = expenses.filter(e => inCenterScope(centerOfExpense(e, cm), centerCode))
      const fSalaries = salaries.filter(s => inCenterScope(centerOfSalary(s, cm), centerCode))
      const fRefunds = refunds.filter(r => {
        const viaInv = centerOfInvoiceId(r.invoiceId, cm)
        if (viaInv) return inCenterScope(viaInv, centerCode)
        const pay = r.paymentId ? payById[r.paymentId] : null
        return inCenterScope(pay ? centerOfPayment(pay) : '', centerCode)
      })

      const currentMonth = toLocalMonthKey()

      // 发票月映射：收款按【发票所属月】归集
      // 用户 2026-09-16 确认：8 月开的票，钱 9 月才到账也要算 8 月（老板看的是"当月做了多少生意"）
      const invMonth = new Map<string, string>()
      for (const i of fInvoices) {
        if (i?.deleted) continue
        // 账期(period)优先 —— 它代表"这票是哪个月的学费"；没填才退回开票日
        const m = (i.period && /^\d{4}-\d{2}/.test(String(i.period)))
          ? String(i.period).slice(0, 7)
          : monthOf(i.issueDate || i.created)
        if (i?.id && m) invMonth.set(i.id, m)
      }

      // ── 实收（按发票所属月；找不到对应发票时退回收款日）──
      const payByMonth: Record<string, number> = {}
      let receivedTotal = 0
      for (const p of fPayments) {
        if (p?.status && p.status !== 'completed') continue
        const m = invMonth.get(p.invoiceId) || monthOf(p.date || p.created)
        if (!m) continue
        const amt = Number(p.amount) || 0
        payByMonth[m] = (payByMonth[m] || 0) + amt
        receivedTotal += amt
      }
      // 退款（减少实收）
      const refByMonth: Record<string, number> = {}
      let refundTotal = 0
      for (const r of fRefunds) {
        if (r?.status && r.status !== 'completed') continue
        const m = invMonth.get(r.invoiceId) || monthOf(r.created)
        if (!m) continue
        const amt = Number(r.amount) || 0
        refByMonth[m] = (refByMonth[m] || 0) + amt
        refundTotal += amt
      }
      const netRevenue = (m: string) => (payByMonth[m] || 0) - (refByMonth[m] || 0)

      // ── 支出（按费用日期）──
      const expByMonth: Record<string, number> = {}
      for (const e of fExpenses) {
        const m = monthOf(e.date || e.created)
        if (!m) continue
        expByMonth[m] = (expByMonth[m] || 0) + (Number(e.amount) || 0)
      }

      // ── 薪资（按【所属月份】，2026-09-16 用户确认）──
      // 看「每月该付多少人工」比看付款日直观；付款日容易跨月（7月的钱 8/7、9/7 才发）
      // 成本口径 = 净发 + 雇主 EPF/SOCSO/EIS（公司真实支出）
      const salByMonth: Record<string, number> = {}
      for (const s of fSalaries) {
        if (s?.deleted) continue
        const m = s.year ? `${s.year}-${String(s.month).padStart(2, '0')}` : monthOf(s.payment_date)
        if (!m) continue
        const cost = (Number(s.net_salary) || 0)
          + (Number(s.epf_employer) || 0)
          + (Number(s.socso_employer) || 0)
          + (Number(s.eis_employer) || 0)
        salByMonth[m] = (salByMonth[m] || 0) + cost
      }

      // ── 发票（应收 + 未收）──
      const invByMonth: Record<string, number> = {}
      const invCountByMonth: Record<string, number> = {}
      let receivable = 0
      let pendingCount = 0, overdueCount = 0, pendingAmt = 0, overdueAmt = 0
      const today = new Date(); today.setHours(0, 0, 0, 0)
      for (const i of fInvoices) {
        if (i?.deleted) continue
        const amt = Number(i.totalAmount ?? i.total_amount) || 0
        // 开票也按账期归月（与收款归月口径一致）
        const m = (i.period && /^\d{4}-\d{2}/.test(String(i.period)))
          ? String(i.period).slice(0, 7)
          : monthOf(i.issueDate || i.created)
        receivable += amt
        if (m) {
          invByMonth[m] = (invByMonth[m] || 0) + amt
          invCountByMonth[m] = (invCountByMonth[m] || 0) + 1
        }
        const unpaid = i.status === 'issued' || i.status === 'pending' || i.status === 'unpaid'
        if (unpaid) {
          pendingCount++; pendingAmt += amt
          const due = i.dueDate || i.due_date
          if (due) {
            const d = new Date(due)
            if (d < today) { overdueCount++; overdueAmt += amt }
          }
        }
      }

      // ── 月度序列 ──
      const months = Array.from(new Set([
        ...Object.keys(payByMonth), ...Object.keys(refByMonth),
        ...Object.keys(expByMonth), ...Object.keys(salByMonth), ...Object.keys(invByMonth)
      ])).filter(Boolean).sort()
      const monthlySeries: MonthPoint[] = months.map(m => {
        const revenue = netRevenue(m)
        const expense = expByMonth[m] || 0
        const salary = salByMonth[m] || 0
        const cost = expense + salary
        return { month: m, revenue, expense, salary, cost, profit: revenue - cost, invoices: invCountByMonth[m] || 0, invoiceAmount: invByMonth[m] || 0 }
      })

      // ── 本月 ──
      const monthlyRevenue = netRevenue(currentMonth)
      const monthlyExpenses = expByMonth[currentMonth] || 0
      const monthlySalary = salByMonth[currentMonth] || 0
      const monthlyCost = monthlyExpenses + monthlySalary
      const netProfit = monthlyRevenue - monthlyCost
      const totalCost = Object.values(expByMonth).reduce((a, b) => a + b, 0)
        + Object.values(salByMonth).reduce((a, b) => a + b, 0)
      const totalReceived = receivedTotal - refundTotal

      const revenueByMonth: Record<string, number> = {}
      for (const m of months) revenueByMonth[m] = netRevenue(m)

      // 最近交易（带真实学生名，从发票反查）
      const invById: Record<string, any> = {}
      for (const i of fInvoices) invById[i.id] = i
      const recentTransactions: Transaction[] = fPayments.slice(0, 10).map(p => {
        const inv = invById[p.invoiceId] || {}
        return {
          id: p.id,
          amount: Number(p.amount) || 0,
          status: 'completed' as const,
          type: 'payment' as const,
          date: new Date(p.date || p.created),
          description: inv.invoiceNumber ? `发票 ${inv.invoiceNumber}` : `收款 #${p.id}`,
          studentName: inv.studentName || p.studentName || '—',
          paymentMethod: p.method || '银行转账'
        }
      })

      setStats({
        monthlyRevenue, totalRevenue: totalReceived,
        monthlyExpenses, monthlySalary, monthlyCost, netProfit, totalCost,
        totalReceivable: receivable, totalReceived,
        totalUnreceived: Math.max(0, receivable - totalReceived),
        pendingPayments: pendingCount, overduePayments: overdueCount,
        pendingAmount: pendingAmt, overdueAmount: overdueAmt,
        monthlySeries,
        recentTransactions, revenueByMonth,
        cashBalance: totalReceived,
        cashFlowHistory: [],
        centers: cm.centers
      })
    } catch (err) {
      console.error('Error fetching financial stats:', err)
      setError(err instanceof Error ? err.message : '获取财务数据失败')
    } finally {
      setLoading(false)
    }
  }, [centerCode])

  useEffect(() => {
    fetchAllFinancialStats()
  }, [fetchAllFinancialStats])

  return { stats, loading, error, refetch: fetchAllFinancialStats }
}
