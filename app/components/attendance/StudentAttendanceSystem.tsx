'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Loader2, 
  Users, 
  UserCheck, 
  UserX,
  Clock, 
  MapPin, 
  Smartphone, 
  CreditCard, 
  Activity,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Shield,
  GraduationCap,
  BarChart3,
  Settings
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 学生接口
interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  cardNumber?: string
  standard?: string
}

// 学生考勤记录接口
interface StudentAttendanceRecord {
  id: string
  student_id: string
  student_name: string
  center?: string
  branch_code?: string
  date: string
  check_in?: string
  check_out?: string
  status: 'present' | 'absent' | 'late' | 'early_leave'
  notes?: string
  device_info?: string
  method?: string
  created: string
  updated: string
}

// 统计信息接口
interface StudentAttendanceStats {
  totalStudents: number
  todayPresent: number
  todayAbsent: number
  todayLate: number
  todayEarlyLeave: number
  attendanceRate: number
  totalRecords: number
}

interface StudentAttendanceSystemProps {
  centerId?: string
  studentId?: string
}

export default function StudentAttendanceSystem({ 
  centerId, 
  studentId
}: StudentAttendanceSystemProps) {
  // 基础状态
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // 考勤操作状态
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentCard, setCurrentCard] = useState('')
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  
  // 过滤和搜索
  const [filters, setFilters] = useState({
    date: '',
    name: '',
    center: 'all',
    status: 'all'
  })
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  
  // 防重复扫描
  const lastProcessedCard = useRef<string>('')
  const lastProcessTime = useRef<number>(0)

  // 显示消息
  const showMessage = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    if (type === 'success') setSuccess(text)
    else if (type === 'error') setError(text)
    setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 3000)
  }, [])

  // 获取学生数据
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      
      if (data.success) {
        setStudents(data.students || [])
      } else {
        throw new Error(data.message || '获取学生数据失败')
      }
    } catch (err) {
      console.error('获取学生数据失败:', err)
      showMessage('error', `学生数据获取失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  // 获取学生考勤记录
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams()
      if (filters.date) searchParams.append('date', filters.date)
      if (filters.name) searchParams.append('studentName', filters.name)
      if (filters.center !== 'all') searchParams.append('center', filters.center)
      if (filters.status !== 'all') searchParams.append('status', filters.status)
      searchParams.append('page', currentPage.toString())
      searchParams.append('pageSize', pageSize.toString())

      const response = await fetch(`/api/student-attendance-only?${searchParams.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setAttendanceRecords(data.records || [])
        setTotalPages(Math.ceil(data.total / pageSize))
      } else {
        throw new Error(data.message || '获取学生考勤记录失败')
      }
    } catch (err) {
      console.error('获取学生考勤记录失败:', err)
      showMessage('error', '获取学生考勤记录失败')
    }
  }, [filters, currentPage, pageSize])

  // 根据卡号查找学生
  const findStudentByCard = useCallback((cardNumber: string) => {
    const trimmed = cardNumber.trim()
    const student = students.find(s => s.cardNumber === trimmed)
    return student || null
  }, [students])

  // 获取学生今日考勤状态
  const getStudentTodayStatus = useCallback((studentId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceRecords.filter(record => {
      return record.student_id === studentId && record.date === today
    })
    
    if (todayRecords.length === 0) {
      return { status: 'none', canCheckIn: true, canCheckOut: false }
    }
    
    const latestRecord = todayRecords[0]
    if (latestRecord.check_out) {
      return { status: 'completed', canCheckIn: true, canCheckOut: false }
    }
    
    if (latestRecord.check_in) {
      return { status: 'checked_in', canCheckIn: false, canCheckOut: true }
    }
    
    return { status: 'none', canCheckIn: true, canCheckOut: false }
  }, [attendanceRecords])

  // 执行学生考勤操作
  const performStudentAttendance = useCallback(async (student: Student, action: 'check-in' | 'check-out') => {
    setIsProcessing(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const timestamp = new Date().toISOString()
      
      const payload = {
        student_id: student.student_id || student.id,
        student_name: student.student_name,
        center: student.center,
        date: today,
        time: timestamp,
        status: 'present',
        timestamp: timestamp,
        device_info: '学生考勤系统',
        method: 'student_attendance'
      }
      
      const response = await fetch('/api/student-attendance-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      
      if (data.success) {
        const actionText = action === 'check-in' ? '签到' : '签退'
        showMessage('success', `学生${actionText}成功！`)
        
        // 刷新考勤记录
        await fetchAttendanceRecords()
        
        // 清空当前状态
        setTimeout(() => {
          setCurrentCard('')
          setCurrentStudent(null)
        }, 2000)
      } else {
        showMessage('error', data.message || '学生考勤操作失败')
      }
    } catch (error) {
      console.error('学生考勤操作失败:', error)
      showMessage('error', '学生考勤操作失败')
    } finally {
      setIsProcessing(false)
    }
  }, [showMessage, fetchAttendanceRecords])

  // 处理卡号扫描
  const handleCardScan = useCallback((cardNumber: string) => {
    if (cardNumber.length < 10) return
    
    const now = Date.now()
    
    // 防重复扫描
    if (now - lastProcessTime.current < 3000 && lastProcessedCard.current === cardNumber) {
      showMessage('info', '请勿重复扫描同一张卡片')
      return
    }
    
    lastProcessedCard.current = cardNumber
    lastProcessTime.current = now
    
    // 查找学生
    const student = findStudentByCard(cardNumber)
    if (!student) {
      showMessage('error', '未找到对应的学生信息')
      return
    }
    
    setCurrentCard(cardNumber)
    setCurrentStudent(student)
    
    // 获取学生今日考勤状态
    const studentId = student.student_id || student.id
    const status = getStudentTodayStatus(studentId)
    
    // 确定操作类型
    let action: 'check-in' | 'check-out'
    if (status.canCheckIn) {
      action = 'check-in'
    } else if (status.canCheckOut) {
      action = 'check-out'
    } else {
      showMessage('info', '今天已完成签到签退，将创建新的签到记录')
      action = 'check-in'
    }
    
    // 执行学生考勤操作
    performStudentAttendance(student, action)
  }, [findStudentByCard, getStudentTodayStatus, performStudentAttendance, showMessage])

  // 键盘监听
  useEffect(() => {
    let inputBuffer = ''
    let lastInputTime = 0
    const debounceTime = 100
    
    const handleKeyPress = (event: KeyboardEvent) => {
      const now = Date.now()
      
      if (now - lastInputTime > debounceTime) {
        inputBuffer = ''
      }
      
      lastInputTime = now
      
      if (event.key >= '0' && event.key <= '9') {
        inputBuffer += event.key
        
        if (inputBuffer.length >= 10) {
          handleCardScan(inputBuffer)
          inputBuffer = ''
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [handleCardScan])

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      
      try {
        await Promise.all([fetchStudents(), fetchAttendanceRecords()])
      } catch (error) {
        console.error('数据初始化失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initData()
  }, [])

  // 当过滤条件变化时重新获取数据
  useEffect(() => {
    fetchAttendanceRecords()
  }, [fetchAttendanceRecords])

  // 获取统计信息
  const getStats = (): StudentAttendanceStats => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceRecords.filter(record => record.date === today)
    
    const present = todayRecords.filter(record => record.status === 'present').length
    const absent = todayRecords.filter(record => record.status === 'absent').length
    const late = todayRecords.filter(record => record.status === 'late').length
    const earlyLeave = todayRecords.filter(record => record.status === 'early_leave').length
    
    return {
      totalStudents: students.length,
      todayPresent: present,
      todayAbsent: absent,
      todayLate: late,
      todayEarlyLeave: earlyLeave,
      attendanceRate: todayRecords.length > 0 ? Math.round((present / todayRecords.length) * 100) : 0,
      totalRecords: todayRecords.length
    }
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

  // 导出考勤记录
  const exportRecords = () => {
    const csvContent = [
      ['学生ID', '学生姓名', '中心', '日期', '签到时间', '签退时间', '状态', '备注'].join(','),
      ...attendanceRecords.map(record => [
        record.student_id,
        record.student_name,
        record.center || record.branch_code,
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

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">学生考勤系统加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <div className="text-sm text-gray-500">总学生数</div>
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
                <div className="text-2xl font-bold">{stats.todayPresent}</div>
                <div className="text-sm text-gray-500">今日出勤</div>
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
                <div className="text-2xl font-bold">{stats.todayAbsent}</div>
                <div className="text-sm text-gray-500">今日缺勤</div>
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

      {/* 主要功能标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            总览
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            扫卡考勤
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            考勤记录
          </TabsTrigger>
        </TabsList>

        {/* 总览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 今日考勤概览 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  今日学生考勤概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">总记录数</span>
                    <span className="font-semibold">{stats.totalRecords}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">出勤人数</span>
                    <span className="font-semibold text-green-600">{stats.todayPresent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">缺勤人数</span>
                    <span className="font-semibold text-red-600">{stats.todayAbsent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">迟到人数</span>
                    <span className="font-semibold text-yellow-600">{stats.todayLate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">早退人数</span>
                    <span className="font-semibold text-orange-600">{stats.todayEarlyLeave}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">出勤率</span>
                    <span className="font-semibold text-blue-600">{stats.attendanceRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  快速操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('scan')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    扫卡考勤
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('records')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    查看记录
                  </Button>
                  <Button 
                    onClick={exportRecords} 
                    className="w-full justify-start"
                    variant="outline"
                    disabled={attendanceRecords.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    导出记录
                  </Button>
                  <Button 
                    onClick={fetchAttendanceRecords} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新数据
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 扫卡考勤标签页 */}
        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                学生扫卡考勤
              </CardTitle>
              <CardDescription>
                扫描学生NFC卡片自动完成签到/签退
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 当前扫描状态 */}
              {currentCard && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">学生: {currentStudent?.student_name}</p>
                        <p className="text-sm text-gray-600">卡号: {currentCard}</p>
                      </div>
                      <div>
                        {isProcessing ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">处理中...</span>
                          </div>
                        ) : (
                          <Badge variant="outline">已识别</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="text-center py-8">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">等待扫描学生NFC卡片...</p>
                <p className="text-sm text-gray-500">
                  请将学生NFC卡片靠近设备进行扫描，系统会自动识别学生并执行相应的考勤操作
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 考勤记录标签页 */}
        <TabsContent value="records" className="space-y-4">
          {/* 过滤和搜索 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                筛选条件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">日期</label>
                    <Input
                      type="date"
                      value={filters.date}
                      onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">姓名</label>
                    <Input
                      placeholder="输入学生姓名"
                      value={filters.name}
                      onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">中心</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.center}
                      onChange={(e) => setFilters(prev => ({ ...prev, center: e.target.value }))}
                    >
                      <option value="all">全部中心</option>
                      <option value="WX 01">WX 01</option>
                      <option value="WX 02">WX 02</option>
                      <option value="总校">总校</option>
                      <option value="分校">分校</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">状态</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="all">全部状态</option>
                      <option value="present">出勤</option>
                      <option value="absent">缺勤</option>
                      <option value="late">迟到</option>
                      <option value="early_leave">早退</option>
                    </select>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({
                        date: '',
                        name: '',
                        center: 'all',
                        status: 'all'
                      })}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      重置筛选
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAttendanceRecords}
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      搜索
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    共 {attendanceRecords.length} 条记录
                  </div>
                </div>
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
              {attendanceRecords.length === 0 ? (
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
                      {attendanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.student_name}</div>
                              <div className="text-sm text-gray-500">{record.student_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>{record.center || record.branch_code}</TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
