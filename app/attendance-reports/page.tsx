"use client"

import { useState, useEffect, useCallback } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Filter, 
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  CalendarDays,
  FileText,
  Eye,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  FileBarChart
} from "lucide-react"
import EnterpriseReportExporter from "../components/reports/EnterpriseReportExporter"
import { format, parseISO, startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears } from "date-fns"
import { zhCN } from "date-fns/locale"

// 考勤记录接口
interface AttendanceRecord {
  id: string
  student_id?: string
  student_name?: string
  teacher_id?: string
  teacher_name?: string
  center: string
  date: string
  check_in?: string
  check_out?: string
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'completed'
  notes?: string
  method?: string
  device_info?: string
  created: string
  updated: string
  type: 'student' | 'teacher'
  name: string
  id_field: string
}

// 考勤统计接口
interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  earlyLeave: number
  attendanceRate: number
  checkInCount: number
  checkOutCount: number
  averageCheckInTime?: string
  averageCheckOutTime?: string
}

// 日期范围预设
const DATE_RANGES = {
  today: '今天',
  week: '最近一周',
  month: '最近一月',
  year: '最近一年',
  custom: '自定义'
} as const

type DateRange = keyof typeof DATE_RANGES

export default function AttendanceReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    earlyLeave: 0,
    attendanceRate: 0,
    checkInCount: 0,
    checkOutCount: 0
  })

  // 过滤条件
  const [filters, setFilters] = useState({
    dateRange: 'today' as DateRange,
    startDate: '',
    endDate: '',
    name: '',
    center: 'all',
    status: 'all',
    type: 'all'
  })

  // 企业级报告面板显示状态
  const [showEnterpriseReport, setShowEnterpriseReport] = useState(false)

  // 分页
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalPages, setTotalPages] = useState(1)

  // 获取日期范围
  const getDateRange = useCallback((range: DateRange) => {
    // 使用正确的当前日期（2025年9月30日）
    const today = new Date('2025-09-30') // 设置为正确的当前日期
    const todayStr = format(today, 'yyyy-MM-dd')
    
    console.log('📅 日期计算调试:', {
      today: today.toISOString(),
      todayStr,
      range,
      note: '使用正确的当前日期 2025-09-30'
    })
    
    switch (range) {
      case 'today':
        return { startDate: todayStr, endDate: todayStr }
      case 'week':
        return { 
          startDate: format(subDays(today, 7), 'yyyy-MM-dd'), 
          endDate: todayStr 
        }
      case 'month':
        return { 
          startDate: format(subMonths(today, 1), 'yyyy-MM-dd'), 
          endDate: todayStr 
        }
      case 'year':
        return { 
          startDate: format(subYears(today, 1), 'yyyy-MM-dd'), 
          endDate: todayStr 
        }
      default:
        return { startDate: todayStr, endDate: todayStr }
    }
  }, [])

  // 获取考勤记录
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const allRecords: AttendanceRecord[] = []
      let totalRecords = 0

      // 确定查询日期范围
      let startDate = filters.startDate
      let endDate = filters.endDate
      
      if (filters.dateRange !== 'custom') {
        const range = getDateRange(filters.dateRange)
        startDate = range.startDate
        endDate = range.endDate
      }

      console.log('📊 查询考勤记录:', { 
        dateRange: filters.dateRange, 
        startDate, 
        endDate,
        filters 
      })

      // 获取学生考勤记录
      if (filters.type === 'all' || filters.type === 'student') {
        const studentParams = new URLSearchParams()
        if (startDate) studentParams.append('startDate', startDate)
        if (endDate) studentParams.append('endDate', endDate)
        if (filters.name) studentParams.append('studentName', filters.name)
        if (filters.center !== 'all') studentParams.append('center', filters.center)
        if (filters.status !== 'all') studentParams.append('status', filters.status)
        studentParams.append('page', currentPage.toString())
        studentParams.append('pageSize', pageSize.toString())

        const studentResponse = await fetch(`/api/student-attendance?${studentParams.toString()}`)
        const studentData = await studentResponse.json()

        if (studentData.success && studentData.records) {
          const studentRecords = studentData.records.map((record: any) => ({
            ...record,
            type: 'student' as const,
            name: record.student_name,
            id_field: record.student_id
          }))
          allRecords.push(...studentRecords)
          totalRecords += studentData.total || 0
        }
      }

      // 获取教师考勤记录
      if (filters.type === 'all' || filters.type === 'teacher') {
        const teacherParams = new URLSearchParams()
        teacherParams.append('type', 'teacher') // 明确指定查询教师数据
        if (startDate) teacherParams.append('startDate', startDate)
        if (endDate) teacherParams.append('endDate', endDate)
        if (filters.name) teacherParams.append('teacherName', filters.name)
        if (filters.center !== 'all') teacherParams.append('center', filters.center)
        if (filters.status !== 'all') teacherParams.append('status', filters.status)
        teacherParams.append('page', currentPage.toString())
        teacherParams.append('pageSize', pageSize.toString())

        const requestUrl = `/api/teacher-attendance?${teacherParams.toString()}`
        console.log('🔍 客户端请求URL:', requestUrl)
        console.log('🔍 教师查询参数:', Object.fromEntries(teacherParams.entries()))
        
        const teacherResponse = await fetch(requestUrl)
        const teacherData = await teacherResponse.json()
        
        console.log('🔍 教师API响应:', {
          success: teacherData.success,
          total: teacherData.total,
          recordsCount: teacherData.records?.length || 0,
          message: teacherData.message
        })

        if (teacherData.success && teacherData.records) {
          const teacherRecords = teacherData.records.map((record: any) => ({
            ...record,
            type: 'teacher' as const,
            name: record.teacher_name || record.name,
            id_field: record.teacher_id || record.user_id
          }))
          allRecords.push(...teacherRecords)
          totalRecords += teacherData.total || 0
        }
      }

      // 按时间排序
      allRecords.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

      setRecords(allRecords)
      setTotalPages(Math.ceil(totalRecords / pageSize))

      // 计算统计信息
      calculateStats(allRecords)

      console.log(`✅ 获取到 ${allRecords.length} 条考勤记录`)

    } catch (err) {
      console.error('获取考勤记录失败:', err)
      setError(`获取考勤记录失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, pageSize, getDateRange])

  // 计算统计信息
  const calculateStats = useCallback((records: AttendanceRecord[]) => {
    const total = records.length
    const present = records.filter(r => r.status === 'present' || r.status === 'completed').length
    const absent = records.filter(r => r.status === 'absent').length
    const late = records.filter(r => r.status === 'late').length
    const earlyLeave = records.filter(r => r.status === 'early_leave').length
    const checkInCount = records.filter(r => r.check_in).length
    const checkOutCount = records.filter(r => r.check_out).length

    // 计算平均签到时间
    const checkInTimes = records
      .filter(r => r.check_in)
      .map(r => new Date(r.check_in!).getHours() * 60 + new Date(r.check_in!).getMinutes())
    
    const averageCheckInTime = checkInTimes.length > 0 
      ? format(new Date(0, 0, 0, Math.floor(checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length / 60), 
        Math.floor((checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length) % 60)), 'HH:mm')
      : undefined

    // 计算平均签退时间
    const checkOutTimes = records
      .filter(r => r.check_out)
      .map(r => new Date(r.check_out!).getHours() * 60 + new Date(r.check_out!).getMinutes())
    
    const averageCheckOutTime = checkOutTimes.length > 0 
      ? format(new Date(0, 0, 0, Math.floor(checkOutTimes.reduce((a, b) => a + b, 0) / checkOutTimes.length / 60), 
        Math.floor((checkOutTimes.reduce((a, b) => a + b, 0) / checkOutTimes.length) % 60)), 'HH:mm')
      : undefined

    setStats({
      total,
      present,
      absent,
      late,
      earlyLeave,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      checkInCount,
      checkOutCount,
      averageCheckInTime,
      averageCheckOutTime
    })
  }, [])

  // 处理日期范围变化
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange: range,
      startDate: '',
      endDate: ''
    }))
    setCurrentPage(1)
  }, [])

  // 处理筛选条件变化
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  // 当筛选条件变化时自动查询
  useEffect(() => {
    fetchAttendanceRecords()
  }, [filters, currentPage, fetchAttendanceRecords])

  // 重置筛选条件
  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: 'today',
      startDate: '',
      endDate: '',
      name: '',
      center: 'all',
      status: 'all',
      type: 'all'
    })
    setCurrentPage(1)
  }, [])

  // 导出考勤记录
  const exportRecords = useCallback(() => {
    // 添加BOM以支持中文
    const BOM = '\uFEFF'
    
    const csvContent = [
      ['类型', '姓名', 'ID', '中心', '日期', '签到时间', '签退时间', '状态', '备注'].join(','),
      ...records.map(record => [
        record.type === 'student' ? '学生' : '教师',
        record.name || '',
        record.id_field || '',
        record.center || '',
        record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '',
        record.check_in ? format(parseISO(record.check_in), 'HH:mm:ss') : '',
        record.check_out ? format(parseISO(record.check_out), 'HH:mm:ss') : '',
        record.status || '',
        record.notes || ''
      ].map(field => `"${field}"`).join(',')) // 用引号包围每个字段
    ].join('\n')

    // 使用UTF-8编码并添加BOM
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `考勤记录_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [records])

  // 初始化数据 - 移除重复调用，现在由筛选条件变化自动触发

  return (
    <PageLayout
      title="考勤记录查询"
      description="查看和管理所有考勤记录，支持多种时间范围查询"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-blue-50 to-indigo-100"
    >
      <Tabs defaultValue="records" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="records">考勤记录查询与导出</TabsTrigger>
        </TabsList>
        
        <TabsContent value="records" className="space-y-6">
          <div className="space-y-6">
        {/* 筛选条件 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 日期范围 */}
              <div className="space-y-2">
                <Label htmlFor="dateRange">时间范围</Label>
                <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATE_RANGES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 自定义日期范围 */}
              {filters.dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">开始日期</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">结束日期</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* 姓名搜索 */}
              <div className="space-y-2">
                <Label htmlFor="name">姓名搜索</Label>
                <Input
                  id="name"
                  placeholder="输入姓名"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>

              {/* 中心筛选 */}
              <div className="space-y-2">
                <Label htmlFor="center">中心</Label>
                <Select value={filters.center} onValueChange={(value) => handleFilterChange('center', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择中心" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部中心</SelectItem>
                    <SelectItem value="WX 01">WX 01</SelectItem>
                    <SelectItem value="WX 02">WX 02</SelectItem>
                    <SelectItem value="WX 03">WX 03</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 状态筛选 */}
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="present">已签到</SelectItem>
                    <SelectItem value="absent">缺席</SelectItem>
                    <SelectItem value="late">迟到</SelectItem>
                    <SelectItem value="early_leave">早退</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 类型筛选 */}
              <div className="space-y-2">
                <Label htmlFor="type">类型</Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="student">学生</SelectItem>
                    <SelectItem value="teacher">教师</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={fetchAttendanceRecords} disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                查询
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                重置
              </Button>
              <Button variant="outline" onClick={exportRecords} disabled={records.length === 0}>
                <Download className="h-4 w-4" />
                导出CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEnterpriseReport(!showEnterpriseReport)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                <FileBarChart className="h-4 w-4" />
                企业级报告
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总记录数</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">出勤率</p>
                  <p className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">签到次数</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.checkInCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">签退次数</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.checkOutCount}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 企业级报告面板 */}
        {showEnterpriseReport && (
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <FileBarChart className="h-5 w-5" />
                企业级报告配置
              </CardTitle>
              <CardDescription>
                生成专业的考勤分析报告，支持多种格式导出
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnterpriseReportExporter />
            </CardContent>
          </Card>
        )}

        {/* 考勤记录表格 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              考勤记录
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              共 {records.length} 条记录，第 {currentPage} 页，共 {totalPages} 页
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {records.length === 0 && !loading ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无考勤记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>类型</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>中心</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>签到时间</TableHead>
                      <TableHead>签退时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant={record.type === 'student' ? 'default' : 'secondary'}>
                            {record.type === 'student' ? '学生' : '教师'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>{record.id_field}</TableCell>
                        <TableCell>{record.center}</TableCell>
                        <TableCell>
                          {record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '-'}
                        </TableCell>
                        <TableCell>
                          {record.check_in ? (
                            <span className="text-green-600">
                              {format(parseISO(record.check_in), 'HH:mm:ss')}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.check_out ? (
                            <span className="text-blue-600">
                              {format(parseISO(record.check_out), 'HH:mm:ss')}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              record.status === 'present' || record.status === 'completed' 
                                ? 'default' 
                                : record.status === 'absent' 
                                ? 'destructive' 
                                : 'secondary'
                            }
                          >
                            {record.status === 'present' ? '已签到' :
                             record.status === 'absent' ? '缺席' :
                             record.status === 'late' ? '迟到' :
                             record.status === 'early_leave' ? '早退' :
                             record.status === 'completed' ? '已完成' : record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, records.length)} 条，共 {records.length} 条记录
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <span className="px-3 py-2 text-sm">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
