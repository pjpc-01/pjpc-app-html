"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { exportPnLPDF } from "@/lib/pdf-export"
import { toast } from "sonner"

const CATEGORY_LABELS: Record<string, string> = {
  salary: "教师薪资",
  rent: "办公室租金",
  utilities: "水电费",
  marketing: "市场推广",
  stationery: "办公文具",
  maintenance: "设备维护",
  misc: "其他杂项",
}

export default function FinancialReports() {
  const { stats: financialStats, loading: financialLoading } = useFinancialStats()
  const { invoices } = useInvoices()
  const { payments } = usePayments()
  const { expenses } = useExpenses()
  const [selectedReportType, setSelectedReportType] = useState("monthly")
  const [selectedPeriod, setSelectedPeriod] = useState("2026")

  const reportTypes = [
    { id: "monthly", name: "月度收入报告", icon: Calendar },
    { id: "fee", name: "收费项目分析", icon: DollarSign },
    { id: "profit", name: "收支利润分析", icon: TrendingUp },
    { id: "trend", name: "收入趋势分析", icon: TrendingUp },
  ]

  // Safe arrays
  const safeInvoices = Array.isArray(invoices) ? invoices : []
  const safePayments = Array.isArray(payments) ? payments : []
  const safeExpenses = Array.isArray(expenses) ? expenses : []

  // Revenue data from real stats
  const revenueByMonth = financialStats.revenueByMonth || {}
  const revenueEntries = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)

  // Build monthly report data from real stats
  const monthlyReportData = revenueEntries.map(([month, revenue]) => {
    const monthPayments = safePayments.filter(p => {
      const pDate = p.date || p.created || ""
      return pDate.startsWith(month)
    })
    const uniqueStudents = new Set(safePayments
      .filter(p => {
        const pDate = p.date || p.created || ""
        return pDate.startsWith(month)
      })
      .map(p => p.invoiceId)
    )
    return {
      month,
      revenue,
      students: uniqueStudents.size || safeInvoices.filter(inv => (inv.created || "").startsWith(month)).length,
      invoices: safeInvoices.filter(inv => (inv.created || "").startsWith(month)).length,
    }
  })

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
    safeExpenses.forEach(e => {
      const cat = CATEGORY_LABELS[e.category] || e.category || "其他"
      cats[cat] = (cats[cat] || 0) + (Number(e.amount) || 0)
    })
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
    const totalPaid = safePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
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
    const totalIncome = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const totalExpenses = safeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
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
            <div className="flex-1">
              <Label>统计期间</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2026", "2025", "2024"].map(p => (
                    <SelectItem key={p} value={p}>{p}年</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {financialLoading ? "加载中..." : `基于 ${financialSummary.totalPayments} 笔缴费记录和 ${safeExpenses.length} 笔支出记录`}
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
                  <p className="text-sm font-medium text-gray-600">总收入</p>
                  <p className="text-2xl font-bold text-green-600">RM {financialSummary.totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{financialSummary.successfulPayments} 笔成功缴费</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">总支出</p>
                  <p className="text-2xl font-bold text-red-600">RM {financialSummary.totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{safeExpenses.length} 笔支出记录</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">净利润</p>
                  <p className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    RM {financialSummary.netProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">利润率 {financialSummary.profitMargin.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">发票总数</p>
                  <p className="text-2xl font-bold text-purple-600">{safeInvoices.length}</p>
                  <p className="text-xs text-gray-500">{reconciliationStatus.paidInvoices} 已缴 / {reconciliationStatus.unpaidInvoices} 未缴</p>
                </div>
              </div>

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
                        <p className="text-lg font-semibold text-red-600">RM {exp.amount.toLocaleString()}</p>
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
                      const monthlyExp = safeExpenses
                        .filter(e => (e.date || "").startsWith(data.month))
                        .reduce((s, e) => s + (Number(e.amount) || 0), 0)
                      const monthlyProfit = data.revenue - monthlyExp
                      return (
                        <div key={data.month} className="flex justify-between items-center p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{data.month}</p>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>收入: RM {data.revenue.toLocaleString()}</span>
                              <span>支出: RM {monthlyExp.toLocaleString()}</span>
                              <span>发票: {data.invoices} 张</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              RM {monthlyProfit.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {data.revenue > 0 ? ((monthlyProfit / data.revenue) * 100).toFixed(1) : 0}% 利润率
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
            财务对账状态
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
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${reconciliationStatus.isBalanced ? "text-green-600" : "text-red-600"}`}>
                    {reconciliationStatus.isBalanced ? "数据一致" : "发现差异"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">发票总金额</p>
                <p className="text-lg font-semibold">RM {reconciliationStatus.totalInvoiced.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">缴费总金额</p>
                <p className="text-lg font-semibold">RM {reconciliationStatus.totalPaid.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">差异金额</p>
                <p className={`text-lg font-semibold ${reconciliationStatus.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                  RM {Math.abs(reconciliationStatus.difference).toLocaleString()}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      RM {(monthlyReportData[0]?.revenue || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">最近月份收入</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{monthlyReportData[0]?.students || 0}</div>
                    <div className="text-sm text-gray-600">缴费学生数</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{monthlyReportData[0]?.invoices || 0}</div>
                    <div className="text-sm text-gray-600">开具发票数</div>
                  </div>
                </div>
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
                        <TableCell>RM {data.revenue.toLocaleString()}</TableCell>
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
                      <div className="text-2xl font-bold text-blue-600">RM {fee.revenue.toLocaleString()}</div>
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
                        <TableCell>RM {fee.revenue.toLocaleString()}</TableCell>
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
                      RM {(monthlyReportData[0]?.revenue || 0).toLocaleString()}
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
                          <div className="text-sm text-gray-600">RM {data.revenue.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${parseFloat(String(growth)) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {parseFloat(String(growth)) >= 0 ? "+" : ""}{growth}%
                          </div>
                          <div className="text-sm text-gray-600">{data.invoices} 张发票</div>
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
                  <p className="text-sm font-medium text-gray-600">累计收入</p>
                  <p className="text-2xl font-bold text-green-600">RM {financialSummary.totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">{financialSummary.successfulPayments} 笔成功缴费</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">累计支出</p>
                  <p className="text-2xl font-bold text-red-600">RM {financialSummary.totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">运营成本</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">净利润</p>
                  <p className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    RM {financialSummary.netProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">利润率 {financialSummary.profitMargin.toFixed(1)}%</p>
                </div>
              </div>

              {expenseBreakdown.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">支出明细表</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>支出类别</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>占比</TableHead>
                        <TableHead>占收入比例</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseBreakdown.map(exp => (
                        <TableRow key={exp.category}>
                          <TableCell className="font-medium">{exp.category}</TableCell>
                          <TableCell className="text-red-600">RM {exp.amount.toLocaleString()}</TableCell>
                          <TableCell>{exp.percentage}%</TableCell>
                          <TableCell>
                            {financialSummary.totalIncome > 0
                              ? ((exp.amount / financialSummary.totalIncome) * 100).toFixed(1)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell className="font-semibold">总计</TableCell>
                        <TableCell className="font-semibold text-red-600">RM {financialSummary.totalExpenses.toLocaleString()}</TableCell>
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
                      <p className="text-lg font-bold text-slate-900">RM {bucket.value.toLocaleString()}</p>
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

      {/* 底部快速统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">年度收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {financialSummary.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">累计收入</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均月收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              RM {monthlyReportData.length > 0
                ? Math.round(monthlyReportData.reduce((s, d) => s + d.revenue, 0) / monthlyReportData.length).toLocaleString()
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">最近 {monthlyReportData.length} 个月平均</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总发票数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {safeInvoices.filter(inv => inv.status === "paid").length} 已缴 / {safeInvoices.filter(inv => inv.status !== "paid").length} 未缴
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出笔数</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeExpenses.length}</div>
            <p className="text-xs text-muted-foreground">经营成本记录</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
