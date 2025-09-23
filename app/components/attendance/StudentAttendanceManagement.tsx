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
  RefreshCw,
  GraduationCap,
  UserCheck,
  UserX,
  BarChart3
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 学生考勤记录接口
interface StudentAttendanceRecord {
  id: string
  student_id: string
  student_name: string
  center: string
  branch_name: string
  date: string
  check_in?: string
  check_out?: string
  status: 'present' | 'absent' | 'late' | 'early_leave'
  notes?: string
  teacher_id?: string
  teacher_name?: string
  device_info?: string
  method?: string
  created: string
  updated: string
}

// 考勤统计接口
interface StudentAttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  earlyLeave: number
  attendanceRate: number
}

export default function StudentAttendanceManagement() {
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StudentAttendanceStats>({
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
    studentName: '',
    center: 'all',
    status: 'all'
  })

  // 分页
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  // 获取学生考勤记录
  const fetchStudentAttendanceRecords = async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (filters.date) searchParams.append('date', filters.date)
      if (filters.studentName) searchParams.append('studentName', filters.studentName)
      if (filters.center !== 'all') searchParams.append('center', filters.center)
      if (filters.status !== 'all') searchParams.append('status', filters.status)
      searchParams.append('page', currentPage.toString())
      searchParams.append('pageSize', pageSize.toString())

      const response = await fetch(`/api/student-attendance?${searchParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setRecords(data.records || [])
        setTotalPages(Math.ceil((data.total || 0) / pageSize))
        
        // 计算统计信息
        const total = data.total || 0
        const present = data.records?.filter((r: StudentAttendanceRecord) => r.status === 'present').length || 0
        const absent = data.records?.filter((r: StudentAttendanceRecord) => r.status === 'absent').length || 0
        const late = data.records?.filter((r: StudentAttendanceRecord) => r.status === 'late').length || 0
        const earlyLeave = data.records?.filter((r: StudentAttendanceRecord) => r.status === 'early_leave').length || 0
        
        setStats({
          total,
          present,
          absent,
          late,
          earlyLeave,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
        })
      } else {
        throw new Error(data.error || '获取学生考勤记录失败')
      }
    } catch (err) {
      console.error('获取学生考勤记录失败:', err)
      setError(err instanceof Error ? err.message : '获取学生考勤记录失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出考勤记录
  const exportRecords = () => {
    const csvContent = [
      ['学生ID', '学生姓名', '中心', '日期', '签到时间', '签退时间', '状态', '备注'].join(','),
      ...records.map(record => [
        record.student_id,
        record.student_name,
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
    link.setAttribute('download', `学生考勤记录_${format(new Date(), 'yyyy-MM-dd')}.csv`)
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
    fetchStudentAttendanceRecords()
  }, [currentPage, filters.date, filters.studentName, filters.center, filters.status])

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
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
                <UserCheck className="h-5 w-5 text-green-600" />
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
                <UserX className="h-5 w-5 text-red-600" />
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
                <BarChart3 className="h-5 w-5 text-purple-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label htmlFor="studentName">学生姓名</Label>
              <Input
                id="studentName"
                placeholder="输入学生姓名"
                value={filters.studentName}
                onChange={(e) => setFilters(prev => ({ ...prev, studentName: e.target.value }))}
              />
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
              onClick={fetchStudentAttendanceRecords}
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
            学生考勤记录
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
                onClick={fetchStudentAttendanceRecords}
                className="mt-4"
              >
                重试
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">暂无学生考勤记录</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生信息</TableHead>
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
                        <div>
                          <div className="font-medium">{record.student_name}</div>
                          <div className="text-sm text-gray-500">{record.student_id}</div>
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
