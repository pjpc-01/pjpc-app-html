'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  RefreshCw
} from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 考勤记录接口
interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  center: string
  date: string
  check_in?: string
  check_out?: string
  status: 'present' | 'absent' | 'late' | 'early_leave'
  notes?: string
  teacher_id?: string
  teacher_name?: string
  method?: string
  device_info?: string
  created: string
  updated: string
  // Additional properties for unified display
  type?: 'student' | 'teacher'
  name?: string
  id_field?: string
}

// 考勤统计接口
interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  earlyLeave: number
  attendanceRate: number
}

export default function AttendanceRecords() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [teacherRecords, setTeacherRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    earlyLeave: 0,
    attendanceRate: 0
  })

  // 过滤条件
  const [filters, setFilters] = useState({
    date: '',
    name: '',
    center: 'all',
    status: 'all',
    type: 'all' // 新增：all, student, teacher
  })

  // 分页
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  // 获取考勤记录
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      setError(null)

      const allRecords: any[] = []
      let totalRecords = 0

      // 获取学生考勤记录
      if (filters.type === 'all' || filters.type === 'student') {
        const studentParams = new URLSearchParams()
        if (filters.date) studentParams.append('date', filters.date)
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
            type: 'student',
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
        teacherParams.append('type', 'teacher') // 必需参数
        if (filters.date) teacherParams.append('date', filters.date)
        if (filters.name) teacherParams.append('teacherName', filters.name)
        if (filters.center !== 'all') teacherParams.append('center', filters.center)
        if (filters.status !== 'all') teacherParams.append('status', filters.status)
        teacherParams.append('page', currentPage.toString())
        teacherParams.append('pageSize', pageSize.toString())

        const teacherResponse = await fetch(`/api/teacher-attendance?${teacherParams.toString()}`)
        const teacherData = await teacherResponse.json()

        if (teacherData.success && teacherData.records) {
          const teacherRecords = teacherData.records.map((record: any) => ({
            ...record,
            type: 'teacher',
            name: record.teacher_name,
            id_field: record.teacher_id,
            student_id: record.teacher_id, // 为了兼容现有显示逻辑
            student_name: record.teacher_name
          }))
          allRecords.push(...teacherRecords)
          totalRecords += teacherData.total || 0
        }
      }

      // 按时间排序
      allRecords.sort((a, b) => new Date(b.created || b.timestamp || 0).getTime() - new Date(a.created || a.timestamp || 0).getTime())

      setRecords(allRecords)
      setTotalPages(Math.ceil(totalRecords / pageSize))
      
      // 计算统计信息
      const present = allRecords.filter(r => r.status === 'present').length
      const absent = allRecords.filter(r => r.status === 'absent').length
      const late = allRecords.filter(r => r.status === 'late').length
      const earlyLeave = allRecords.filter(r => r.status === 'early_leave').length
      
      setStats({
        total: allRecords.length,
        present,
        absent,
        late,
        earlyLeave,
        attendanceRate: allRecords.length > 0 ? Math.round((present / allRecords.length) * 100) : 0
      })
    } catch (err) {
      console.error('获取考勤记录失败:', err)
      setError(err instanceof Error ? err.message : '获取考勤记录失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出考勤记录
  const exportRecords = () => {
    const csvContent = [
      ['类型', '人员ID', '人员姓名', '中心', '日期', '签到时间', '签退时间', '状态', '备注'].join(','),
      ...records.map(record => [
        record.type === 'student' ? '学生' : '教师/员工',
        record.id_field,
        record.name,
        record.center,
        record.date,
        record.check_in ? format(parseISO(record.check_in), 'HH:mm:ss') : '',
        record.check_out ? format(parseISO(record.check_out), 'HH:mm:ss') : '',
        record.status,
        record.notes || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `考勤记录_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />出勤</Badge>
      case 'absent':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />缺勤</Badge>
      case 'late':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />迟到</Badge>
      case 'early_leave':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />早退</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 初始化加载
  useEffect(() => {
    fetchAttendanceRecords()
  }, [currentPage, filters.date, filters.name, filters.center, filters.status, filters.type])

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-500">总记录数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.present}</div>
                <div className="text-sm text-gray-500">出勤</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.absent}</div>
                <div className="text-sm text-gray-500">缺勤</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                <div className="text-sm text-gray-500">出勤率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 过滤和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                placeholder="输入姓名"
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>类型</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="teacher">教师/员工</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>中心</Label>
              <Select value={filters.center} onValueChange={(value) => setFilters(prev => ({ ...prev, center: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择中心" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部中心</SelectItem>
                  <SelectItem value="总校">总校</SelectItem>
                  <SelectItem value="分校">分校</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>状态</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="present">出勤</SelectItem>
                  <SelectItem value="absent">缺勤</SelectItem>
                  <SelectItem value="late">迟到</SelectItem>
                  <SelectItem value="early_leave">早退</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={fetchAttendanceRecords}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            
            <Button onClick={exportRecords} disabled={records.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              导出记录
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 考勤记录表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            考勤记录
          </CardTitle>
          <CardDescription>
            查看和管理学生考勤记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-400" />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-400" />
              <p className="text-red-500">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchAttendanceRecords}
                className="mt-4"
              >
                重试
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">暂无考勤记录</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类型</TableHead>
                    <TableHead>人员信息</TableHead>
                    <TableHead>中心</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>签到时间</TableHead>
                    <TableHead>签退时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge variant={record.type === 'student' ? 'default' : 'secondary'}>
                          {record.type === 'student' ? '学生' : '教师/员工'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.name}</div>
                          <div className="text-sm text-gray-500">{record.id_field}</div>
                        </div>
                      </TableCell>
                      <TableCell>{record.center}</TableCell>
                      <TableCell>
                        {format(parseISO(record.date), 'yyyy-MM-dd', { locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        {record.check_in ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-green-500" />
                            {format(parseISO(record.check_in), 'HH:mm:ss')}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.check_out ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-red-500" />
                            {format(parseISO(record.check_out), 'HH:mm:ss')}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={record.notes}>
                          {record.notes || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-gray-500">
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
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
