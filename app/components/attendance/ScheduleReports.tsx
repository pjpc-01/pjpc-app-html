'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, Users, TrendingUp, Download, BarChart3 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ScheduleReport {
  employeeId: string
  employeeName: string
  employeeType: 'fulltime' | 'parttime'
  totalScheduledHours: number
  totalWorkedHours: number
  scheduledDays: number
  workedDays: number
  attendanceRate: number
  overtimeHours: number
  weeklyReports: WeeklyReport[]
}

interface WeeklyReport {
  weekStart: string
  weekEnd: string
  scheduledHours: number
  workedHours: number
  attendanceRate: number
  overtimeHours: number
}

interface MonthlyStats {
  totalEmployees: number
  totalScheduledHours: number
  totalWorkedHours: number
  averageAttendanceRate: number
  totalOvertimeHours: number
  costAnalysis: {
    regularPay: number
    overtimePay: number
    totalCost: number
  }
}

export default function ScheduleReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [reports, setReports] = useState<ScheduleReport[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [employees, setEmployees] = useState<any[]>([])

  // 模拟数据
  const mockReports: ScheduleReport[] = [
    {
      employeeId: '1',
      employeeName: 'Cheng Mun Poo',
      employeeType: 'fulltime',
      totalScheduledHours: 160,
      totalWorkedHours: 155,
      scheduledDays: 20,
      workedDays: 19,
      attendanceRate: 95,
      overtimeHours: 5,
      weeklyReports: [
        {
          weekStart: '2025-09-01',
          weekEnd: '2025-09-07',
          scheduledHours: 40,
          workedHours: 40,
          attendanceRate: 100,
          overtimeHours: 0
        },
        {
          weekStart: '2025-09-08',
          weekEnd: '2025-09-14',
          scheduledHours: 40,
          workedHours: 38,
          attendanceRate: 95,
          overtimeHours: 2
        }
      ]
    },
    {
      employeeId: '2',
      employeeName: 'Teacher 2',
      employeeType: 'parttime',
      totalScheduledHours: 80,
      totalWorkedHours: 75,
      scheduledDays: 20,
      workedDays: 18,
      attendanceRate: 90,
      overtimeHours: 0,
      weeklyReports: [
        {
          weekStart: '2025-09-01',
          weekEnd: '2025-09-07',
          scheduledHours: 20,
          workedHours: 18,
          attendanceRate: 90,
          overtimeHours: 0
        }
      ]
    }
  ]

  // 计算月度统计
  const calculateMonthlyStats = (reports: ScheduleReport[]) => {
    const totalEmployees = reports.length
    const totalScheduledHours = reports.reduce((sum, r) => sum + r.totalScheduledHours, 0)
    const totalWorkedHours = reports.reduce((sum, r) => sum + r.totalWorkedHours, 0)
    const averageAttendanceRate = reports.length > 0 
      ? Math.round(reports.reduce((sum, r) => sum + r.attendanceRate, 0) / reports.length)
      : 0
    const totalOvertimeHours = reports.reduce((sum, r) => sum + r.overtimeHours, 0)

    // 假设每小时工资（这里需要根据实际情况调整）
    const hourlyRate = 50 // 马币
    const overtimeRate = 75 // 1.5倍工资

    return {
      totalEmployees,
      totalScheduledHours,
      totalWorkedHours,
      averageAttendanceRate,
      totalOvertimeHours,
      costAnalysis: {
        regularPay: totalWorkedHours * hourlyRate,
        overtimePay: totalOvertimeHours * overtimeRate,
        totalCost: (totalWorkedHours * hourlyRate) + (totalOvertimeHours * overtimeRate)
      }
    }
  }

  // 生成考勤日历
  const generateAttendanceCalendar = (reports: ScheduleReport[]) => {
    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return days.map(day => {
      const dayReports = reports.filter(report => 
        // 这里应该根据实际考勤数据来判断
        Math.random() > 0.3 // 模拟数据
      )

      return {
        date: day,
        isWorkDay: day.getDay() >= 1 && day.getDay() <= 5, // 周一到周五
        attendanceCount: dayReports.length,
        totalEmployees: reports.length
      }
    })
  }

  // 导出报告
  const exportReport = (format: 'pdf' | 'excel') => {
    console.log(`导出${format}报告`)
    // 这里应该实现实际的导出功能
  }

  useEffect(() => {
    setReports(mockReports)
    setMonthlyStats(calculateMonthlyStats(mockReports))
    setEmployees([
      { id: '1', name: 'Cheng Mun Poo', employeeType: 'fulltime' },
      { id: '2', name: 'Teacher 2', employeeType: 'parttime' }
    ])
  }, [])

  const filteredReports = selectedEmployee === 'all' 
    ? reports 
    : reports.filter(r => r.employeeId === selectedEmployee)

  const calendarData = generateAttendanceCalendar(filteredReports)

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">排班报告</h2>
          <p className="text-gray-600">查看员工排班和考勤统计报告</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            导出Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            导出PDF
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">选择月份</label>
              <input
                type="month"
                value={format(selectedMonth, 'yyyy-MM')}
                onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">选择员工</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="选择员工" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有员工</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name || employee.teacher_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 月度统计概览 */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总员工数</p>
                  <p className="text-2xl font-bold">{monthlyStats.totalEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总排班工时</p>
                  <p className="text-2xl font-bold">{monthlyStats.totalScheduledHours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">平均出勤率</p>
                  <p className="text-2xl font-bold">{monthlyStats.averageAttendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总成本</p>
                  <p className="text-2xl font-bold">RM {monthlyStats.costAnalysis.totalCost.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="detailed">详细报告</TabsTrigger>
          <TabsTrigger value="calendar">考勤日历</TabsTrigger>
          <TabsTrigger value="cost">成本分析</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>员工排班概览</CardTitle>
              <CardDescription>
                {format(selectedMonth, 'yyyy年MM月', { locale: zhCN })} 的排班统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReports.map(report => (
                  <div key={report.employeeId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{report.employeeName}</h3>
                          <Badge variant={report.employeeType === 'fulltime' ? 'default' : 'secondary'}>
                            {report.employeeType === 'fulltime' ? '全职' : '兼职'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {report.attendanceRate}%
                        </div>
                        <div className="text-sm text-gray-500">出勤率</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">排班工时</div>
                        <div className="font-medium">{report.totalScheduledHours}h</div>
                      </div>
                      <div>
                        <div className="text-gray-500">实际工时</div>
                        <div className="font-medium">{report.totalWorkedHours}h</div>
                      </div>
                      <div>
                        <div className="text-gray-500">排班天数</div>
                        <div className="font-medium">{report.scheduledDays}天</div>
                      </div>
                      <div>
                        <div className="text-gray-500">出勤天数</div>
                        <div className="font-medium">{report.workedDays}天</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 详细报告标签页 */}
        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>详细排班报告</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">员工</th>
                      <th className="text-center py-3 px-4">类型</th>
                      <th className="text-center py-3 px-4">排班工时</th>
                      <th className="text-center py-3 px-4">实际工时</th>
                      <th className="text-center py-3 px-4">出勤率</th>
                      <th className="text-center py-3 px-4">加班工时</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => (
                      <tr key={report.employeeId} className="border-b">
                        <td className="py-3 px-4 font-medium">{report.employeeName}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={report.employeeType === 'fulltime' ? 'default' : 'secondary'}>
                            {report.employeeType === 'fulltime' ? '全职' : '兼职'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">{report.totalScheduledHours}h</td>
                        <td className="py-3 px-4 text-center">{report.totalWorkedHours}h</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${
                            report.attendanceRate >= 95 ? 'text-green-600' :
                            report.attendanceRate >= 85 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {report.attendanceRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{report.overtimeHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 考勤日历标签页 */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>考勤日历</CardTitle>
              <CardDescription>
                {format(selectedMonth, 'yyyy年MM月', { locale: zhCN })} 的每日考勤情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => (
                  <div key={day} className="text-center font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {calendarData.map((day, index) => (
                  <div
                    key={index}
                    className={`p-2 text-center border rounded-lg ${
                      day.isWorkDay 
                        ? day.attendanceCount > 0 
                          ? 'bg-green-100 border-green-300' 
                          : 'bg-red-100 border-red-300'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">{format(day.date, 'd')}</div>
                    {day.isWorkDay && (
                      <div className="text-xs text-gray-600">
                        {day.attendanceCount}/{day.totalEmployees}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成本分析标签页 */}
        <TabsContent value="cost" className="space-y-4">
          {monthlyStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>薪资成本分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>基本工资</span>
                      <span className="font-medium">RM {monthlyStats.costAnalysis.regularPay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>加班费</span>
                      <span className="font-medium">RM {monthlyStats.costAnalysis.overtimePay.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>总成本</span>
                        <span>RM {monthlyStats.costAnalysis.totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>工时统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>总排班工时</span>
                      <span className="font-medium">{monthlyStats.totalScheduledHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>总实际工时</span>
                      <span className="font-medium">{monthlyStats.totalWorkedHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>总加班工时</span>
                      <span className="font-medium">{monthlyStats.totalOvertimeHours}h</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between">
                        <span>工时利用率</span>
                        <span className="font-medium">
                          {monthlyStats.totalScheduledHours > 0 
                            ? Math.round((monthlyStats.totalWorkedHours / monthlyStats.totalScheduledHours) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
