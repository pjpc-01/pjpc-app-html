"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, TrendingUp, Calendar, DollarSign, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useFinancialStats } from "@/hooks/useFinancialStats"
import { useInvoices } from "@/hooks/useInvoices"
import { usePayments } from "@/hooks/usePayments"
import { useExpenses } from "@/hooks/useExpenses"
import { useCenterScope } from "@/hooks/useCenterScope"
import { inCenterScope, centerOfInvoice, centerOfInvoiceId, centerOfExpense, UNASSIGNED_CENTER } from "@/lib/center-scope"
import { exportPnLPDF } from "@/lib/pdf-export"
import { toast } from "sonner"
import RevenueChart from "../charts/RevenueChart"
import ProfitChart from "../charts/ProfitChart"
import ExpenseChart from "../charts/ExpenseChart"
import { useLanguage } from "@/contexts/language-context"

const CATEGORY_LABELS: Record<string, string> = {
  salary: "教师薪资",
  rent: "办公室租金",
  utilities: "水电费",
  marketing: "市场推广",
  stationery: "办公文具",
  maintenance: "设备维护",
  misc: "其他杂项",
}

// 金额统一显示 2 位小数
const fmtMoney = (n: number) => (Number(n) || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function FinancialReports() {
  const { t } = useLanguage()
  // 分行筛选：全部 / 各分行 / 未分配（归属规则见 lib/center-scope.ts）
  const [centerFilter, setCenterFilter] = useState("all")
  const { stats: financialStats, loading: financialLoading } = useFinancialStats(centerFilter)
  const { invoices } = useInvoices()
  const { payments } = usePayments()
  const { expenses } = useExpenses()
  const centerScope = useCenterScope()
  const [selectedReportType, setSelectedReportType] = useState("monthly")
  // 选中的月份（默认当前月）—— 像翻日历一样看某个月的财务状况
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`
  })

  const reportTypes = [
    { id: "monthly", name: "月度收入报告", icon: Calendar },
    { id: "fee", name: "收费项目分析", icon: DollarSign },
    { id: "profit", name: "收支利润分析", icon: TrendingUp },
    { id: "trend", name: "收入趋势分析", icon: TrendingUp },
  ]

  // Safe arrays —— 按分行筛选（源头统一在 lib/center-scope.ts）
  const safeInvoices = (Array.isArray(invoices) ? invoices : [])
    .filter((i: any) => inCenterScope(centerOfInvoice(i, centerScope), centerFilter))
  const safePayments = (Array.isArray(payments) ? payments : [])
    .filter((pp: any) => inCenterScope(centerOfInvoiceId(pp.invoiceId, centerScope), centerFilter))
  const safeExpenses = (Array.isArray(expenses) ? expenses : [])
    .filter((e: any) => inCenterScope(centerOfExpense(e, centerScope), centerFilter))

  // 发票归属月：账期(period)优先，没填才用开票日 —— 与财务报表口径一致
  const invMonthOf = (i: any): string => {
    const pp = String(i?.period || "")
    if (/^\d{4}-\d{2}/.test(pp)) return pp.slice(0, 7)
    return String(i?.issueDate || i?.created || "").slice(0, 7)
  }

  // Revenue data from real stats
  const revenueByMonth = financialStats.revenueByMonth || {}
  const revenueEntries = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)

  // 月度数据 —— 口径统一来自 useFinancialStats.monthlySeries
  // 收入=实收(收款日,已扣退款) | 支出=expenses | 薪资=净发+雇主EPF/SOCSO/EIS(按发放日) | 利润=收入-总成本
  const allMonths = (financialStats.monthlySeries || []).map(m => ({
    month: m.month,
    revenue: m.revenue,
    expense: m.expense,
    salary: m.salary,
    cost: m.cost,
    profit: m.profit,
    invoices: m.invoices,
    invoiceAmount: m.invoiceAmount,
    // 缴费学生数：同样按【账期】归月，与收入口径一致
    students: new Set(safePayments
      .filter(p => (p.status ? p.status === "completed" : true))
      .filter(p => {
        const inv = safeInvoices.find(i => i.id === p.invoiceId)
        const pm = inv ? invMonthOf(inv) : String(p.date || p.created || "").slice(0, 7)
        return pm === m.month
      })
      .map(p => p.invoiceId)).size,
  }))


  // 资产负债概览（累计）数字
  const balanceSheet = (() => {
    const paidByInv = new Map<string, number>()
    safePayments.filter(pp => !pp.status || pp.status === 'completed').forEach(pp => {
      paidByInv.set(pp.invoiceId, (paidByInv.get(pp.invoiceId) || 0) + (Number(pp.amount) || 0))
    })
    let receivable = 0
    safeInvoices.forEach(iv => {
      const due = Number(iv.totalAmount || 0); const got = paidByInv.get(iv.id) || 0
      if (due - got > 0.01) receivable += due - got
    })
    const income = safePayments.filter(pp => !pp.status || pp.status === 'completed').reduce((a, pp) => a + (Number(pp.amount) || 0), 0)
    const expensesTotal = safeExpenses.reduce((a, e) => a + (Number(e.amount) || 0), 0)
    const salaryCost = financialStats.totalCost || 0
    const salaryOnly = Math.max(0, salaryCost - expensesTotal)
    const cost = expensesTotal + salaryOnly
    // 应付薪资:当月已生成但发薪日在未来的
    const now = new Date()
    const curYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const payableSalary = (financialStats.monthlySeries || [])
      .filter(m => m.month === curYm)
      .reduce((a, m) => a + (m.salary || 0), 0)
    return { receivable, payableSalary, income, cost, profit: income - cost }
  })()

  // 图表只用最近 6 个月，避免太挤
  // 全部月份都可查看（不再截断成最近 6 个月）
  const monthlyReportData = allMonths

  // 选中月份的显示名，如 "2026年8月"
  const monthLabel = (() => {
    const m = String(selectedMonth || "").match(/^(\d{4})-(\d{2})/)
    return m ? `${m[1]}年${Number(m[2])}月` : String(selectedMonth || "")
  })()

  // 某月「未收金额」= 该月开票的票里，至今尚未收完的部分（跨月累计欠款）
  const unpaidOfMonth = (ym: string): number => {
    let unpaid = 0
    safeInvoices.filter(iv => invMonthOf(iv) === ym).forEach(iv => {
      const got = safePayments
        .filter(pp => pp.invoiceId === iv.id && (!pp.status || pp.status === "completed"))
        .reduce((a, pp) => a + (Number(pp.amount) || 0), 0)
      unpaid += Math.max((Number(iv.totalAmount) || 0) - got, 0)
    })
    return unpaid
  }

  // 选中月份的数据（顶部卡片 + 利润分析都用它，不再用累计总额）
  const cur = allMonths.find(m => m.month === selectedMonth) || {
    month: selectedMonth, revenue: 0, expense: 0, salary: 0, cost: 0, profit: 0, invoices: 0, invoiceAmount: 0, students: 0,
  }

  // Fee analysis from real fee items in payments
  const feeAnalysis = (() => {
    const totalRevenue = safePayments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const categories: Record<string, { amount: number; count: number }> = {}
    safePayments.filter(p => p.status === "completed").forEach(p => {
      const cat = p.method || "其他"
      if (!categories[cat]) categories[cat] = { amount: 0, count: 0 }
      categories[cat].amount += Number(p.amount) || 0
      categories[cat].count++
    })
    return Object.entries(categories).map(([method, data]) => ({
      item: method === "Bank Transfer" ? "银行转账" : method === "Cash" ? "现金" : method === "Online Banking" ? "网银" : method,
      revenue: data.amount,
      percentage: totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0,
      students: data.count,
    }))
  })()

  // Expense breakdown from real expenses
  const expenseBreakdown = (() => {
    const cats: Record<string, number> = {}
    // 只统计【所选月份】的支出（原来用的是全部累计）
    safeExpenses
      .filter(e => String(e.date || e.created || "").slice(0, 7) === selectedMonth)
      .forEach(e => {
        const cat = CATEGORY_LABELS[e.category] || e.category || "其他"
        cats[cat] = (cats[cat] || 0) + (Number(e.amount) || 0)
      })
    // 薪资是最大成本项，单列出来；取所选月份的薪资成本
    const salaryTotal = cur.salary || 0
    if (salaryTotal > 0) cats["薪资"] = salaryTotal
    const total = Object.values(cats).reduce((s, v) => s + v, 0)
    return Object.entries(cats).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
  })()

  // Reconciliation
  const reconciliationStatus = (() => {
    const totalInvoiced = safeInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)
    // 用「实收(已扣退款)」而非缴费流水原额，差额才是真实未收；否则退款会被算成"差异"
    const totalPaid = financialStats.totalReceived
    const paidInvoices = safeInvoices.filter(inv => {
      const invoicePayments = safePayments.filter(p => p.invoiceId === inv.id)
      const paid = invoicePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      return paid >= (Number(inv.totalAmount) || 0)
    }).length
    return {
      totalInvoices: safeInvoices.length,
      totalPayments: safePayments.length,
      totalInvoiced,
      totalPaid,
      difference: totalPaid - totalInvoiced,
      isBalanced: Math.abs(totalPaid - totalInvoiced) < 0.01,
      paidInvoices,
      unpaidInvoices: safeInvoices.length - paidInvoices,
    }
  })()

  // Financial summary
  const financialSummary = (() => {
    const completedPayments = safePayments.filter(p => p.status === "completed")
    // 口径统一来自 useFinancialStats：收入=实收(收款日,扣退款)；成本=支出+薪资(含雇主法定缴款)
    const totalIncome = financialStats.totalReceived
    const totalExpenses = financialStats.totalCost
    const netProfit = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome * 100) : 0
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      expenses: expenseBreakdown.length > 0
        ? expenseBreakdown
        : [{ category: "暂无支出数据", amount: 0, percentage: 0 }],
      successfulPayments: completedPayments.length,
      totalPayments: safePayments.length,
    }
  })()

  const handleExportPnL = () => {
    try {
      exportPnLPDF({
        title: "PJPC 损益报表",
        period: new Date().toLocaleDateString("zh-CN"),
        totalRevenue: financialSummary.totalIncome,
        totalExpenses: financialSummary.totalExpenses,
        netProfit: financialSummary.netProfit,
        revenueItems: [{ label: "学费收入", amount: financialSummary.totalIncome }],
        expenseItems: financialSummary.expenses.map(e => ({ label: e.category, amount: e.amount })),
      })
      toast.success("PDF 报表已下载")
    } catch (err) {
      toast.error("导出 PDF 失败")
    }
  }

  return (
    <div className="space-y-6">
      {/* 报表控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            财务报表
          </CardTitle>
          <CardDescription>基于实际数据的收入支出统计报告</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label>报告类型</Label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleExportPnL}>
                <Download className="h-4 w-4 mr-2" />
                导出 PDF 报表
              </Button>
            </div>
            <div className="w-44">
              <Label>分行</Label>
              <Select value={centerFilter} onValueChange={setCenterFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分行</SelectItem>
                  {centerScope.options.map(o => (
                    <SelectItem key={o.code} value={o.code}>{o.name}</SelectItem>
                  ))}
                  <SelectItem value={UNASSIGNED_CENTER}>未分配</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>选择月份</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 收支概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            收支概览
          </CardTitle>
          <CardDescription>
            {financialLoading ? "加载中..." : `以下是 ${monthLabel} 的经营数据（收入按账期归月，成本含教师薪资）`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {financialLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>加载财务数据...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{monthLabel} 收入</p>
                  <p className="text-2xl font-bold text-green-600">RM {fmtMoney(cur.revenue)}</p>
                  <p className="text-xs text-gray-500">{cur.students} 位学生缴费</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{monthLabel} 薪资</p>
                  <p className="text-2xl font-bold text-purple-600">RM {fmtMoney(cur.salary)}</p>
                  <p className="text-xs text-gray-500">教师薪资（最大成本）</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{monthLabel} 其他支出</p>
                  <p className="text-2xl font-bold text-red-600">RM {fmtMoney(cur.expense)}</p>
                  <p className="text-xs text-gray-500">水电、杂项等</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{monthLabel} 净利润</p>
                  <p className={`text-2xl font-bold ${cur.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    RM {fmtMoney(cur.profit)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {cur.revenue > 0 ? `利润率 ${((cur.profit / cur.revenue) * 100).toFixed(1)}%` : "利润率 —"}
                  </p>
                </div>
              </div>

              {/* 图表区 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {monthlyReportData.length > 0 && (
                  <RevenueChart data={monthlyReportData.map(d => ({ month: d.month.slice(5), amount: Math.round(d.revenue) }))} />
                )}
                {expenseBreakdown.length > 0 && (
                  <ExpenseChart data={expenseBreakdown.map(e => ({ name: e.category, value: Math.round(e.amount) }))} />
                )}
              </div>
              {monthlyReportData.length > 0 && (
                <div className="mt-6">
                  <ProfitChart data={monthlyReportData.map(d => {
                    return { month: d.month.slice(5), profit: Math.round(d.profit) }
                  })} />
                </div>
              )}

              {/* 支出明细 */}
              {expenseBreakdown.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">支出明细</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenseBreakdown.map(exp => (
                      <div key={exp.category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{exp.category}</p>
                          <p className="text-sm text-gray-600">{exp.percentage}%</p>
                        </div>
                        <p className="text-lg font-semibold text-red-600">RM {fmtMoney(exp.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 月度收支对比 */}
              {monthlyReportData.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-4">月度收支对比</h3>
                  <div className="space-y-3">
                    {monthlyReportData.map(data => {
                      const monthlyExp = data.expense
                      const monthlySalary = data.salary
                      const monthlyProfit = data.profit
                      return (
                        <div key={data.month} className="flex justify-between items-center p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{data.month}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="text-green-700">实收: <span className="font-medium">RM {fmtMoney(data.revenue)}</span></span>
                              <span className="text-red-600">支出: <span className="font-medium">RM {fmtMoney(monthlyExp)}</span></span>
                              <span className="text-orange-600">薪资: <span className="font-medium">RM {fmtMoney(monthlySalary)}</span></span>
                              <span className="text-blue-700">开票: <span className="font-medium">{data.invoices} 张 / RM {fmtMoney(data.invoiceAmount)}</span></span>
                              {(() => {
                                const unpaid = unpaidOfMonth(data.month)
                                return (
                                  <span className={unpaid > 0.01 ? "text-red-700 font-semibold" : "text-slate-400"}>
                                    未收: RM {fmtMoney(unpaid)}
                                  </span>
                                )
                              })()}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              RM {fmtMoney(monthlyProfit)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {data.revenue > 0 ? `${((monthlyProfit / data.revenue) * 100).toFixed(1)}% 利润率` : "利润率 —"}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 财务对账 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            财务总览（全部）
          </CardTitle>
          <CardDescription>发票与缴费数据一致性检查</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">对账状态</p>
                <div className="flex items-center gap-2 mt-1">
                  {reconciliationStatus.isBalanced ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className={`text-sm font-medium ${reconciliationStatus.isBalanced ? "text-green-600" : "text-amber-600"}`}>
                    {reconciliationStatus.isBalanced ? "已对平" : "尚有未收款"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">发票总金额</p>
                <p className="text-lg font-semibold">RM {fmtMoney(reconciliationStatus.totalInvoiced)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">缴费总金额</p>
                <p className="text-lg font-semibold">RM {fmtMoney(reconciliationStatus.totalPaid)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">未收金额</p>
                <p className={`text-lg font-semibold ${reconciliationStatus.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                  RM {fmtMoney(Math.abs(reconciliationStatus.difference))}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">总发票数</p>
              <p className="text-xl font-bold text-blue-600">{reconciliationStatus.totalInvoices}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">已缴费发票</p>
              <p className="text-xl font-bold text-green-600">{reconciliationStatus.paidInvoices}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">未缴费发票</p>
              <p className="text-xl font-bold text-orange-600">{reconciliationStatus.unpaidInvoices}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 月度收入报告 */}
      {selectedReportType === "monthly" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              月度收入报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            {financialLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>加载报告数据...</span>
              </div>
            ) : monthlyReportData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无月度数据</div>
            ) : (
              <div className="space-y-6">

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>月份</TableHead>
                      <TableHead>收入金额</TableHead>
                      <TableHead>缴费学生</TableHead>
                      <TableHead>发票数量</TableHead>
                      <TableHead>平均收入</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReportData.map(data => (
                      <TableRow key={data.month}>
                        <TableCell className="font-medium">{data.month}</TableCell>
                        <TableCell>RM {fmtMoney(data.revenue)}</TableCell>
                        <TableCell>{data.students}</TableCell>
                        <TableCell>{data.invoices}</TableCell>
                        <TableCell>RM {data.students > 0 ? Math.round(data.revenue / data.students).toLocaleString() : 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 收费项目分析 */}
      {selectedReportType === "fee" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              收费项目分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeAnalysis.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无缴费数据</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {feeAnalysis.map(fee => (
                    <div key={fee.item} className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold">{fee.item}</div>
                      <div className="text-2xl font-bold text-blue-600">RM {fmtMoney(fee.revenue)}</div>
                      <div className="text-sm text-gray-600">{fee.students} 笔</div>
                      <div className="text-xs text-gray-500">{fee.percentage}%</div>
                    </div>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>支付方式</TableHead>
                      <TableHead>收入金额</TableHead>
                      <TableHead>笔数</TableHead>
                      <TableHead>占比</TableHead>
                      <TableHead>平均金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeAnalysis.map(fee => (
                      <TableRow key={fee.item}>
                        <TableCell className="font-medium">{fee.item}</TableCell>
                        <TableCell>RM {fmtMoney(fee.revenue)}</TableCell>
                        <TableCell>{fee.students}</TableCell>
                        <TableCell>{fee.percentage}%</TableCell>
                        <TableCell>RM {fee.students > 0 ? Math.round(fee.revenue / fee.students).toLocaleString() : 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 收入趋势分析 */}
      {selectedReportType === "trend" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              收入趋势分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyReportData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无趋势数据</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {monthlyReportData.length >= 2
                        ? `${((monthlyReportData[0].revenue - monthlyReportData[1].revenue) / (monthlyReportData[1].revenue || 1) * 100).toFixed(1)}%`
                        : "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">环比增长</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {monthlyReportData.length >= 6
                        ? `${((monthlyReportData[0].revenue - monthlyReportData[5].revenue) / (monthlyReportData[5].revenue || 1) * 100).toFixed(1)}%`
                        : "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">长期趋势</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      RM {fmtMoney((monthlyReportData[0]?.revenue || 0))}
                    </div>
                    <div className="text-sm text-gray-600">当前月收入</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold">月度趋势</h3>
                  {monthlyReportData.map((data, index) => {
                    const prevData = monthlyReportData[index + 1]
                    const growth = prevData ? ((data.revenue - prevData.revenue) / (prevData.revenue || 1) * 100).toFixed(1) : 0
                    return (
                      <div key={data.month} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{data.month}</div>
                          <div className="text-sm text-gray-600">RM {fmtMoney(data.revenue)}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${parseFloat(String(growth)) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {parseFloat(String(growth)) >= 0 ? "+" : ""}{growth}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 收入趋势图表 */}
      {selectedReportType === "trend" && monthlyReportData.length > 0 && (
        <RevenueChart data={monthlyReportData.map(d => ({ month: d.month, amount: Math.round(d.revenue) }))} />
      )}

      {/* 收支利润分析 */}
      {selectedReportType === "profit" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              收支利润分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{monthLabel} 收入</p>
                  <p className="text-2xl font-bold text-green-600">RM {fmtMoney(cur.revenue)}</p>
                  <p className="text-xs text-gray-600">{cur.students} 位学生缴费</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{monthLabel} 总成本</p>
                  <p className="text-2xl font-bold text-red-600">RM {fmtMoney(cur.cost)}</p>
                  <p className="text-xs text-gray-600">薪资 + 其他支出</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">{monthLabel} 净利润</p>
                  <p className={`text-2xl font-bold ${cur.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    RM {fmtMoney(cur.profit)}
                  </p>
                  <p className="text-xs text-gray-600">{cur.revenue > 0 ? `利润率 ${((cur.profit / cur.revenue) * 100).toFixed(1)}%` : "利润率 —"}</p>
                </div>
              </div>

              {expenseBreakdown.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">支出明细表</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>支出类别</TableHead>
                        <TableHead>{t('finance.amount')}</TableHead>
                        <TableHead>占比</TableHead>
                        <TableHead>占收入比例</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseBreakdown.map(exp => (
                        <TableRow key={exp.category}>
                          <TableCell className="font-medium">{exp.category}</TableCell>
                          <TableCell className="text-red-600">RM {fmtMoney(exp.amount)}</TableCell>
                          <TableCell>{exp.percentage}%</TableCell>
                          <TableCell>
                            {cur.revenue > 0
                              ? ((exp.amount / cur.revenue) * 100).toFixed(1)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell className="font-semibold">{t('finance.total')}</TableCell>
                        <TableCell className="font-semibold text-red-600">RM {fmtMoney(cur.cost)}</TableCell>
                        <TableCell className="font-semibold">100%</TableCell>
                        <TableCell className="font-semibold">
                          {financialSummary.totalIncome > 0
                            ? ((financialSummary.totalExpenses / financialSummary.totalIncome) * 100).toFixed(1)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 净利润图表 */}
      {selectedReportType === "profit" && monthlyReportData.length > 0 && (
        <ProfitChart data={monthlyReportData.map(d => ({ month: d.month, profit: Math.round(d.profit) }))} />
      )}

      {/* 支出分类图表 */}
      {selectedReportType === "profit" && expenseBreakdown.length > 0 && (
        <ExpenseChart data={expenseBreakdown.map(e => ({ name: e.category, value: Math.round(e.amount) }))} />
      )}

      {/* AR 账龄分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            应收账款账龄分析
          </CardTitle>
          <CardDescription>按逾期天数分组的未收款项</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const now = new Date()
            const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 }
            safeInvoices
              .filter(inv => inv.status === "issued" || inv.status === "pending" || inv.status === "overdue")
              .forEach(inv => {
                const dueDate = inv.dueDate || inv.due_date
                if (!dueDate) {
                  buckets.current += Number(inv.totalAmount) || 0
                  return
                }
                const due = new Date(dueDate)
                const daysDiff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
                if (daysDiff <= 0) buckets.current += Number(inv.totalAmount) || 0
                else if (daysDiff <= 30) buckets.d1_30 += Number(inv.totalAmount) || 0
                else if (daysDiff <= 60) buckets.d31_60 += Number(inv.totalAmount) || 0
                else if (daysDiff <= 90) buckets.d61_90 += Number(inv.totalAmount) || 0
                else buckets.d90plus += Number(inv.totalAmount) || 0
              })
            const agingBuckets = [
              { label: "未逾期", color: "bg-green-500", value: buckets.current },
              { label: "1-30天", color: "bg-yellow-500", value: buckets.d1_30 },
              { label: "31-60天", color: "bg-orange-500", value: buckets.d31_60 },
              { label: "61-90天", color: "bg-red-400", value: buckets.d61_90 },
              { label: "90天+", color: "bg-red-600", value: buckets.d90plus },
            ]
            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {agingBuckets.map((bucket, i) => (
                    <div key={i} className="p-3 rounded-lg border text-center">
                      <div className={`w-2 h-2 rounded-full ${bucket.color} mx-auto mb-2`}></div>
                      <p className="text-xs text-slate-500">{bucket.label}</p>
                      <p className="text-lg font-bold text-slate-900">RM {fmtMoney(bucket.value)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-center">
                  数据实时更新 · {safeInvoices.filter(inv => inv.status !== "paid").length} 笔未结清发票
                </p>
              </>
            )
          })()}
        </CardContent>
      </Card>
      {/* 资产负债概览 —— 会计三大表里的第二张 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            资产负债概览
          </CardTitle>
          <CardDescription>
        时点报表 · 截至数据最新日（累计口径，不随上方月份切换）：应收 / 应付 / 累计损益（银行与现金栏需先在「银行对账」导入真实流水）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 资产 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 border-b pb-2">资产</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">应收账款（未收发票）</span>
                <span className="font-medium">RM {fmtMoney(balanceSheet.receivable)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">银行 + 现金</span>
                <span className="text-slate-400 text-xs">待导入流水</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                <span>资产合计（已知）</span>
                <span>RM {fmtMoney(balanceSheet.receivable)}</span>
              </div>
            </div>
            {/* 负债 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 border-b pb-2">负债</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">应付薪资（当月未发）</span>
                <span className="font-medium">RM {fmtMoney(balanceSheet.payableSalary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">应付供应商</span>
                <span className="text-slate-400 text-xs">暂无记录</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                <span>负债合计</span>
                <span>RM {fmtMoney(balanceSheet.payableSalary)}</span>
              </div>
            </div>
            {/* 权益 / 损益 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 border-b pb-2">累计损益</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">累计收入（实收）</span>
                <span className="font-medium text-green-600">RM {fmtMoney(balanceSheet.income)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">累计成本（支出 + 薪资）</span>
                <span className="font-medium text-red-600">RM {fmtMoney(balanceSheet.cost)}</span>
              </div>
              <div className={`flex justify-between text-sm pt-2 border-t font-semibold ${balanceSheet.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                <span>累计利润</span>
                <span>RM {fmtMoney(balanceSheet.profit)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            注：这是一张「简版」资产负债概览。完整资产负债表需要银行余额、现金、固定资产与应付账款 —— 先在「银行对账」导入真实银行流水后可补齐。
          </p>
        </CardContent>
      </Card>



    </div>
  )
}
