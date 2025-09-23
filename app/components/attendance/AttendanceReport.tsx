'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  Download, 
  Eye, 
  Filter,
  Search,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  department: string
  position: string
  date: string
  checkIn: string
  checkOut: string
  totalHours: number
  status: 'present' | 'absent' | 'late' | 'half-day' | 'overtime'
  overtimeHours: number
  notes?: string
}

interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
  totalHours: number
  averageHours: number
  overtimeHours: number
  attendanceRate: number
}

export function AttendanceReport() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [searchQuery, setSearchQuery] = useState('')

  // 从API获取真实数据
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        
        // 获取教师数据
        const teachersResponse = await fetch('/api/teachers')
        const teachersData = await teachersResponse.json()
        const teachers = teachersData.teachers || []
        
        // 获取考勤数据
        const attendanceResponse = await fetch(`/api/teacher-attendance?date=${today}`)
        const attendanceData = await attendanceResponse.json()
        const attendanceRecords = attendanceData.records || []
        
        // 转换数据格式
        const records: AttendanceRecord[] = attendanceRecords.map((record: any) => {
          const teacher = teachers.find((t: any) => t.id === record.teacher_id)
          const checkInTime = record.check_in ? new Date(record.check_in) : null
          const checkOutTime = record.check_out ? new Date(record.check_out) : null
          
          let totalHours = 0
          if (checkInTime && checkOutTime) {
            totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
          }
          
          let status: 'present' | 'absent' | 'late' | 'half-day' | 'overtime' = 'present'
          if (!checkInTime) {
            status = 'absent'
          } else if (checkInTime.getHours() > 8 || (checkInTime.getHours() === 8 && checkInTime.getMinutes() > 0)) {
            status = 'late'
          } else if (totalHours < 6) {
            status = 'half-day'
          } else if (totalHours > 8) {
            status = 'overtime'
          }
          
          const overtimeHours = Math.max(0, totalHours - 8)
          
          return {
            id: record.id,
            employeeId: teacher?.id || 'Unknown',
            employeeName: teacher?.name || 'Unknown Teacher',
            department: teacher?.department || 'Unknown',
            position: teacher?.position || 'Unknown',
            date: today,
            checkIn: checkInTime ? checkInTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }) : '-',
            checkOut: checkOutTime ? checkOutTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }) : '-',
            totalHours: Math.round(totalHours * 10) / 10,
            status,
            overtimeHours: Math.round(overtimeHours * 10) / 10,
            notes: record.notes
          }
        })
        
        setRecords(records)
        
        // 计算汇总数据
        const totalDays = 22 // 假设一个月22个工作日
        const presentDays = records.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'overtime').length
        const absentDays = records.filter(r => r.status === 'absent').length
        const lateDays = records.filter(r => r.status === 'late').length
        const halfDays = records.filter(r => r.status === 'half-day').length
        const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0)
        const averageHours = records.length > 0 ? Math.round((totalHours / records.length) * 10) / 10 : 0
        const overtimeHours = records.reduce((sum, r) => sum + r.overtimeHours, 0)
        const attendanceRate = records.length > 0 ? Math.round((presentDays / records.length) * 100 * 10) / 10 : 0
        
        setSummary({
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          halfDays,
          totalHours: Math.round(totalHours * 10) / 10,
          averageHours,
          overtimeHours: Math.round(overtimeHours * 10) / 10,
          attendanceRate
        })
      } catch (error) {
        console.error('获取考勤数据失败:', error)
        setRecords([])
        setSummary(null)
      }
    }
    
    fetchAttendanceData()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'half-day':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'overtime':
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-yellow-100 text-yellow-800'
      case 'half-day':
        return 'bg-blue-100 text-blue-800'
      case 'overtime':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return '正常出勤'
      case 'absent':
        return '缺勤'
      case 'late':
        return '迟到'
      case 'half-day':
        return '半天'
      case 'overtime':
        return '加班'
      default:
        return '未知'
    }
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEmployee = selectedEmployee === 'all' || record.employeeId === selectedEmployee
    return matchesSearch && matchesEmployee
  })

  return (
    <div className="space-y-6">
      {/* 报告筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            考勤报告筛选
          </CardTitle>
          <CardDescription>选择时间范围和员工查看考勤报告</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">时间范围</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="选择时间范围" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">日报告</SelectItem>
                  <SelectItem value="week">周报告</SelectItem>
                  <SelectItem value="month">月报告</SelectItem>
                  <SelectItem value="year">年报告</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">年份</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">月份</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="选择月份" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {month}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">员工</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="选择员工" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部员工</SelectItem>
                  <SelectItem value="EMP001">Ahmad Rahman</SelectItem>
                  <SelectItem value="EMP002">Siti Aminah</SelectItem>
                  <SelectItem value="EMP003">Muhammad Ali</SelectItem>
                  <SelectItem value="EMP004">Fatimah Zahra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索员工姓名或工号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button>
              <Filter className="h-4 w-4 mr-2" />
              应用筛选
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出报告
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 考勤汇总 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总工作日</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDays}</div>
              <p className="text-xs text-muted-foreground">天</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">出勤天数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.presentDays}</div>
              <p className="text-xs text-muted-foreground">
                出勤率 {summary.attendanceRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总工时</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalHours}</div>
              <p className="text-xs text-muted-foreground">
                平均 {summary.averageHours}h/天
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">加班工时</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{summary.overtimeHours}</div>
              <p className="text-xs text-muted-foreground">小时</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 详细记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              考勤详细记录
            </span>
            <Badge variant="outline">
              {filteredRecords.length} 条记录
            </Badge>
          </CardTitle>
          <CardDescription>
            {selectedPeriod === 'day' && '日报告'} 
            {selectedPeriod === 'week' && '周报告'} 
            {selectedPeriod === 'month' && '月报告'} 
            {selectedPeriod === 'year' && '年报告'} - 
            {selectedYear}年{selectedMonth}月
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">员工信息</th>
                  <th className="text-left py-3 px-4">日期</th>
                  <th className="text-left py-3 px-4">签到时间</th>
                  <th className="text-left py-3 px-4">签退时间</th>
                  <th className="text-left py-3 px-4">总工时</th>
                  <th className="text-left py-3 px-4">状态</th>
                  <th className="text-left py-3 px-4">加班</th>
                  <th className="text-left py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{record.employeeName}</div>
                        <div className="text-sm text-gray-500">
                          {record.employeeId} · {record.department}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{record.date}</td>
                    <td className="py-3 px-4">{record.checkIn}</td>
                    <td className="py-3 px-4">{record.checkOut}</td>
                    <td className="py-3 px-4">{record.totalHours}h</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusText(record.status)}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {record.overtimeHours > 0 ? (
                        <span className="text-purple-600 font-medium">
                          +{record.overtimeHours}h
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
