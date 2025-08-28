"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useStudents } from "@/hooks/useStudents"
import ConnectionStatus from "@/components/ConnectionStatus"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
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
  User,
  UserCheck,
  FileText,
  Calendar,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Menu,
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
  Home,
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

interface Student {
  id: string
  name: string
  grade: string
  status: string
  lastSeen: string
  performance: number
  avatar?: string
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

export default function TeacherWorkspace() {
  const router = useRouter()
  const { user, userProfile, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
      // 这里可以根据实际数据更新统计信息
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">教师工作台</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {userProfile?.name?.charAt(0) || user.email?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{userProfile?.name || '教师'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* 侧边栏 */}
          <div className={`w-64 mr-8 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : ''}`}>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="space-y-2">
                <Button
                  variant={activeTab === "dashboard" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <Home className="h-5 w-5 mr-3" />
                  {!sidebarCollapsed && <span>仪表板</span>}
                </Button>
                
                <Button
                  variant={activeTab === "students" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("students")}
                >
                  <Users className="h-5 w-5 mr-3" />
                  {!sidebarCollapsed && <span>学生管理</span>}
                </Button>
                
                <Button
                  variant={activeTab === "attendance" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("attendance")}
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  {!sidebarCollapsed && <span>考勤管理</span>}
                </Button>
                
                <Button
                  variant={activeTab === "assignments" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("assignments")}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  {!sidebarCollapsed && <span>作业管理</span>}
                </Button>
                
                <Button
                  variant={activeTab === "settings" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  {!sidebarCollapsed && <span>设置</span>}
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">收起侧边栏</span>}
              </Button>
            </div>
          </div>

          {/* 主内容区域 */}
          <main className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="dashboard">仪表板</TabsTrigger>
                <TabsTrigger value="students">学生管理</TabsTrigger>
                <TabsTrigger value="attendance">考勤管理</TabsTrigger>
                <TabsTrigger value="assignments">作业管理</TabsTrigger>
                <TabsTrigger value="settings">设置</TabsTrigger>
              </TabsList>

              {/* 仪表板标签页 */}
              <TabsContent value="dashboard" className="mt-0">
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

              {/* 学生管理标签页 */}
              <TabsContent value="students" className="mt-0">
                <StudentManagement teacherId={user?.id} />
              </TabsContent>

              {/* 考勤管理标签页 */}
              <TabsContent value="attendance" className="mt-0">
                <AttendanceManagement teacherId={user?.id} />
              </TabsContent>

              {/* 作业管理标签页 */}
              <TabsContent value="assignments" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">作业管理</h2>
                  <p className="text-gray-600 mt-1">创建、分配和批改学生作业</p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>作业管理</CardTitle>
                    <CardDescription>作业管理功能开发中...</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">作业管理功能开发中...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 设置标签页 */}
              <TabsContent value="settings" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">设置</h2>
                  <p className="text-gray-600 mt-1">个性化您的教师工作台设置</p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>设置</CardTitle>
                    <CardDescription>设置功能开发中...</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">设置功能开发中...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  )
}

// Inline StudentManagement component
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
                <p className="text-sm font-medium text-gray-600">活跃学生</p>
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">安亲服务</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.serviceType === 'afterschool').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            学生列表
          </CardTitle>
          <CardDescription>
            显示所有学生的基本信息和状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">学生信息</TableHead>
                  <TableHead className="font-semibold">年级/标准</TableHead>
                  <TableHead className="font-semibold">学校</TableHead>
                  <TableHead className="font-semibold">中心</TableHead>
                  <TableHead className="font-semibold">服务类型</TableHead>
                  <TableHead className="font-semibold">状态</TableHead>
                  <TableHead className="font-semibold">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.slice(0, 10).map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {student.student_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.student_name || '未知姓名'}</div>
                          <div className="text-sm text-gray-500">
                            {student.student_id ? `学号: ${student.student_id}` : '无学号'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {student.standard || student.level || '未知'}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.school || '未知'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {student.center || '未知'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.serviceType === 'afterschool' ? 'default' : 'secondary'}>
                        {student.serviceType === 'afterschool' ? '安亲' : 
                         student.serviceType === 'tuition' ? '补习' : '未知'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'destructive'}>
                        {student.status === 'active' ? '活跃' : '非活跃'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {students.length > 10 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              显示前 10 名学生，共 {students.length} 名
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// 考勤管理组件 - 合并版本（取长补短）
function AttendanceManagement({ teacherId }: { teacherId?: string }) {
  const { students, loading: studentsLoading } = useStudents()
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [teacherAttendanceData, setTeacherAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedCenter, setSelectedCenter] = useState<string>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // 缺席管理状态
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [absenceReason, setAbsenceReason] = useState('')
  const [absenceDetail, setAbsenceDetail] = useState('')
  const [isMarkingAbsence, setIsMarkingAbsence] = useState(false)

  // 获取考勤数据
  const fetchAttendanceData = useCallback(async () => {
    if (!teacherId) return
    
    setLoading(true)
    try {
      // 获取学生考勤数据
      const studentResponse = await fetch('/api/student-attendance')
      if (studentResponse.ok) {
        // 检查响应类型
        const contentType = studentResponse.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const studentData = await studentResponse.json()
            setAttendanceData(studentData.data || [])
          } catch (jsonError) {
            console.error('解析学生考勤数据失败:', jsonError)
            setAttendanceData([])
          }
        } else {
          console.error('学生考勤API返回非JSON数据:', contentType)
          setAttendanceData([])
        }
      } else {
        console.error('获取学生考勤数据失败:', studentResponse.status, studentResponse.statusText)
        setAttendanceData([])
      }

      // 获取教师考勤数据
      const teacherResponse = await fetch(`/api/teacher-attendance?type=teacher&date=${selectedDate}`)
      if (teacherResponse.ok) {
        // 检查响应类型
        const contentType = teacherResponse.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const teacherData = await teacherResponse.json()
            setTeacherAttendanceData(teacherData.data || [])
          } catch (jsonError) {
            console.error('解析教师考勤数据失败:', jsonError)
            setTeacherAttendanceData([])
          }
        } else {
          console.error('教师考勤API返回非JSON数据:', contentType)
          setTeacherAttendanceData([])
        }
      } else {
        console.error('获取教师考勤数据失败:', teacherResponse.status, teacherResponse.statusText)
        setTeacherAttendanceData([])
      }
    } catch (error) {
      console.error('获取考勤数据出错:', error)
      setAttendanceData([])
      setTeacherAttendanceData([])
    } finally {
      setLoading(false)
    }
  }, [teacherId, selectedDate])

  // 自动刷新考勤数据
  useEffect(() => {
    fetchAttendanceData()
    
    // 每30秒自动刷新一次
    const interval = setInterval(fetchAttendanceData, 30000)
    
    return () => clearInterval(interval)
  }, [fetchAttendanceData, refreshKey])

  // 手动刷新
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  // 标记学生缺席
  const handleMarkAbsence = async () => {
    if (!selectedStudent || !absenceReason || !teacherId) return
    
    setIsMarkingAbsence(true)
    try {
      const response = await fetch('/api/teacher-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: teacherId,
          teacherName: '教师', // 这里可以从用户信息获取
          centerId: selectedCenter === 'all' ? 'unknown' : selectedCenter,
          centerName: selectedCenter === 'all' ? '所有中心' : selectedCenter,
          branchId: selectedCenter === 'all' ? 'unknown' : selectedCenter,
          branchName: selectedCenter === 'all' ? '所有中心' : selectedCenter,
          type: 'mark-absence',
          studentId: selectedStudent.student_id || selectedStudent.id,
          studentName: selectedStudent.student_name || '未知学生',
          absenceReason: absenceReason,
          absenceDetail: absenceDetail,
          absenceDate: selectedDate,
          timestamp: new Date().toISOString(),
          method: 'manual',
          status: 'success'
        })
      })

      if (response.ok) {
        console.log('✅ 学生缺席记录已保存')
        setShowAbsenceModal(false)
        setSelectedStudent(null)
        setAbsenceReason('')
        setAbsenceDetail('')
        // 刷新数据
        handleRefresh()
      } else {
        console.error('❌ 标记缺席失败:', response.statusText)
      }
    } catch (error) {
      console.error('标记缺席出错:', error)
    } finally {
      setIsMarkingAbsence(false)
    }
  }

