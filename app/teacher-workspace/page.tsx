"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useStudents } from "@/hooks/useStudents"
import TeacherNavigation from "@/components/shared/TeacherNavigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  GraduationCap,
  Users,
  UserCheck,
  FileText,
  Calendar,
  BookOpen,
  MessageSquare,
  TrendingUp,
  LogOut,
  Bell,
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Activity,
  Clock,
  Award,
  Star,
  RefreshCw,
  Smartphone,
  MapPin,
  Shield,
  Globe,
  User,
  ArrowLeft
} from "lucide-react"

interface TeacherStats {
  totalStudents: number
  todayAttendance: number
  attendanceRate: number
  pendingAssignments: number
  completedAssignments: number
  todayClasses: number
  averageGrade: number
  recentMessages: number
}

interface RecentActivity {
  id: string
  time: string
  action: string
  detail: string
  type: string
  status: string
}

interface ClassSchedule {
  id: string
  time: string
  duration: string
  subject: string
  className: string
  room: string
  students: number
  status: string
}

// StudentManagement component
function StudentManagement({ teacherId }: { teacherId?: string }) {
  const { students, loading, error, refetch } = useStudents()
  


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-600">
              学生管理
            </h3>
            <p className="text-sm text-gray-600">管理您的学生信息、查看学习进度和考勤记录</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载学生数据...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-600">
              学生管理
            </h3>
            <p className="text-sm text-gray-600">管理您的学生信息、查看学习进度和考勤记录</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-2">加载学生数据失败</p>
              <p className="text-gray-600 text-sm">{error}</p>
              <Button onClick={refetch} className="mt-4" variant="outline">
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-600">
          学生管理
        </h3>
        <p className="text-sm text-gray-600">管理您的学生信息、查看学习进度和考勤记录</p>
      </div>

      {/* 学生统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">总学生数</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">在线学生</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">活跃学生</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>学生列表</CardTitle>
              <CardDescription>管理您的学生信息和状态</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加学生
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {student.student_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{student.student_name || '未知姓名'}</p>
                    <p className="text-sm text-gray-500">学号: {student.student_id || '无学号'}</p>
                    <p className="text-sm text-gray-500">中心: {student.center || '未指定'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                    {student.status === 'active' ? '在线' : '离线'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// AttendanceManagement component
function AttendanceManagement({ 
  teacherId,
  showAbsenceModal,
  setShowAbsenceModal,
  selectedStudent,
  setSelectedStudent,
  absenceReason,
  setAbsenceReason,
  absenceDetail,
  setAbsenceDetail,
  selectedDate,
  setSelectedDate,
  isMarkingAbsence
}: { 
  teacherId?: string
  showAbsenceModal: boolean
  setShowAbsenceModal: (show: boolean) => void
  selectedStudent: any
  setSelectedStudent: (student: any) => void
  absenceReason: string
  setAbsenceReason: (reason: string) => void
  absenceDetail: string
  setAbsenceDetail: (detail: string) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  isMarkingAbsence: boolean
}) {
  const { students } = useStudents()
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // 分行考勤管理状态
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null)
  const [showCenterDetail, setShowCenterDetail] = useState(false)
  
  // 分页状态
  const [unmarkedStudentsPage, setUnmarkedStudentsPage] = useState(1)

  // 考勤统计
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    averageRate: 0,
    bestDay: '',
    worstDay: ''
  })



  // 动态计算中心信息 - 基于真实的 students 数据
  const centers = useMemo(() => {
    if (!students || students.length === 0) {
      return [
        { 
          id: 'wx01', 
          name: 'WX 01', 
          status: 'active', 
          studentCount: 0, 
          lastActivity: '无数据',
          todayAttendance: 0,
          attendanceRate: 0,
          lateCount: 0,
          absentCount: 0
        },
        { 
          id: 'wx02', 
          name: 'WX 02', 
          status: 'active', 
          studentCount: 0, 
          lastActivity: '无数据',
          todayAttendance: 0,
          attendanceRate: 0,
          lateCount: 0,
          absentCount: 0
        },
        { 
          id: 'wx03', 
          name: 'WX 03', 
          status: 'active', 
          studentCount: 0, 
          lastActivity: '无数据',
          todayAttendance: 0,
          attendanceRate: 0,
          lateCount: 0,
          absentCount: 0
        },
        { 
          id: 'wx04', 
          name: 'WX 04', 
          status: 'active', 
          studentCount: 0, 
          lastActivity: '无数据',
          todayAttendance: 0,
          attendanceRate: 0,
          lateCount: 0,
          absentCount: 0
        }
      ]
    }

    // 计算每个中心的学生数量
    const centerCounts = students.reduce((acc, student) => {
      const center = student.center || 'WX 01' // 默认分配到 WX 01
      if (!acc[center]) {
        acc[center] = 0
      }
      acc[center]++
      return acc
    }, {} as Record<string, number>)



      // 基于真实考勤数据计算每个中心的考勤情况
  const calculateCenterAttendance = (centerId: string, studentCount: number) => {
    if (studentCount === 0) return { todayAttendance: 0, attendanceRate: 0, lateCount: 0, absentCount: 0 }
    
    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0]
    
    // 从真实考勤数据中筛选该中心的数据
    const centerAttendance = attendanceData.filter(record => {
      // 直接使用考勤记录的 center 字段匹配，因为已经修复了保存逻辑
      const centerMatch = record.center === centerId.toUpperCase().replace('WX', 'WX ')
      
      // 使用今天的日期而不是 selectedDate
      // 简化日期匹配：只要日期字符串包含今天的日期就算匹配
      const dateMatch = record.date && record.date.includes(today)
      
      const result = centerMatch && dateMatch
      

      
      return result
    })
    

    
    const presentCount = centerAttendance.filter(r => r.status === 'present').length
    const lateCount = centerAttendance.filter(r => r.status === 'late').length
    const absentCount = centerAttendance.filter(r => r.status === 'absent').length
    
    const attendanceRate = studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 0
    
    return {
      todayAttendance: presentCount,
      attendanceRate: Math.max(0, Math.min(100, attendanceRate)),
      lateCount: lateCount,
      absentCount: absentCount
    }
  }

    // 生成中心列表
    const centerList = [
      { id: 'wx01', name: 'WX 01', status: 'active' },
      { id: 'wx02', name: 'WX 02', status: 'active' },
      { id: 'wx03', name: 'WX 03', status: 'active' },
      { id: 'wx04', name: 'WX 04', status: 'active' }
    ]

    return centerList.map(center => {
      const studentCount = centerCounts[center.name] || 0
      const attendance = calculateCenterAttendance(center.id, studentCount)
      
      // 基于真实考勤数据计算最后活动时间
      const getLastActivity = () => {
        if (studentCount === 0) return '无活动'
        
        const centerAttendance = attendanceData.filter(record => {
          // 直接使用考勤记录的 center 字段匹配
          return record.center === center.name
        })
        
        if (centerAttendance.length === 0) return '无考勤记录'
        
        // 找到最新的考勤记录
        const latestRecord = centerAttendance.sort((a, b) => 
          new Date(b.timestamp || b.created || b.updated).getTime() - 
          new Date(a.timestamp || a.created || a.updated).getTime()
        )[0]
        
        if (!latestRecord) return '无时间记录'
        
        const timeDiff = Date.now() - new Date(latestRecord.timestamp || latestRecord.created || latestRecord.updated).getTime()
        const minutes = Math.floor(timeDiff / (1000 * 60))
        
        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes}分钟前`
        if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
        return `${Math.floor(minutes / 1440)}天前`
      }

      return {
        ...center,
        studentCount,
        lastActivity: getLastActivity(),
        ...attendance
      }
    })
  }, [students, attendanceData, selectedDate])

  // 获取考勤数据
  const fetchAttendanceData = async () => {
    if (!teacherId) return
    
    console.log('📊 开始获取考勤数据...')
    setLoading(true)
    try {
      const response = await fetch('/api/student-attendance')
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json()
            console.log('📊 获取到考勤数据:', data.data?.length || 0, '条记录')
            
            // 转换数据格式以匹配组件期望的结构
            const formattedData = (data.data || []).map((record: any) => {
              // 处理日期格式：如果 date 字段是 ISO 8601 格式，转换为 YYYY-MM-DD
              let processedDate = record.date
              if (record.date && (record.date.includes('T') || record.date.includes('Z'))) {
                processedDate = record.date.split('T')[0]
              } else if (!record.date && record.timestamp) {
                processedDate = new Date(record.timestamp).toISOString().split('T')[0]
              } else if (!record.date && !record.timestamp) {
                processedDate = new Date().toISOString().split('T')[0]
              }
              
              return {
                ...record,
                // 使用处理后的日期
                date: processedDate,
                // 确保状态值正确
                status: record.status === 'present' ? 'present' : 
                       record.status === 'late' ? 'late' : 
                       record.status === 'absent' ? 'absent' : 'present'
              }
            })
            
            console.log('📊 格式化后的考勤数据:', formattedData.length, '条记录')
            console.log('📊 缺席记录:', formattedData.filter((r: any) => r.status === 'absent').length, '条')
            setAttendanceData(formattedData)
          } catch (jsonError) {
            console.error('❌ 解析考勤数据失败:', jsonError)
            setAttendanceData([])
          }
        } else {
          console.error('❌ 响应不是JSON格式')
          setAttendanceData([])
        }
      } else {
        console.error('❌ 获取考勤数据失败:', response.status, response.statusText)
        setAttendanceData([])
      }
    } catch (error) {
      console.error('❌ 获取考勤数据异常:', error)
      setAttendanceData([])
    } finally {
      setLoading(false)
      console.log('📊 考勤数据获取完成')
    }
  }



  // 处理分行卡片点击
  const handleCenterClick = (centerId: string) => {
    setSelectedCenter(centerId)
    setShowCenterDetail(true)
  }

  // 返回分行概览
  const handleBackToOverview = () => {
    setShowCenterDetail(false)
    setSelectedCenter(null)
  }

  // 组件挂载时获取数据
  useEffect(() => {
    if (teacherId) {
      fetchAttendanceData()
    }
  }, [teacherId])

  // 监听刷新考勤数据事件
  useEffect(() => {
    const handleRefreshAttendance = () => {
      console.log('🔄 收到刷新考勤数据事件，开始刷新...')
      fetchAttendanceData()
    }

    window.addEventListener('refreshAttendanceData', handleRefreshAttendance)
    
    return () => {
      window.removeEventListener('refreshAttendanceData', handleRefreshAttendance)
    }
  }, [])

  // 通用的日期处理函数
  const processDate = (dateValue: any): string => {
    if (typeof dateValue === 'string') {
      // 处理ISO 8601格式：2025-08-30 09:36:20.489Z
      if (dateValue.includes(' ') || dateValue.includes('T') || dateValue.includes('Z')) {
        // 先按空格分割，再按T分割，取第一部分
        return dateValue.split(' ')[0].split('T')[0]
      } else {
        return dateValue
      }
    } else if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0]
    } else if (dateValue?.timestamp) {
      return new Date(dateValue.timestamp).toISOString().split('T')[0]
    }
    return ''
  }





  // 刷新键变化时重新获取数据
  useEffect(() => {
    if (teacherId && refreshKey > 0) {
      fetchAttendanceData()
    }
  }, [refreshKey, teacherId])



  // 如果显示中心详情，则显示详细内容
  if (showCenterDetail && selectedCenter) {
    const center = centers.find(c => c.id === selectedCenter)
    if (!center) return null

  return (
    <>
        {/* 返回按钮和中心标题 */}
      <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToOverview}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回分行概览
          </Button>
          <h3 className="text-xl font-semibold text-blue-600">
            {center.name} 中心 - 考勤详情
        </h3>
          <p className="text-sm text-gray-600">查看该中心的详细考勤信息和学生状态</p>
      </div>

        {/* 中心统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-600">总学生数</p>
                  <p className="text-2xl font-bold text-gray-900">{center.studentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-600">今日出勤</p>
                  <p className="text-2xl font-bold text-gray-900">{center.todayAttendance}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">迟到</p>
                  <p className="text-2xl font-bold text-gray-900">{center.lateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-600">缺席</p>
                  <p className="text-2xl font-bold text-gray-900">{center.absentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中心学生列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{center.name} 中心学生列表</CardTitle>
                <CardDescription>该中心的所有学生及其考勤状态</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
            </div>
          </CardHeader>
          

          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载学生数据...</p>
              </div>
            ) : (
              <div className="space-y-6">
                                 {/* 未考勤学生列表 */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                       <XCircle className="h-5 w-5" />
                       未考勤学生 ({students.filter(student => student.center === center.name && !attendanceData.some(att => {
                         // 更安全的日期处理
                         let attDate = ''
                         if (typeof att.date === 'string') {
                           if (att.date.includes('T') || att.date.includes('Z')) {
                             attDate = att.date.split('T')[0]
                           } else {
                             attDate = att.date
                           }
                         } else if (att.date instanceof Date) {
                           attDate = att.date.toISOString().split('T')[0]
                         } else if (att.timestamp) {
                           attDate = new Date(att.timestamp).toISOString().split('T')[0]
                         }
                         
                         const selDate = selectedDate
                         const dateMatch = attDate === selDate
                         
                         return (att.student_id === student.student_id || att.student_id === student.id) && 
                                att.center === center.name && 
                                dateMatch
                       })).length})
                     </h4>
                     <Badge variant="destructive" className="text-xs">
                       需要处理
                     </Badge>
                   </div>
                   
                   {(() => {
                     const unmarkedStudents = students
                       .filter(student => student.center === center.name && !attendanceData.some(att => {
                         // 更安全的日期处理 - 支持多种日期字段
                         let attDate = ''
                         const dateField = att.date || att.check_in || att.created
                         
                         if (typeof dateField === 'string') {
                           if (dateField.includes(' ')) {
                             attDate = dateField.split(' ')[0]
                           } else if (dateField.includes('T') || dateField.includes('Z')) {
                             attDate = dateField.split('T')[0]
                           } else {
                             attDate = dateField
                           }
                         } else if (dateField instanceof Date) {
                           attDate = dateField.toISOString().split('T')[0]
                         }
                         
                         const selDate = selectedDate
                         const dateMatch = attDate === selDate
                         
                         return (att.student_id === student.student_id || att.student_id === student.id) && 
                                att.center === center.name && 
                                dateMatch
                       }))
                     
                     // 分页逻辑
                     const itemsPerPage = 10
                     const totalPages = Math.ceil(unmarkedStudents.length / itemsPerPage)
                     const currentPage = 1 // 默认第一页
                     const startIndex = (currentPage - 1) * itemsPerPage
                     const endIndex = startIndex + itemsPerPage
                     const currentStudents = unmarkedStudents.slice(startIndex, endIndex)
                     
                     return (
                       <>
                         <div className="space-y-3">
                           {currentStudents.map((student) => (
                             <div key={student.id} className="flex items-center justify-between p-4 border-2 border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                               <div className="flex items-center space-x-3">
                                 <Avatar className="h-10 w-10">
                                   <AvatarFallback className="bg-red-100 text-red-600">
                                     {student.student_name?.charAt(0) || '?'}
                                   </AvatarFallback>
                                 </Avatar>
                                 <div>
                                   <p className="font-medium text-gray-900">{student.student_name || '未知姓名'}</p>
                                   <p className="text-sm text-gray-500">学号: {student.student_id || '无学号'}</p>
                                   <p className="text-sm text-gray-500">中心: {student.center || '未指定'}</p>
                                 </div>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <Badge variant="destructive" className="text-xs">
                                   未考勤
                                 </Badge>
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   onClick={() => {
                                     setSelectedStudent(student)
                                     setShowAbsenceModal(true)
                                   }}
                                   className="border-red-300 text-red-700 hover:bg-red-100"
                                 >
                                   <XCircle className="h-4 w-4 mr-2" />
                                   标记缺席
                                 </Button>
                               </div>
                             </div>
                           ))}
                           
                           {/* 如果没有未考勤学生，显示提示 */}
                           {unmarkedStudents.length === 0 && (
                             <div className="text-center py-6 text-green-600">
                               <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                               <p>所有学生都已考勤！</p>
                             </div>
                           )}
                         </div>
                         
                         {/* 分页控件 */}
                         {totalPages > 1 && (
                           <div className="flex items-center justify-center space-x-2 mt-6">
                             <Button
                               variant="outline"
                               size="sm"
                               disabled={currentPage === 1}
                               onClick={() => {
                                 // 分页功能待实现
                               }}
                             >
                               ← 上一页
                             </Button>
                             
                             <span className="text-sm text-gray-600">
                               第 {currentPage} 页，共 {totalPages} 页
                             </span>
                             
                             <Button
                               variant="outline"
                               size="sm"
                               disabled={currentPage === totalPages}
                               onClick={() => {
                                 // 分页功能待实现
                               }}
                             >
                               下一页 →
                             </Button>
                           </div>
                         )}
                       </>
                     )
                   })()}
                 </div>

                {/* 缺席学生列表 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      缺席学生 ({students.filter(student => student.center === center.name && attendanceData.some(att => {
                        // 更安全的日期处理 - 支持多种日期字段
                        let attDate = ''
                        // 优先使用 check_in 字段，如果没有则使用 date 字段
                        const dateField = att.check_in || att.date || att.timestamp
                        
                        if (typeof dateField === 'string') {
                          // 处理 YYYY-MM-DD HH:MM:SS 格式
                          if (dateField.includes(' ')) {
                            attDate = dateField.split(' ')[0]
                          } else if (dateField.includes('T') || dateField.includes('Z')) {
                            attDate = dateField.split('T')[0]
                          } else {
                            attDate = dateField
                          }
                        } else if (dateField instanceof Date) {
                          attDate = dateField.toISOString().split('T')[0]
                        } else if (att.timestamp) {
                          attDate = new Date(att.timestamp).toISOString().split('T')[0]
                        }
                        
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               att.status === 'absent'
                      })).length})
                    </h4>
                    <Badge variant="destructive" className="text-xs">
                      缺席
                    </Badge>
                  </div>
                  

                  
                  <div className="space-y-3">
                    {students
                      .filter(student => student.center === center.name && attendanceData.some(att => {
                        // 更安全的日期处理 - 支持多种日期字段
                        let attDate = ''
                        const dateField = att.date || att.check_in || att.created
                        
                        if (typeof dateField === 'string') {
                          if (dateField.includes(' ')) {
                            attDate = dateField.split(' ')[0]
                          } else if (dateField.includes('T') || dateField.includes('Z')) {
                            attDate = dateField.split('T')[0]
                          } else {
                            attDate = dateField
                          }
                        } else if (dateField instanceof Date) {
                          attDate = dateField.toISOString().split('T')[0]
                        }
                        
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               att.status === 'absent'
                      }))
                      .map((student) => {
                        const attendanceRecord = attendanceData.find(att => {
                          // 更安全的日期处理 - 支持多种日期字段
                          let attDate = ''
                          // 优先使用 check_in 字段，如果没有则使用 date 字段
                          const dateField = att.check_in || att.date || att.timestamp
                          
                          if (typeof dateField === 'string') {
                            // 处理 YYYY-MM-DD HH:MM:SS 格式
                            if (dateField.includes(' ')) {
                              attDate = dateField.split(' ')[0]
                            } else if (dateField.includes('T') || dateField.includes('Z')) {
                              attDate = dateField.split('T')[0]
                            } else {
                              attDate = dateField
                            }
                          } else if (dateField instanceof Date) {
                            attDate = dateField.toISOString().split('T')[0]
                          } else if (att.timestamp) {
                            attDate = new Date(att.timestamp).toISOString().split('T')[0]
                          }
                          
                          const selDate = selectedDate
                          const dateMatch = attDate === selDate
                          
                          return (att.student_id === student.student_id || att.student_id === student.id) && 
                                 att.center === center.name && 
                                 dateMatch && 
                                 att.status === 'absent'
                        })
                        
                        return (
                          <div key={student.id} className="flex items-center justify-between p-4 border-2 border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-red-100 text-red-600">
                                  {student.student_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{student.student_name || '未知姓名'}</p>
                                <p className="text-sm text-gray-500">学号: {student.student_id || '无学号'}</p>
                                <p className="text-sm text-gray-500">中心: {student.center || '未指定'}</p>
                                {attendanceRecord && (
                                  <div className="mt-1 space-y-1">
                                    <p className="text-xs text-red-600">
                                      缺席原因: {attendanceRecord.reason || '未指定'}
                                    </p>
                                    {attendanceRecord.detail && (
                                      <p className="text-xs text-red-500">
                                        详细说明: {attendanceRecord.detail}
                                      </p>
                                    )}
              </div>
                                )}
            </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="destructive" className="text-xs">
                                缺席
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setShowAbsenceModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    {students.filter(student => student.center === center.name && attendanceData.some(att => {
                        // 处理日期匹配：支持多种日期格式
                        const attDate = att.date ? att.date.split('T')[0] : ''
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               att.status === 'absent'
                      })).length === 0 && (
                      <div className="text-center py-6 text-green-600">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>没有缺席学生</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 已考勤学生列表（出勤和迟到） */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      已考勤学生 ({students.filter(student => student.center === center.name && attendanceData.some(att => {
                        // 更安全的日期处理
                        let attDate = ''
                        if (typeof att.date === 'string') {
                          if (att.date.includes('T') || att.date.includes('Z')) {
                            attDate = att.date.split('T')[0]
                          } else {
                            attDate = att.date
                          }
                        } else if (att.date instanceof Date) {
                          attDate = att.date.toISOString().split('T')[0]
                        } else if (att.timestamp) {
                          attDate = new Date(att.timestamp).toISOString().split('T')[0]
                        }
                        
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               (att.status === 'present' || att.status === 'late')
                      })).length})
                    </h4>
                    <Badge variant="default" className="text-xs">
                      已完成
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {students
                      .filter(student => student.center === center.name && attendanceData.some(att => {
                        // 更安全的日期处理 - 支持多种日期字段
                        let attDate = ''
                        const dateField = att.date || att.check_in || att.created
                        
                        if (typeof dateField === 'string') {
                          if (dateField.includes(' ')) {
                            attDate = dateField.split(' ')[0]
                          } else if (dateField.includes('T') || dateField.includes('Z')) {
                            attDate = dateField.split('T')[0]
                          } else {
                            attDate = dateField
                          }
                        } else if (dateField instanceof Date) {
                          attDate = dateField.toISOString().split('T')[0]
                        }
                        
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               (att.status === 'present' || att.status === 'late')
                      }))
                      .map((student) => {
                        const attendanceRecord = attendanceData.find(att => {
                          // 更安全的日期处理 - 支持多种日期字段
                          let attDate = ''
                          const dateField = att.date || att.check_in || att.created
                          
                          if (typeof dateField === 'string') {
                            if (dateField.includes(' ')) {
                              attDate = dateField.split(' ')[0]
                            } else if (dateField.includes('T') || dateField.includes('Z')) {
                              attDate = dateField.split('T')[0]
                            } else {
                              attDate = dateField
                            }
                          } else if (dateField instanceof Date) {
                            attDate = dateField.toISOString().split('T')[0]
                          }
                          
                          const selDate = selectedDate
                          const dateMatch = attDate === selDate
                          
                          return (att.student_id === student.student_id || att.student_id === student.id) && 
                                 att.center === center.name && 
                                 dateMatch && 
                                 (att.status === 'present' || att.status === 'late')
                        })
                        const status = attendanceRecord?.status || 'unknown'
                        
                        return (
                          <div key={student.id} className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                            status === 'present' ? 'border-green-200 bg-green-50 hover:bg-green-100' :
                            status === 'late' ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100' :
                            'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${
                                  status === 'present' ? 'bg-green-100 text-green-600' :
                                  status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {student.student_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{student.student_name || '未知姓名'}</p>
                                <p className="text-sm text-gray-500">学号: {student.student_id || '无学号'}</p>
                                <p className="text-sm text-gray-500">中心: {student.center || '未指定'}</p>
                                {attendanceRecord && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    考勤时间: {attendanceRecord.check_in ? 
                                      new Date(attendanceRecord.check_in).toLocaleTimeString('zh-CN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      }) : '未记录'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                status === 'present' ? 'default' :
                                status === 'late' ? 'secondary' :
                                'outline'
                              }>
                                {status === 'present' ? '出勤' :
                                 status === 'late' ? '迟到' : '未知'}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setShowAbsenceModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快速操作按钮 */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <Button 
            onClick={() => window.open(`/mobile-checkin/${center.id}`, '_blank')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            学生打卡入口
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open(`/teacher-checkin?center=${center.id}`, '_blank')}
          >
            <User className="h-4 w-4 mr-2" />
            教师打卡入口
          </Button>
      </div>
      </>
    )
  }

  // 显示分行概览界面
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-600">
            考勤管理
          </h3>
          <p className="text-sm text-gray-600">
            点击分行卡片查看详细考勤信息，未考勤学生可手动标记缺席原因
          </p>
        </div>
        <Button 
          onClick={fetchAttendanceData} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '刷新中...' : '刷新考勤数据'}
        </Button>
      </div>

      {/* 分行考勤概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {centers.map((center) => (
          <Card 
            key={center.id}
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              center.status === 'active' 
                ? 'border-2 border-green-200 hover:border-green-300 bg-green-50' 
                : 'border-2 border-gray-200 bg-gray-50'
            }`}
            onClick={() => center.status === 'active' && handleCenterClick(center.id)}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                {/* 中心名称和状态 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h4 className="text-lg font-bold text-gray-900">{center.name}</h4>
                  <Badge variant={center.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {center.status === 'active' ? '可用' : '维护中'}
                  </Badge>
                </div>
                
                {/* 考勤人数显示 */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {center.todayAttendance}/{center.studentCount}
                  </div>
                  <div className="text-sm text-gray-600">今日出勤/总人数</div>

                </div>
                
                {/* 出勤率 */}
                <div className="mb-4">
                  <div className="text-lg font-semibold text-green-600">
                    {center.attendanceRate}%
                  </div>
                  <div className="text-sm text-gray-600">出勤率</div>
                </div>
                
                {/* 迟到和缺席统计 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-yellow-100 rounded p-2">
                    <div className="font-semibold text-yellow-700">{center.lateCount}</div>
                    <div className="text-yellow-600">迟到</div>
                  </div>
                  <div className="bg-red-100 rounded p-2">
                    <div className="font-semibold text-red-700">{center.absentCount}</div>
                    <div className="text-red-600">缺席</div>
                  </div>
                </div>
                
                {/* 最后活动时间 */}
                <div className="mt-4 text-xs text-gray-500">
                  {center.lastActivity}
                </div>
                
                {/* 点击提示 */}
                {center.status === 'active' && (
                  <div className="mt-3 text-xs text-blue-600 font-medium">
                    点击查看详情 →
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>





      {/* 移动端考勤中心管理 */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Smartphone className="h-5 w-5" />
                移动端考勤中心
              </CardTitle>
              <CardDescription className="text-blue-700">管理各中心的移动端考勤状态和快速访问</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>实时更新</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open('/mobile-checkin', '_blank')}>
                <Globe className="h-4 w-4 mr-2" />
                移动端入口
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/teacher-checkin', '_blank')}>
                <User className="h-4 w-4 mr-2" />
                教师打卡
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {centers.map((center) => (
              <div
                key={center.id}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
                  center.status === 'active' 
                    ? 'border-green-200 hover:border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => center.status === 'active' && window.open(`/mobile-checkin/${center.id}`, '_blank')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{center.name}</h4>
                  </div>
                  <Badge variant={center.status === 'active' ? 'default' : 'secondary'}>
                    {center.status === 'active' ? '可用' : '维护中'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>学生数:</span>
                    <span className="font-medium">{center.studentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>状态:</span>
                    <span className="font-medium">{center.lastActivity}</span>
                  </div>
                </div>
                
                {center.status === 'active' && (
                  <div className="mt-3 space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/mobile-checkin/${center.id}`, '_blank')
                      }}
                    >
                      <Smartphone className="h-3 w-3 mr-1" />
                      学生打卡
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/teacher-checkin?center=${center.id}`, '_blank')
                      }}
                    >
                      <User className="h-4 w-4 mr-1" />
                      教师打卡
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 考勤记录表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>考勤记录</CardTitle>
              <CardDescription>查看和管理学生的考勤情况</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button size="sm" onClick={() => {
                setShowAbsenceModal(true)
              }}>
                <XCircle className="h-4 w-4 mr-2" />
                标记缺席
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载考勤数据...</p>
            </div>
          ) : attendanceData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>学号</TableHead>
                  <TableHead>中心</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.student_name}</TableCell>
                    <TableCell>{record.student_id}</TableCell>
                    <TableCell>{record.center}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Badge variant={
                        record.status === 'present' ? 'default' :
                        record.status === 'absent' ? 'destructive' :
                        record.status === 'late' ? 'secondary' : 'outline'
                      }>
                        {record.status === 'present' ? '出勤' :
                         record.status === 'absent' ? '缺席' :
                         record.status === 'late' ? '迟到' : record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.check_in ? 
                        new Date(record.check_in).toLocaleTimeString('zh-CN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">暂无考勤记录</p>
              <p className="text-gray-500 text-sm">请等待学生签到或手动添加考勤记录</p>
            </div>
          )}
        </CardContent>
      </Card>



    </>
  )
}

export default function TeacherWorkspace() {
  const router = useRouter()
  const { user, userProfile, loading, logout } = useAuth()
  const { students } = useStudents()
  const [activeTab, setActiveTab] = useState("dashboard")

  // 缺席管理状态 - 移动到主组件层级
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [absenceReason, setAbsenceReason] = useState('')
  const [absenceDetail, setAbsenceDetail] = useState('')
  const [isMarkingAbsence, setIsMarkingAbsence] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // 基于真实数据计算统计信息
  const stats = useMemo(() => {
    const totalStudents = students.length
    const todayAttendance = students.filter(s => s.status === 'active').length // 这里应该基于真实考勤数据
    const attendanceRate = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0
    
    return {
      totalStudents,
      todayAttendance,
      attendanceRate,
      pendingAssignments: 0, // 需要从作业API获取
      completedAssignments: 0, // 需要从作业API获取
      todayClasses: 0, // 需要从课程API获取
      averageGrade: 0, // 需要从成绩API获取
      recentMessages: 0 // 需要从消息API获取
    }
  }, [students])

  // 基于真实数据计算最近活动
  const recentActivities = useMemo(() => {
    if (!students || students.length === 0) {
      return []
    }
    
    // 等待真实数据API集成
    return []
  }, [students])

  // 基于真实数据计算即将开始的课程
  const upcomingClasses = useMemo(() => {
    // 等待真实数据API集成
    return []
  }, [])

  // 当用户数据加载完成后更新统计信息
  useEffect(() => {
    if (userProfile) {
      // 用户资料已加载，可以在这里添加额外的初始化逻辑
    }
  }, [userProfile])

  // 标记学生缺席 - 移动到主组件层级
  const handleMarkAbsence = async () => {
    if (!selectedStudent || !absenceReason || !user?.id) {
      return
    }
    
    setIsMarkingAbsence(true)
    try {
      const response = await fetch('/api/student-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: selectedStudent.student_id || '',
          student_name: selectedStudent.student_name || '',
          center: selectedStudent.center || '',
          date: selectedDate,
          status: 'absent',
          reason: absenceReason,
          detail: absenceDetail,
          teacher_id: user.id,
          method: 'manual'
        }),
      })

      if (response.ok) {
        // 显示成功提示
        alert(`✅ 成功标记学生 ${selectedStudent.student_name} 缺席`)
        
        // 关闭模态框并清空状态
        setShowAbsenceModal(false)
        setSelectedStudent(null)
        setAbsenceReason('')
        setAbsenceDetail('')
        
        // 立即刷新考勤数据
        console.log('✅ 缺席标记成功，立即刷新考勤数据...')
        window.dispatchEvent(new CustomEvent('refreshAttendanceData'))
        
        // 额外延迟刷新以确保数据同步
        setTimeout(() => {
          console.log('🔄 延迟刷新考勤数据...')
          window.dispatchEvent(new CustomEvent('refreshAttendanceData'))
        }, 1000)
      } else {
        alert(`❌ 标记缺席失败: ${response.status} ${response.statusText}`)
      }
         } catch (error) {
       // 标记缺席失败
     } finally {
      setIsMarkingAbsence(false)
    }
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载教师工作台...</p>
        </div>
      </div>
    )
  }

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    router.push('/login')
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <TeacherNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 主内容区域 */}
        <main className="w-full">
          {/* Tab导航 */}
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                考勤管理
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                学生管理
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                数据概览
              </TabsTrigger>
            </TabsList>

            {/* 考勤管理标签页 */}
            <TabsContent value="attendance" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">考勤管理系统</h2>
                <p className="text-gray-600">实时监控学生出勤情况，管理考勤记录</p>
              </div>
              <AttendanceManagement 
                teacherId={user?.id}
                showAbsenceModal={showAbsenceModal}
                setShowAbsenceModal={setShowAbsenceModal}
                selectedStudent={selectedStudent}
                setSelectedStudent={setSelectedStudent}
                absenceReason={absenceReason}
                setAbsenceReason={setAbsenceReason}
                absenceDetail={absenceDetail}
                setAbsenceDetail={setAbsenceDetail}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                isMarkingAbsence={isMarkingAbsence}
              />
            </TabsContent>

            {/* 学生管理标签页 */}
            <TabsContent value="students" className="space-y-6">
              <StudentManagement teacherId={user?.id} />
            </TabsContent>

            {/* 数据概览标签页 */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">数据概览</h2>
                <p className="text-gray-600">查看教学数据和统计信息</p>
              </div>
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">总学生数</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">今日出勤</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}</p>
                          <div className="flex items-center mt-1">
                            <Progress value={stats.attendanceRate} className="w-16 h-2 mr-2" />
                            <span className="text-xs text-green-600">{stats.attendanceRate}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">待批作业</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.pendingAssignments}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <BookOpen className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">今日课程</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.todayClasses}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 最近活动和即将开始的课程 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        最近活动
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentActivities.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              activity.status === 'success' ? 'bg-green-500' :
                              activity.status === 'pending' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                              <p className="text-sm text-gray-600">{activity.detail}</p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      ) : (
                        <div className="text-center py-8">
                          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">暂无活动记录</p>
                          <p className="text-gray-500 text-sm">等待真实数据加载</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        即将开始的课程
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {upcomingClasses.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingClasses.map((classItem) => (
                          <div key={classItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{classItem.subject}</p>
                              <p className="text-sm text-gray-600">{classItem.className} • {classItem.room}</p>
                              <p className="text-xs text-gray-500">{classItem.students} 名学生</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-blue-600">{classItem.time}</p>
                              <p className="text-xs text-gray-500">{classItem.duration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      ) : (
                        <div className="text-center py-8">
                          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">暂无课程安排</p>
                          <p className="text-gray-500 text-sm">等待真实数据加载</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>


              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* 全局缺席标记模态框 - 移动到主组件层级确保始终显示在最前面 */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-800">标记学生缺席</h3>
                <p className="text-sm text-red-600 mt-1">标记后学生将归类到缺席位置</p>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* 如果已经有选中的学生，显示学生信息；否则显示选择器 */}
              {selectedStudent ? (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">👤 选中的学生</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {selectedStudent.student_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedStudent.student_name}</p>
                        <p className="text-sm text-gray-500">学号: {selectedStudent.student_id}</p>
                        <p className="text-sm text-gray-500">中心: {selectedStudent.center}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedStudent(null)}
                    className="mt-2 text-xs"
                  >
                    更换学生
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">👤 选择学生</label>
                  <Select onValueChange={(value) => {
                    // 解析复合key来找到正确的学生
                    const [studentId, center, id] = value.split('-')
                    const student = students.find(s => 
                      s.student_id === studentId && 
                      s.center === center && 
                      s.id === id
                    )
                    setSelectedStudent(student)
                  }}>
                    <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="请选择缺席的学生" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {students?.map((student) => (
                        <SelectItem key={`${student.student_id}-${student.center}-${student.id}`} value={`${student.student_id}-${student.center}-${student.id}`}>
                          <div className="flex items-center gap-2">
                            <span>👨‍🎓</span>
                            <span>{student.student_name}</span>
                            <span className="text-gray-500">({student.student_id})</span>
                            <span className="text-blue-500 text-xs">[{student.center}]</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">🚨 缺席原因</label>
                <Select onValueChange={setAbsenceReason}>
                  <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="请选择缺席原因" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="sick">🤒 生病</SelectItem>
                    <SelectItem value="leave">📝 请假</SelectItem>
                    <SelectItem value="personal">👤 个人事务</SelectItem>
                    <SelectItem value="family">👨‍👩‍👧‍👦 家庭事务</SelectItem>
                    <SelectItem value="transportation">🚗 交通问题</SelectItem>
                    <SelectItem value="weather">🌧️ 天气原因</SelectItem>
                    <SelectItem value="emergency">🚨 紧急情况</SelectItem>
                    <SelectItem value="other">❓ 其他原因</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">📝 详细说明</label>
                <Input
                  value={absenceDetail}
                  onChange={(e) => setAbsenceDetail(e.target.value)}
                  placeholder="请输入详细说明（可选）"
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">📅 缺席日期</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={handleMarkAbsence}
                disabled={!selectedStudent || !absenceReason || isMarkingAbsence}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isMarkingAbsence ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    标记中...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    确认标记缺席
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowAbsenceModal(false)
                  setSelectedStudent(null)
                  setAbsenceReason('')
                  setAbsenceDetail('')
                }}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ❌ 取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
