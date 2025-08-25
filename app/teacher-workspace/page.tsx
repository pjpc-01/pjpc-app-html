"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useStudents } from "@/hooks/useStudents"
import ConnectionStatus from "@/components/ConnectionStatus"
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

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [topStudents, setTopStudents] = useState<Student[]>([])
  const [todaySchedule, setTodaySchedule] = useState<ClassSchedule[]>([])

  // 检查用户权限
  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== "teacher")) {
      router.push("/")
    }
  }, [user, userProfile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">加载教师工作台中...</p>
        </div>
      </div>
    )
  }

  if (!user || userProfile?.role !== "teacher") {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-100 text-green-700">已完成</Badge>
      case 'ongoing': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">进行中</Badge>
      case 'upcoming': return <Badge variant="outline" className="bg-gray-100 text-gray-700">即将开始</Badge>
      case 'cancelled': return <Badge variant="destructive">已取消</Badge>
      default: return <Badge variant="outline">未知</Badge>
    }
  }

  const getStudentStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge variant="default" className="bg-green-100 text-green-700">出勤</Badge>
      case 'absent': return <Badge variant="destructive">缺勤</Badge>
      case 'late': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">迟到</Badge>
      case 'excused': return <Badge variant="outline" className="bg-gray-100 text-gray-700">请假</Badge>
      default: return <Badge variant="outline">未知</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">


      <div className="flex">
        {/* 侧边栏 */}
        <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } min-h-screen shadow-sm`}>
          <nav className="p-4 space-y-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent space-y-2">
                <TabsTrigger 
                  value="dashboard" 
                  className="flex items-center gap-3 justify-start h-12 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-r-2 data-[state=active]:border-blue-600 rounded-lg transition-all"
                >
                  <Home className="h-5 w-5" />
                  {!sidebarCollapsed && <span>工作台</span>}
                </TabsTrigger>
                
                <TabsTrigger 
                  value="students" 
                  className="flex items-center gap-3 justify-start h-12 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-r-2 data-[state=active]:border-blue-600 rounded-lg transition-all"
                >
                  <Users className="h-5 w-5" />
                  {!sidebarCollapsed && <span>学生管理</span>}
                </TabsTrigger>
                
                <TabsTrigger 
                  value="attendance" 
                  className="flex items-center gap-3 justify-start h-12 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-r-2 data-[state=active]:border-blue-600 rounded-lg transition-all"
                >
                  <UserCheck className="h-5 w-5" />
                  {!sidebarCollapsed && <span>考勤管理</span>}
                </TabsTrigger>
                
                <TabsTrigger 
                  value="assignments" 
                  className="flex items-center gap-3 justify-start h-12 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-r-2 data-[state=active]:border-blue-600 rounded-lg transition-all"
                >
                  <FileText className="h-5 w-5" />
                  {!sidebarCollapsed && <span>作业管理</span>}
                </TabsTrigger>
                
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-3 justify-start h-12 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-r-2 data-[state=active]:border-blue-600 rounded-lg transition-all"
                >
                  <Settings className="h-5 w-5" />
                  {!sidebarCollapsed && <span>设置</span>}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard" className="mt-0 space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">我的学生</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                        <p className="text-xs text-blue-600 flex items-center mt-1">
                          <Activity className="h-3 w-3 mr-1" />
                          活跃学生
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">今日出勤</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}</p>
                        <div className="flex items-center mt-1">
                          <Progress value={stats.attendanceRate} className="w-16 h-2 mr-2" />
                          <span className="text-xs text-green-600">{stats.attendanceRate}%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <UserCheck className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">待批作业</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pendingAssignments}</p>
                        <p className="text-xs text-orange-600 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          需要处理
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <FileText className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">今日课程</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.todayClasses}</p>
                        <p className="text-xs text-purple-600 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          已安排
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <BookOpen className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 主要内容区域 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 今日课程安排 */}
                <div className="lg:col-span-2">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        今日课程安排
                      </CardTitle>
                      <CardDescription>查看今日的教学安排和课程状态</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {todaySchedule.length > 0 ? (
                        <div className="space-y-4">
                          {todaySchedule.map((classItem) => (
                            <div key={classItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-gray-900">{classItem.time}</p>
                                  <p className="text-xs text-gray-500">{classItem.duration}</p>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900">{classItem.subject}</h3>
                                  <p className="text-sm text-gray-600">{classItem.className} • {classItem.room}</p>
                                  <p className="text-xs text-gray-500">{classItem.students} 名学生</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(classItem.status)}
                                <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                    <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          暂无今日课程安排
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 最近活动 */}
                <div>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Activity className="h-5 w-5 text-green-600" />
                        </div>
                        最近活动
                      </CardTitle>
                      <CardDescription>查看您的最新教学活动</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentActivities.length > 0 ? (
                        <div className="space-y-4">
                          {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="mt-1">
                                {getStatusIcon(activity.status)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                <p className="text-xs text-gray-600">{activity.detail}</p>
                                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          暂无最近活动
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 优秀学生 */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    优秀学生
                  </CardTitle>
                  <CardDescription>表现优异的学生名单</CardDescription>
                </CardHeader>
                <CardContent>
                  {topStudents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {topStudents.map((student) => (
                        <div key={student.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.grade}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStudentStatusBadge(student.status)}
                              <span className="text-xs text-gray-500">{student.lastSeen}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{student.performance}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      暂无优秀学生数据
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 学生管理标签页 */}
            <TabsContent value="students" className="mt-0">
              <StudentManagement teacherId={user?.id} />
            </TabsContent>

            {/* 考勤管理标签页 */}
            <TabsContent value="attendance" className="mt-0">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">考勤管理</h2>
                <p className="text-gray-600 mt-1">管理学生出勤记录和考勤统计</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>考勤管理</CardTitle>
                  <CardDescription>考勤管理功能开发中...</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">考勤管理功能开发中...</p>
                </CardContent>
              </Card>
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

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">加载学生数据失败</h3>
                <p className="text-sm mt-2">{error}</p>
              </div>
              <Button onClick={refetch} className="bg-red-600 hover:bg-red-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
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
          <h3 className="text-lg font-semibold text-blue-600">
            学生管理
          </h3>
          <p className="text-sm text-gray-600">
            管理您的学生信息、查看学习进度和考勤记录
            {students.length > 0 && ` (共 ${students.length} 名学生)`}
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学生数据</h3>
              <p className="text-gray-600 mb-4">
                系统未找到任何学生记录。可能的原因：
              </p>
              <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  数据库中没有学生数据
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  数据库连接问题
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  权限不足
                </div>
              </div>
              <Button onClick={refetch} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 学生统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">总学生数</p>
                    <p className="text-2xl font-bold text-blue-800">{students.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">活跃学生</p>
                    <p className="text-2xl font-bold text-green-800">
                      {students.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">安亲服务</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {students.filter(s => s.serviceType === 'afterschool').length}
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">补习服务</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {students.filter(s => s.serviceType === 'tuition').length}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-600" />
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
      )}
    </div>
  )
}