  // 过滤考勤数据
  const filteredAttendance = attendanceData.filter(record => {
    const matchesDate = !selectedDate || record.date === selectedDate
    const matchesCenter = selectedCenter === 'all' || record.branch_code === selectedCenter
    return matchesDate && matchesCenter
  })

  // 获取今日考勤统计
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceData.filter(record => record.date === today)
    
    return {
      total: todayRecords.length,
      present: todayRecords.filter(r => r.status === 'present').length,
      absent: todayRecords.filter(r => r.status === 'absent').length,
      late: todayRecords.filter(r => r.status === 'late').length
    }
  }, [attendanceData])

  // 获取中心列表
  const centers = useMemo(() => {
    const centerSet = new Set(attendanceData.map(r => r.branch_code).filter(Boolean))
    return Array.from(centerSet)
  }, [attendanceData])

  if (studentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-600">考勤管理</h3>
            <p className="text-sm text-gray-600">实时查看学生出勤记录和考勤统计</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载考勤数据...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-600">考勤管理</h3>
          <p className="text-sm text-gray-600">实时查看学生出勤记录和考勤统计</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button 
            onClick={() => setShowAbsenceModal(true)} 
            variant="destructive" 
            size="sm"
          >
            <XCircle className="h-4 w-4 mr-2" />
            标记缺席
          </Button>

        </div>
      </div>

      {/* 今日考勤统计 - 优化设计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">今日总人数</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
                <p className="text-xs text-gray-500">实时更新</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">出席</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.present}</p>
                <p className="text-xs text-gray-500">按时到校</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">迟到</p>
                <p className="text-2xl font-bold text-yellow-600">{todayStats.late}</p>
                <p className="text-xs text-gray-500">需要关注</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">缺席</p>
                <p className="text-2xl font-bold text-red-600">{todayStats.absent}</p>
                <p className="text-xs text-gray-500">需要跟进</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 - 优化设计 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Search className="h-5 w-5" />
            筛选设置
          </CardTitle>
          <CardDescription className="text-blue-600">
            选择日期和中心进行筛选，实时查看考勤数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-blue-700">选择日期</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-44 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-blue-700">选择中心</label>
              <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                <SelectTrigger className="w-44 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="选择中心" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏢 所有中心</SelectItem>
                  {centers.map(center => (
                    <SelectItem key={center} value={center}>
                      📍 {center}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新数据
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 教师考勤状态 - 优化设计 */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <UserCheck className="h-5 w-5" />
            教师考勤状态
          </CardTitle>
          <CardDescription className="text-purple-600">
            今日教师签到签退记录，实时监控教师出勤情况
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teacherAttendanceData.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Info className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-purple-600 font-medium">暂无教师考勤记录</p>
              <p className="text-sm text-purple-500 mt-1">教师尚未进行今日打卡</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teacherAttendanceData.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                  <div>
                      <p className="font-semibold text-gray-900">{record.teacher_name}</p>
                      <p className="text-sm text-purple-600">{record.branch_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={record.check_in ? "default" : "secondary"} className="bg-purple-100 text-purple-700 border-purple-200">
                        {record.check_in ? '✅ 已签到' : '⏰ 未签到'}
                      </Badge>
                      {record.check_out && (
                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                          🏠 已签退
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      {record.check_in && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          签到: {new Date(record.check_in).toLocaleTimeString('zh-CN')}
                        </div>
                      )}
                      {record.check_out && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          签退: {new Date(record.check_out).toLocaleTimeString('zh-CN')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 考勤记录表格 - 优化设计 */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <FileText className="h-5 w-5" />
            考勤记录
          </CardTitle>
          <CardDescription className="text-green-600">
            显示筛选后的考勤记录，数据每30秒自动更新，支持实时监控
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-green-600 font-medium">正在加载考勤数据...</p>
              <p className="text-sm text-green-500">请稍候，正在获取最新信息</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-green-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Info className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-green-600 font-medium">没有找到符合条件的考勤记录</p>
              <p className="text-sm text-green-500 mt-2">
                请检查筛选条件或等待学生打卡数据
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <TableHead className="font-semibold text-green-800">👤 学生信息</TableHead>
                    <TableHead className="font-semibold text-green-800">🏢 分行</TableHead>
                    <TableHead className="font-semibold text-green-800">📅 日期</TableHead>
                    <TableHead className="font-semibold text-green-800">⏰ 签到时间</TableHead>
                    <TableHead className="font-semibold text-green-800">📊 状态</TableHead>
                    <TableHead className="font-semibold text-green-800">🔧 打卡方式</TableHead>
                    <TableHead className="font-semibold text-green-800">📝 备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id} className="hover:bg-green-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8 ring-2 ring-green-100">
                            <AvatarFallback className="bg-green-100 text-green-600 font-semibold">
                              {record.student_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">{record.student_name || '未知姓名'}</div>
                            <div className="text-sm text-green-600">
                              {record.student_id ? `学号: ${record.student_id}` : '无学号'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                          🏢 {record.branch_name || record.branch_code || '未知'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{record.date || '未知'}</TableCell>
                      <TableCell>
                        {record.check_in ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Clock className="h-3 w-3" />
                            {new Date(record.check_in).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400">⏰ 未签到</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={record.status === 'present' ? 'default' : 
                                  record.status === 'late' ? 'secondary' : 'destructive'}
                          className={record.status === 'present' ? 'bg-green-100 text-green-700 border-green-200' :
                                   record.status === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                   'bg-red-100 text-red-700 border-red-200'}
                        >
                          {record.status === 'present' ? '✅ 出席' : 
                           record.status === 'late' ? '⏰ 迟到' : '❌ 缺席'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          {record.notes?.includes('manual') ? '✏️ 手动输入' :
                           record.notes?.includes('nfc') ? '📱 NFC卡片' :
                           record.notes?.includes('url') ? '🔗 URL识别' : '❓ 未知'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {record.notes || '📝 无备注'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredAttendance.length > 0 && (
            <div className="mt-4 text-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                📊 显示 {filteredAttendance.length} 条考勤记录
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 缺席管理模态框 - 优化设计 */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-red-800">标记学生缺席</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">👤 选择学生</label>
                <Select onValueChange={(value) => {
                  const student = students.find(s => s.id === value)
                  setSelectedStudent(student)
                }}>
                  <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="请选择缺席的学生" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
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
    </div>
  )
}
