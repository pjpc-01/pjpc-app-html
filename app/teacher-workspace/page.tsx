"use client"

import { useState, useEffect } from "react"
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
  RefreshCw
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
  
  useEffect(() => {
    console.log('TeacherWorkspace StudentManagement: 学生数据状态:', {
      totalStudents: students.length,
      loading,
      error,
      teacherId
    })
    
    if (students.length > 0) {
      console.log('学生数据示例:', students[0])
    }
  }, [students, loading, error, teacherId])

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
                  {students.filter(s => s.status === 'online').length}
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
                  {students.filter(s => s.lastSeen && new Date(s.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
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
                  <Badge variant={student.status === 'online' ? 'default' : 'secondary'}>
                    {student.status === 'online' ? '在线' : '离线'}
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
function AttendanceManagement({ teacherId }: { teacherId?: string }) {
  const { students } = useStudents()
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [refreshKey, setRefreshKey] = useState(0)
  
  // 缺席管理状态
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [absenceReason, setAbsenceReason] = useState('')
  const [absenceDetail, setAbsenceDetail] = useState('')
  const [isMarkingAbsence, setIsMarkingAbsence] = useState(false)

  // 获取考勤数据
  const fetchAttendanceData = async () => {
    if (!teacherId) return
    
    setLoading(true)
    try {
      console.log('🔄 开始获取学生考勤数据...')
      const response = await fetch('/api/student-attendance')
      console.log('📡 学生考勤API响应状态:', response.status, response.statusText)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json()
            console.log('📊 接收到的学生考勤数据:', data)
            setAttendanceData(data.data || [])
          } catch (jsonError) {
            console.error('❌ 解析学生考勤数据失败:', jsonError)
            setAttendanceData([])
          }
        } else {
          console.error('❌ 学生考勤API返回非JSON数据:', contentType)
          setAttendanceData([])
        }
      } else {
        console.error('❌ 获取学生考勤数据失败:', response.status, response.statusText)
        setAttendanceData([])
      }
    } catch (error) {
      console.error('获取考勤数据出错:', error)
      setAttendanceData([])
    } finally {
      setLoading(false)
    }
  }

  // 标记学生缺席
  const handleMarkAbsence = async () => {
    if (!selectedStudent || !absenceReason || !teacherId) return
    
    setIsMarkingAbsence(true)
    try {
      const response = await fetch('/api/mark-absence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id || selectedStudent.student_id || '',
          reason: absenceReason,
          detail: absenceDetail,
          date: selectedDate,
          teacherId: teacherId
        }),
      })

      if (response.ok) {
        console.log('✅ 成功标记学生缺席')
        setRefreshKey(prev => prev + 1)
        setShowAbsenceModal(false)
        setSelectedStudent(null)
        setAbsenceReason('')
        setAbsenceDetail('')
      } else {
        console.error('❌ 标记学生缺席失败:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('标记学生缺席出错:', error)
    } finally {
      setIsMarkingAbsence(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    if (teacherId) {
      fetchAttendanceData()
    }
  }, [teacherId])

  // 刷新键变化时重新获取数据
  useEffect(() => {
    if (teacherId && refreshKey > 0) {
      fetchAttendanceData()
    }
  }, [refreshKey, teacherId])

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-600">
          考勤管理
        </h3>
        <p className="text-sm text-gray-600">实时监控学生出勤情况，管理考勤记录</p>
      </div>

      {/* 考勤统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">今日出勤</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceData.filter(a => a.date === selectedDate && a.status === 'present').length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">今日缺席</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceData.filter(a => a.date === selectedDate && a.status === 'absent').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceData.filter(a => a.date === selectedDate && a.status === 'late').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">出勤率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceData.length > 0 
                    ? Math.round((attendanceData.filter(a => a.date === selectedDate && a.status === 'present').length / attendanceData.filter(a => a.date === selectedDate).length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <Button size="sm" onClick={() => setShowAbsenceModal(true)}>
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
                    <TableCell>{record.time || '-'}</TableCell>
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

      {/* 缺席标记模态框 */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-red-800">标记学生缺席</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">👤 选择学生</label>
                <Select onValueChange={(value) => {
                  const student = students.find(s => s.student_id === value)
                  setSelectedStudent(student)
                }}>
                  <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="请选择缺席的学生" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.student_id} value={student.student_id}>
                        <div className="flex items-center gap-2">
                          <span>👨‍🎓</span>
                          <span>{student.student_name}</span>
                          <span className="text-gray-500">({student.student_id})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">🚨 缺席原因</label>
                <Select onValueChange={setAbsenceReason}>
                  <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="请选择缺席原因" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">🤒 生病</SelectItem>
                    <SelectItem value="leave">📝 请假</SelectItem>
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
    </>
  )
}

export default function TeacherWorkspace() {
  const router = useRouter()
  const { user, userProfile, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  // 使用真实数据，不设置默认值
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    todayClasses: 0,
    averageGrade: 0,
    recentMessages: 0
  })

  // 模拟数据
  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: "1",
      time: "2分钟前",
      action: "学生打卡",
      detail: "张三在WX01中心完成签到",
      type: "attendance",
      status: "success"
    },
    {
      id: "2",
      time: "5分钟前",
      action: "作业提交",
      detail: "李四提交了数学作业",
      type: "assignment",
      status: "pending"
    },
    {
      id: "3",
      time: "10分钟前",
      action: "课程开始",
      detail: "英语课在A教室开始",
      type: "class",
      status: "active"
    }
  ])

  const [upcomingClasses] = useState<ClassSchedule[]>([
    {
      id: "1",
      time: "14:00",
      duration: "45分钟",
      subject: "数学",
      className: "三年级A班",
      room: "A教室",
      students: 15,
      status: "upcoming"
    },
    {
      id: "2",
      time: "15:00",
      duration: "45分钟",
      subject: "英语",
      className: "四年级B班",
      room: "B教室",
      students: 12,
      status: "upcoming"
    }
  ])

  // 当用户数据加载完成后更新统计信息
  useEffect(() => {
    if (userProfile) {
      console.log('教师工作台: 用户资料已加载', userProfile)
    }
  }, [userProfile])

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
              <AttendanceManagement teacherId={user?.id} />
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
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
