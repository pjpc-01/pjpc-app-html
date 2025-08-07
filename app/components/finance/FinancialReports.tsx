"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Download, TrendingUp, BarChart3, PieChart, Calendar, DollarSign, Users, Loader2 } from "lucide-react"
import { useFinancialStats } from "@/hooks/useFinancialStats"

export default function FinancialReports() {
  const { stats: financialStats, loading: financialLoading } = useFinancialStats()
  const [selectedReportType, setSelectedReportType] = useState("monthly")
  const [selectedPeriod, setSelectedPeriod] = useState("2024")

  const reportTypes = [
    { id: "monthly", name: "月度收入报告", icon: Calendar },
    { id: "class", name: "班级收费统计", icon: Users },
    { id: "fee", name: "收费项目分析", icon: DollarSign },
    { id: "trend", name: "收入趋势分析", icon: TrendingUp },
  ]

  const periods = ["2024", "2023", "2022"]

  const monthlyData = [
    { month: "2024年1月", revenue: 45600, students: 45, invoices: 120 },
    { month: "2023年12月", revenue: 42800, students: 42, invoices: 115 },
    { month: "2023年11月", revenue: 41200, students: 40, invoices: 110 },
    { month: "2023年10月", revenue: 39800, students: 38, invoices: 105 },
    { month: "2023年9月", revenue: 38500, students: 35, invoices: 100 },
    { month: "2023年8月", revenue: 37200, students: 32, invoices: 95 },
  ]

  const classData = [
    { class: "三年级A班", revenue: 16800, students: 12, avgRevenue: 1400 },
    { class: "四年级B班", revenue: 19200, students: 12, avgRevenue: 1600 },
    { class: "五年级C班", revenue: 14400, students: 10, avgRevenue: 1440 },
    { class: "六年级D班", revenue: 15600, students: 11, avgRevenue: 1418 },
  ]

  const feeData = [
    { item: "学费", revenue: 35000, percentage: 65, students: 45 },
    { item: "餐费", revenue: 12000, percentage: 22, students: 45 },
    { item: "教材费", revenue: 4500, percentage: 8, students: 45 },
    { item: "活动费", revenue: 2500, percentage: 5, students: 25 },
  ]

  const handleExportReport = (type: string) => {
    console.log(`Exporting ${type} report...`)
    // In a real implementation, this would generate and download the report
  }

  const handleGenerateReport = (type: string) => {
    console.log(`Generating ${type} report...`)
    // In a real implementation, this would generate the report
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            财务报表
          </CardTitle>
          <CardDescription>收入支出统计报告</CardDescription>
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
            <div className="flex-1">
              <Label>统计期间</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period} value={period}>
                      {period}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => handleGenerateReport(selectedReportType)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                生成报告
              </Button>
              <Button variant="outline" onClick={() => handleExportReport(selectedReportType)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Report */}
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
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">RM {monthlyData[0].revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">本月收入</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{monthlyData[0].students}</div>
                    <div className="text-sm text-gray-600">缴费学生数</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{monthlyData[0].invoices}</div>
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
                    {monthlyData.map((data) => (
                      <TableRow key={data.month}>
                        <TableCell className="font-medium">{data.month}</TableCell>
                        <TableCell>RM {data.revenue.toLocaleString()}</TableCell>
                        <TableCell>{data.students}</TableCell>
                        <TableCell>{data.invoices}</TableCell>
                        <TableCell>RM {Math.round(data.revenue / data.students).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Class Revenue Report */}
      {selectedReportType === "class" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              班级收费统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {classData.map((classInfo) => (
                  <div key={classInfo.class} className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-semibold">{classInfo.class}</div>
                    <div className="text-2xl font-bold text-blue-600">RM {classInfo.revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{classInfo.students}名学生</div>
                    <div className="text-xs text-gray-500">人均RM {classInfo.avgRevenue}</div>
                  </div>
                ))}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>班级</TableHead>
                    <TableHead>收入金额</TableHead>
                    <TableHead>学生人数</TableHead>
                    <TableHead>平均收入</TableHead>
                    <TableHead>占比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classData.map((classInfo) => {
                    const totalRevenue = classData.reduce((sum, c) => sum + c.revenue, 0)
                    const percentage = ((classInfo.revenue / totalRevenue) * 100).toFixed(1)
                    return (
                      <TableRow key={classInfo.class}>
                        <TableCell className="font-medium">{classInfo.class}</TableCell>
                        <TableCell>RM {classInfo.revenue.toLocaleString()}</TableCell>
                        <TableCell>{classInfo.students}</TableCell>
                        <TableCell>RM {classInfo.avgRevenue}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Analysis Report */}
      {selectedReportType === "fee" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              收费项目分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {feeData.map((fee) => (
                  <div key={fee.item} className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-semibold">{fee.item}</div>
                    <div className="text-2xl font-bold text-blue-600">RM {fee.revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{fee.students}名学生</div>
                    <div className="text-xs text-gray-500">{fee.percentage}%</div>
                  </div>
                ))}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>收费项目</TableHead>
                    <TableHead>收入金额</TableHead>
                    <TableHead>缴费学生</TableHead>
                    <TableHead>占比</TableHead>
                    <TableHead>平均金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeData.map((fee) => (
                    <TableRow key={fee.item}>
                      <TableCell className="font-medium">{fee.item}</TableCell>
                      <TableCell>RM {fee.revenue.toLocaleString()}</TableCell>
                      <TableCell>{fee.students}</TableCell>
                      <TableCell>{fee.percentage}%</TableCell>
                      <TableCell>RM {Math.round(fee.revenue / fee.students).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Analysis Report */}
      {selectedReportType === "trend" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              收入趋势分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+12.5%</div>
                  <div className="text-sm text-gray-600">环比增长</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">+8.3%</div>
                  <div className="text-sm text-gray-600">同比增长</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">RM {monthlyData[0].revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">当前月收入</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">月度趋势</h3>
                {monthlyData.slice(0, 6).map((data, index) => {
                  const prevData = monthlyData[index + 1]
                  const growth = prevData ? ((data.revenue - prevData.revenue) / prevData.revenue * 100).toFixed(1) : 0
                  return (
                    <div key={data.month} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{data.month}</div>
                        <div className="text-sm text-gray-600">RM {data.revenue.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(growth) >= 0 ? '+' : ''}{growth}%
                        </div>
                        <div className="text-sm text-gray-600">{data.students}名学生</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">年度收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {monthlyData.reduce((sum, data) => sum + data.revenue, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">累计年度收入</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均月收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {Math.round(monthlyData.reduce((sum, data) => sum + data.revenue, 0) / monthlyData.length).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">月度平均收入</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总学生数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyData[0].students}</div>
            <p className="text-xs text-muted-foreground">当前缴费学生</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">发票总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyData[0].invoices}</div>
            <p className="text-xs text-muted-foreground">本月开具发票</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 