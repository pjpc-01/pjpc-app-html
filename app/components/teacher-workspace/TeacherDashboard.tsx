"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Activity, 
  CheckCircle,
  AlertCircle,
  UserCheck,
  Bell,
  Award,
  Star,
  Plus,
  Eye,
  Edit,
  Download,
  Upload,
  Bookmark,
  Share2,
  Target,
  Zap
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
  upcomingEvents: number
  totalCourses: number
  resourceCount: number
}

interface ClassSchedule {
  id: string
  time: string
  subject: string
  className: string
  status: 'completed' | 'ongoing' | 'upcoming' | 'cancelled'
  students: number
  room: string
  duration: string
}

interface RecentActivity {
  id: string
  time: string
  action: string
  detail: string
  type: 'assignment' | 'attendance' | 'course' | 'communication' | 'grade' | 'event'
  status: 'success' | 'warning' | 'error' | 'info'
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  color: string
}

interface TeacherDashboardProps {
  teacherId?: string
}

export default function TeacherDashboard({ teacherId }: TeacherDashboardProps) {
  // 模拟数据 - 实际应用中这些数据应该从API获取
  const [stats] = useState<TeacherStats>({
    totalStudents: 28,
    todayAttendance: 26,
    attendanceRate: 93,
    pendingAssignments: 12,
    completedAssignments: 45,
    todayClasses: 3,
    averageGrade: 87,
    recentMessages: 8,
    upcomingEvents: 5,
    totalCourses: 4,
    resourceCount: 156
  })

  const [todaySchedule] = useState<ClassSchedule[]>([
    { 
      id: "1", 
      time: "09:00", 
      subject: "数学", 
      className: "三年级A班", 
      status: "completed", 
      students: 24, 
      room: "教室101", 
      duration: "45分钟" 
    },
    { 
      id: "2", 
      time: "14:00", 
      subject: "英语", 
      className: "四年级B班", 
      status: "ongoing", 
      students: 22, 
      room: "教室102", 
      duration: "45分钟" 
    },
    { 
      id: "3", 
      time: "16:00", 
      subject: "科学", 
      className: "五年级C班", 
      status: "upcoming", 
      students: 26, 
      room: "实验室A", 
      duration: "60分钟" 
    }
  ])

  const [recentActivities] = useState<RecentActivity[]>([
    { 
      id: "1", 
      time: "10:30", 
      action: "批改作业", 
      detail: "数学练习册 - 三年级A班", 
      type: "assignment", 
      status: "success" 
    },
    { 
      id: "2", 
      time: "09:45", 
      action: "学生签到", 
      detail: "小明已到校", 
      type: "attendance", 
      status: "success" 
    },
    { 
      id: "3", 
      time: "09:20", 
      action: "课程准备", 
      detail: "英语课件已上传", 
      type: "course", 
      status: "info" 
    },
    { 
      id: "4", 
      time: "08:50", 
      action: "家长沟通", 
      detail: "与李家长讨论学习进度", 
      type: "communication", 
      status: "success" 
    }
  ])

  const quickActions: QuickAction[] = [
    {
      id: "1",
      title: "记录考勤",
      description: "快速记录学生出勤情况",
      icon: <UserCheck className="h-6 w-6" />,
      action: () => console.log("记录考勤"),
      color: "bg-green-500"
    },
    {
      id: "2",
      title: "布置作业",
      description: "创建新的作业任务",
      icon: <FileText className="h-6 w-6" />,
      action: () => console.log("布置作业"),
      color: "bg-blue-500"
    },
    {
      id: "3",
      title: "上传资源",
      description: "分享教学资料",
      icon: <Upload className="h-6 w-6" />,
      action: () => console.log("上传资源"),
      color: "bg-purple-500"
    },
    {
      id: "4",
      title: "查看成绩",
      description: "查看学生成绩统计",
      icon: <BarChart3 className="h-6 w-6" />,
      action: () => console.log("查看成绩"),
      color: "bg-orange-500"
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'info': return <AlertCircle className="h-4 w-4 text-blue-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
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

  return (
    <div className="space-y-6">
      {/* 页面标题和描述 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">教师工作台</h2>
        <p className="text-gray-600 mt-1">欢迎回来！查看您的教学概况和今日安排</p>
      </div>

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

      {/* 快速操作 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            快速操作
          </CardTitle>
          <CardDescription>常用功能快速访问</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all"
                onClick={action.action}
              >
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 教学资源概览 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bookmark className="h-5 w-5 text-yellow-600" />
            </div>
            教学资源概览
          </CardTitle>
          <CardDescription>您的教学资源库统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              <p className="text-sm text-gray-600">课程数量</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Download className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.resourceCount}</p>
              <p className="text-sm text-gray-600">资源文件</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageGrade}%</p>
              <p className="text-sm text-gray-600">平均成绩</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

