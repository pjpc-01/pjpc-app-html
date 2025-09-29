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
  UserCheck,
  GraduationCap
} from "lucide-react"
import { format, parseISO, startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears } from "date-fns"
import { zhCN } from "date-fns/locale"

// 教师考勤记录接口
interface TeacherAttendanceRecord {
  id: string
  teacher_id: string
  teacher_name: string
  center: string
  branch_code: string
  branch_name: string
  date: string
  check_in?: string
  check_out?: string
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'completed'
  notes?: string
  method?: string
  device_info?: string
  created: string
  updated: string
  type: 'teacher'
  name: string
  id_field: string
}

// 教师考勤统计接口
interface TeacherAttendanceStats {
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
  totalTeachers: number
  activeTeachers: number
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

export default function TeacherAttendanceReportsPage() {
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TeacherAttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    earlyLeave: 0,
    attendanceRate: 0,
    checkInCount: 0,
    checkOutCount: 0,
    totalTeachers: 0,
    activeTeachers: 0
  })

  // 过滤条件
  const [filters, setFilters] = useState({
    dateRange: 'today' as DateRange,
    startDate: '',
    endDate: '',
    name: '',
    center: 'all',
    status: 'all'
  })

  // 分页
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalPages, setTotalPages] = useState(1)

  // 获取日期范围
  const getDateRange = useCallback((range: DateRange) => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    
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
        return { startDate: '', endDate: '' }
    }
  }, [])

  // 获取教师数据
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch('/api/teachers')
      const data = await response.json()
      
      if (data.success) {
        setTeachers(data.teachers || [])
        console.log(`📊 获取到 ${data.teachers?.length || 0} 个教师`)
      }
    } catch (err) {
      console.error('获取教师数据失败:', err)
    }
  }, [])

  // 获取教师考勤记录
  const fetchTeacherAttendanceRecords = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 确定查询日期范围
      let startDate = filters.startDate
      let endDate = filters.endDate
      
      if (filters.dateRange !== 'custom') {
        const range = getDateRange(filters.dateRange)
        startDate = range.startDate
        endDate = range.endDate
      }

      console.log('📊 查询教师考勤记录:', { 
        dateRange: filters.dateRange, 
        startDate, 
        endDate,
        filters 
      })

      const teacherParams = new URLSearchParams()
      if (startDate) teacherParams.append('startDate', startDate)
      if (endDate) teacherParams.append('endDate', endDate)
      if (filters.name) teacherParams.append('teacherName', filters.name)
      if (filters.center !== 'all') teacherParams.append('center', filters.center)
      if (filters.status !== 'all') teacherParams.append('status', filters.status)
      teacherParams.append('page', currentPage.toString())
      teacherParams.append('pageSize', pageSize.toString())
      teacherParams.append('type', 'teacher')

      const teacherResponse = await fetch(`/api/teacher-attendance?${teacherParams.toString()}`)
      const teacherData = await teacherResponse.json()

      console.log('📊 教师考勤API响应:', teacherData)

      if (teacherData.success && teacherData.records) {
        const teacherRecords = teacherData.records.map((record: any) => ({
          ...record,
          type: 'teacher' as const,
          name: record.teacher_name || record.name,
          id_field: record.teacher_id || record.user_id,
          center: record.branch_name || record.center || 'WX 01'
        }))
        
        // 按时间排序
        teacherRecords.sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime())
        
        setRecords(teacherRecords)
        setTotalPages(Math.ceil(teacherData.total / pageSize))

        // 计算统计信息
        calculateStats(teacherRecords)

        console.log(`✅ 获取到 ${teacherRecords.length} 条教师考勤记录`)
      } else {
        console.log('⚠️ 没有教师考勤记录')
        setRecords([])
        setStats({
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          earlyLeave: 0,
          attendanceRate: 0,
          checkInCount: 0,
          checkOutCount: 0,
          totalTeachers: teachers.length,
          activeTeachers: 0
        })
      }

    } catch (err) {
      console.error('获取教师考勤记录失败:', err)
      setError(`获取教师考勤记录失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, pageSize, getDateRange, teachers.length])

  // 计算统计信息
  const calculateStats = useCallback((records: TeacherAttendanceRecord[]) => {
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

    // 计算活跃教师数（有考勤记录的教师）
    const activeTeacherIds = new Set(records.map(r => r.teacher_id))
    const activeTeachers = activeTeacherIds.size

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
      averageCheckOutTime,
      totalTeachers: teachers.length,
      activeTeachers
    })
  }, [teachers.length])

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
    if (teachers.length > 0) {
      fetchTeacherAttendanceRecords()
    }
  }, [filters, currentPage, fetchTeacherAttendanceRecords, teachers.length])

  // 重置筛选条件
  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: 'today',
      startDate: '',
      endDate: '',
      name: '',
      center: 'all',
      status: 'all'
    })
    setCurrentPage(1)
  }, [])

  // 创建测试教师考勤数据
  const createTestData = useCallback(async () => {
    try {
      setLoading(true)
      
      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')
      const timestamp = today.toISOString()
      
      // 为每个教师创建测试考勤记录
      const testRecords = teachers.slice(0, 3).map((teacher, index) => ({
        teacherId: teacher.user_id || teacher.id,
        teacherName: teacher.name,
        centerId: teacher.center_assignment || 'WX 01',
        centerName: teacher.center_assignment || 'WX 01',
        branchId: teacher.center_assignment || 'WX 01',
        branchName: teacher.center_assignment || 'WX 01',
        type: 'check-in',
        timestamp: timestamp,
        deviceId: 'test-device',
        deviceName: '测试设备',
        method: 'manual',
        status: 'success'
      }))
      
      console.log('📝 创建测试教师考勤数据:', testRecords)
      
      // 批量创建考勤记录
      const promises = testRecords.map(record => 
        fetch('/api/teacher-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        })
      )
      
      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map(r => r.json()))
      
      console.log('📝 测试数据创建结果:', results)
      
      // 刷新考勤记录
      await fetchTeacherAttendanceRecords()
      
    } catch (err) {
      console.error('创建测试数据失败:', err)
      setError(`创建测试数据失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }, [teachers, fetchTeacherAttendanceRecords])

  // 导出教师考勤记录
  const exportRecords = useCallback(() => {
    const csvContent = [
      ['教师姓名', '教师ID', '中心', '日期', '签到时间', '签退时间', '状态', '备注'].join(','),
      ...records.map(record => [
        record.teacher_name || '',
        record.teacher_id || '',
        record.center || '',
        record.date || '',
        record.check_in ? format(parseISO(record.check_in), 'yyyy-MM-dd HH:mm:ss') : '',
        record.check_out ? format(parseISO(record.check_out), 'yyyy-MM-dd HH:mm:ss') : '',
        record.status || '',
        record.notes || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `教师考勤记录_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [records])

  // 初始化数据
  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  return (
    <PageLayout
      title="教师考勤记录查询"
      description="查看和管理所有教师考勤记录，支持多种时间范围查询"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-green-50 to-emerald-100"
    >
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
                <Label htmlFor="name">教师姓名</Label>
                <Input
                  id="name"
                  placeholder="输入教师姓名"
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
            </div>

            <div className="flex gap-2">
              <Button onClick={fetchTeacherAttendanceRecords} disabled={loading}>
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
                导出
              </Button>
              {teachers.length > 0 && records.length === 0 && (
                <Button variant="secondary" onClick={createTestData} disabled={loading}>
                  <GraduationCap className="h-4 w-4" />
                  创建测试数据
                </Button>
              )}
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
                  <p className="text-sm font-medium text-gray-600">活跃教师</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.activeTeachers}/{stats.totalTeachers}</p>
                </div>
                <UserCheck className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">签到次数</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.checkInCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 教师考勤记录表格 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              教师考勤记录
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
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无教师考勤记录</p>
                {teachers.length > 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    点击"创建测试数据"按钮生成示例数据
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>教师姓名</TableHead>
                      <TableHead>教师ID</TableHead>
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
                        <TableCell className="font-medium">{record.teacher_name}</TableCell>
                        <TableCell>{record.teacher_id}</TableCell>
                        <TableCell>{record.center}</TableCell>
                        <TableCell>{record.date}</TableCell>
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
    </PageLayout>
  )
}
