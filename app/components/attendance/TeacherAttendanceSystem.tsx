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
  User,
  BarChart3,
  Settings
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import HIDCardReader from '@/components/hid-reader/HIDCardReader'

// 教师接口
interface Teacher {
  id: string
  user_id: string
  name: string
  center_assignment: string
  cardNumber?: string
  position?: string
  department?: string
}

// 教师考勤记录接口
interface TeacherAttendanceRecord {
  id: string
  teacher_id: string
  teacher_name: string
  branch_code?: string
  branch_name?: string
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
interface TeacherAttendanceStats {
  totalTeachers: number
  todayPresent: number
  todayAbsent: number
  todayLate: number
  todayEarlyLeave: number
  attendanceRate: number
  totalRecords: number
}

interface TeacherAttendanceSystemProps {
  centerId?: string
  teacherId?: string
}

export default function TeacherAttendanceSystem({ 
  centerId, 
  teacherId
}: TeacherAttendanceSystemProps) {
  // 基础状态
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // 考勤操作状态
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentCard, setCurrentCard] = useState('')
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null)
  
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

  // 获取教师数据
  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers')
      const data = await response.json()
      
      if (data.success) {
        setTeachers(data.data || [])
      } else {
        throw new Error(data.message || '获取教师数据失败')
      }
    } catch (err) {
      console.error('获取教师数据失败:', err)
      showMessage('error', `教师数据获取失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  // 获取教师考勤记录
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams()
      if (filters.date) searchParams.append('date', filters.date)
      if (filters.name) searchParams.append('teacherName', filters.name)
      if (filters.center !== 'all') searchParams.append('center', filters.center)
      if (filters.status !== 'all') searchParams.append('status', filters.status)
      searchParams.append('page', currentPage.toString())
      searchParams.append('pageSize', pageSize.toString())

      const response = await fetch(`/api/teacher-attendance-only?${searchParams.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setAttendanceRecords(data.records || [])
        setTotalPages(Math.ceil(data.total / pageSize))
      } else {
        throw new Error(data.message || '获取教师考勤记录失败')
      }
    } catch (err) {
      console.error('获取教师考勤记录失败:', err)
      showMessage('error', '获取教师考勤记录失败')
    }
  }, [filters, currentPage, pageSize])

  // 根据卡号查找教师
  const findTeacherByCard = useCallback((cardNumber: string) => {
    const trimmed = cardNumber.trim()
    const teacher = teachers.find(t => t.cardNumber === trimmed)
    return teacher || null
  }, [teachers])

  // 获取教师今日考勤状态
  const getTeacherTodayStatus = useCallback((teacherId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceRecords.filter(record => {
      return record.teacher_id === teacherId && record.date === today
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

  // 执行教师考勤操作
  const performTeacherAttendance = useCallback(async (teacher: Teacher, action: 'check-in' | 'check-out') => {
    setIsProcessing(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const timestamp = new Date().toISOString()
      
      const payload = {
        teacherId: teacher.user_id || teacher.id,
        teacherName: teacher.name,
        centerId: teacher.center_assignment || centerId || 'WX 01',
        centerName: teacher.center_assignment || centerId || 'WX 01',
        branchId: teacher.center_assignment || centerId || 'WX 01',
        branchName: teacher.center_assignment || centerId || 'WX 01',
        type: action,
        timestamp: timestamp,
        deviceId: 'teacher_attendance',
        deviceName: '教师考勤系统',
        method: 'teacher_attendance',
        status: 'success'
      }
      
      const response = await fetch('/api/teacher-attendance-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      
      if (data.success) {
        const actionText = action === 'check-in' ? '签到' : '签退'
        showMessage('success', `教师${actionText}成功！`)
        
        // 刷新考勤记录
        await fetchAttendanceRecords()
        
        // 清空当前状态
        setTimeout(() => {
          setCurrentCard('')
          setCurrentTeacher(null)
        }, 2000)
      } else {
        showMessage('error', data.message || '教师考勤操作失败')
      }
    } catch (error) {
      console.error('教师考勤操作失败:', error)
      showMessage('error', '教师考勤操作失败')
    } finally {
      setIsProcessing(false)
    }
  }, [showMessage, fetchAttendanceRecords, centerId])

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
    
    // 查找教师
    const teacher = findTeacherByCard(cardNumber)
    if (!teacher) {
      showMessage('error', '未找到对应的教师信息')
      return
    }
    
    setCurrentCard(cardNumber)
    setCurrentTeacher(teacher)
    
    // 获取教师今日考勤状态
    const teacherId = teacher.user_id || teacher.id
    const status = getTeacherTodayStatus(teacherId)
    
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
    
    // 执行教师考勤操作
    performTeacherAttendance(teacher, action)
  }, [findTeacherByCard, getTeacherTodayStatus, performTeacherAttendance, showMessage])

  // 处理手动卡号输入
  const handleManualCardInput = useCallback((cardNumber: string) => {
    if (!cardNumber.trim()) {
      showMessage('error', '请输入卡号')
      return
    }
    
    // 查找教师
    const teacher = findTeacherByCard(cardNumber.trim())
    if (!teacher) {
      showMessage('error', `未找到卡号为 ${cardNumber.trim()} 的教师信息`)
      return
    }
    
    setCurrentCard(cardNumber.trim())
    setCurrentTeacher(teacher)
    
    // 获取教师今日考勤状态
    const teacherId = teacher.user_id || teacher.id
    const status = getTeacherTodayStatus(teacherId)
    
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
    
    // 执行教师考勤操作
    performTeacherAttendance(teacher, action)
  }, [findTeacherByCard, getTeacherTodayStatus, performTeacherAttendance, showMessage])

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
        await Promise.all([fetchTeachers(), fetchAttendanceRecords()])
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
  const getStats = (): TeacherAttendanceStats => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceRecords.filter(record => record.date === today)
    
    const present = todayRecords.filter(record => record.status === 'present').length
    const absent = todayRecords.filter(record => record.status === 'absent').length
    const late = todayRecords.filter(record => record.status === 'late').length
    const earlyLeave = todayRecords.filter(record => record.status === 'early_leave').length
    
    return {
      totalTeachers: teachers.length,
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
      ['教师ID', '教师姓名', '中心', '日期', '签到时间', '签退时间', '状态', '备注'].join(','),
      ...attendanceRecords.map(record => [
        record.teacher_id,
        record.teacher_name,
        record.branch_code || record.branch_name,
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
    link.setAttribute('download', `教师考勤记录_${format(new Date(), 'yyyy-MM-dd')}.csv`)
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
          <p className="text-gray-600">教师考勤系统加载中...</p>
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
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                <div className="text-sm text-gray-500">总教师数</div>
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
                  今日教师考勤概览
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 自动扫卡 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  自动扫卡考勤
                </CardTitle>
                <CardDescription>
                  扫描教师NFC卡片自动完成签到/签退
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 当前扫描状态 */}
                {currentCard && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">教师: {currentTeacher?.name}</p>
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

                <HIDCardReader
                  onCardRead={handleCardScan}
                  onError={(error) => showMessage('error', error)}
                  placeholder="将教师卡片放在HID读卡器上..."
                  className="py-4"
                />
              </CardContent>
            </Card>

            {/* 手动扫卡 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  手动扫卡考勤
                </CardTitle>
                <CardDescription>
                  手动输入教师卡号完成签到/签退
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 手动输入卡号 */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      输入教师卡号
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="请输入10位卡号"
                        value={currentCard}
                        onChange={(e) => setCurrentCard(e.target.value)}
                        className="flex-1"
                        maxLength={20}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentCard.trim()) {
                            handleManualCardInput(currentCard.trim())
                          }
                        }}
                      />
                      <Button 
                        onClick={() => handleManualCardInput(currentCard.trim())}
                        disabled={!currentCard.trim() || isProcessing}
                        className="px-6"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          '确认'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      按回车键或点击确认按钮执行考勤操作
                    </p>
                  </div>

                  {/* 快速卡号输入 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      快速输入 (数字键盘)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '清除', '确认'].map((item) => (
                        <Button
                          key={item}
                          variant="outline"
                          size="sm"
                          className="h-10"
                          onClick={() => {
                            if (item === '清除') {
                              setCurrentCard('')
                            } else if (item === '确认') {
                              if (currentCard.trim()) {
                                handleManualCardInput(currentCard.trim())
                              }
                            } else {
                              setCurrentCard(prev => prev + item.toString())
                            }
                          }}
                          disabled={isProcessing}
                        >
                          {item}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 教师选择 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      或选择教师
                    </label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => {
                        const selectedTeacher = teachers.find(t => t.id === e.target.value)
                        if (selectedTeacher) {
                          setCurrentTeacher(selectedTeacher)
                          setCurrentCard(selectedTeacher.cardNumber || '')
                        }
                      }}
                      disabled={isProcessing}
                    >
                      <option value="">选择教师...</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} {teacher.cardNumber ? `(${teacher.cardNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 当前选择的教师信息 */}
                  {currentTeacher && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">{currentTeacher.name}</p>
                            <p className="text-sm text-green-600">
                              {currentTeacher.position} - {currentTeacher.department}
                            </p>
                            {currentTeacher.cardNumber && (
                              <p className="text-xs text-green-500">卡号: {currentTeacher.cardNumber}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              const teacherId = currentTeacher.user_id || currentTeacher.id
                              const status = getTeacherTodayStatus(teacherId)
                              let action: 'check-in' | 'check-out'
                              if (status.canCheckIn) {
                                action = 'check-in'
                              } else if (status.canCheckOut) {
                                action = 'check-out'
                              } else {
                                action = 'check-in'
                              }
                              performTeacherAttendance(currentTeacher, action)
                            }}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              '执行考勤'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
                      placeholder="输入教师姓名"
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
                教师考勤记录
              </CardTitle>
              <CardDescription>
                查看和管理教师考勤记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">暂无教师考勤记录</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>教师信息</TableHead>
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
                              <div className="font-medium">{record.teacher_name}</div>
                              <div className="text-sm text-gray-500">{record.teacher_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>{record.branch_code || record.branch_name}</TableCell>
                          <TableCell>
                            {record.date ? (() => {
                              try {
                                // Handle both ISO strings and simple date strings
                                const dateStr = record.date.includes('T') ? record.date : `${record.date}T00:00:00.000Z`
                                return format(parseISO(dateStr), 'yyyy-MM-dd', { locale: zhCN })
                              } catch (error) {
                                console.warn('Invalid date format:', record.date, error)
                                return record.date || '-'
                              }
                            })() : '-'}
                          </TableCell>
                          <TableCell>
                            {record.check_in ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-green-500" />
                                {(() => {
                                  try {
                                    return format(parseISO(record.check_in), 'HH:mm:ss')
                                  } catch (error) {
                                    console.warn('Invalid check_in time format:', record.check_in, error)
                                    return record.check_in || '-'
                                  }
                                })()}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.check_out ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-red-500" />
                                {(() => {
                                  try {
                                    return format(parseISO(record.check_out), 'HH:mm:ss')
                                  } catch (error) {
                                    console.warn('Invalid check_out time format:', record.check_out, error)
                                    return record.check_out || '-'
                                  }
                                })()}
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
