"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  BookOpen,
  MessageSquare,
  TrendingUp,
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
  ArrowLeft, 
  ArrowRight,
  Filter,
  Phone,
  Mail,
  Heart,
  Car,
  FileText,
  Megaphone,
  Trophy,
  CreditCard,
  Zap,
  BarChart3
} from "lucide-react"
import Link from "next/link"

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

interface TeacherDashboardProps {
  teacherId?: string
}

export default function TeacherDashboard({ teacherId }: TeacherDashboardProps) {
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    todayClasses: 0,
    averageGrade: 0,
    recentMessages: 0,
  })

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [todaySchedule, setTodaySchedule] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [teacherId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 模拟数据加载
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟统计数据
      setStats({
        totalStudents: 45,
        todayAttendance: 38,
        attendanceRate: 84.4,
        pendingAssignments: 12,
        completedAssignments: 28,
        todayClasses: 4,
        averageGrade: 85.2,
        recentMessages: 3,
      })

      // 模拟最近活动
      setRecentActivities([
        {
          id: "1",
          time: "10:30",
          action: "学生签到",
          detail: "张三在数学课上签到",
          type: "attendance",
          status: "success"
        },
        {
          id: "2", 
          time: "09:15",
          action: "作业提交",
          detail: "李四提交了英语作业",
          type: "assignment",
          status: "success"
        },
        {
          id: "3",
          time: "08:45",
          action: "课程开始",
          detail: "开始数学课 - 三年级A班",
          type: "class",
          status: "active"
        }
      ])

      // 模拟今日课程表
      setTodaySchedule([
        {
          id: "1",
          time: "08:00",
          duration: "45分钟",
          subject: "数学",
          className: "三年级A班",
          room: "教室101",
          students: 25,
          status: "completed"
        },
        {
          id: "2",
          time: "09:00",
          duration: "45分钟", 
          subject: "英语",
          className: "三年级B班",
          room: "教室102",
          students: 23,
          status: "completed"
        },
        {
          id: "3",
          time: "10:00",
          duration: "45分钟",
          subject: "数学",
          className: "三年级A班", 
          room: "教室101",
          students: 25,
          status: "active"
        },
        {
          id: "4",
          time: "11:00",
          duration: "45分钟",
          subject: "科学",
          className: "三年级C班",
          room: "教室103", 
          students: 20,
          status: "upcoming"
        }
      ])

    } catch (error) {
      console.error('加载仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'active': return 'text-blue-600'
      case 'upcoming': return 'text-gray-600'
      case 'completed': return 'text-gray-500'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'active': return <Activity className="h-4 w-4" />
      case 'upcoming': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载仪表板中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总学生数</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日出勤</p>
                <p className="text-2xl font-bold text-green-600">{stats.todayAttendance}</p>
                <p className="text-xs text-gray-500">出勤率 {stats.attendanceRate}%</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待批作业</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingAssignments}</p>
                <p className="text-xs text-gray-500">已完成 {stats.completedAssignments}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日课程</p>
                <p className="text-2xl font-bold text-purple-600">{stats.todayClasses}</p>
                <p className="text-xs text-gray-500">平均分 {stats.averageGrade}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 今日课程表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              今日课程表
            </CardTitle>
            <CardDescription>今天的课程安排</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySchedule.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`p-4 rounded-lg border ${
                    schedule.status === 'active' 
                      ? 'border-blue-500 bg-blue-50' 
                      : schedule.status === 'completed'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        schedule.status === 'active' 
                          ? 'bg-blue-100 text-blue-600'
                          : schedule.status === 'completed'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getStatusIcon(schedule.status)}
                      </div>
                      <div>
                        <p className="font-medium">{schedule.subject}</p>
                        <p className="text-sm text-gray-600">{schedule.className}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{schedule.time}</p>
                      <p className="text-sm text-gray-600">{schedule.duration}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                    <span>{schedule.room}</span>
                    <span>{schedule.students} 名学生</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              最近活动
            </CardTitle>
            <CardDescription>最新的教学活动</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' 
                      ? 'bg-green-100 text-green-600'
                      : activity.status === 'active'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    <p className="text-sm text-gray-600">{activity.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            快速操作
          </CardTitle>
          <CardDescription>常用功能快速访问</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/unified-attendance">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">统一考勤</span>
              </Button>
            </Link>
            <Link href="/attendance-management">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">AI考勤系统</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <UserCheck className="h-6 w-6" />
              <span className="text-sm">点名</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">布置作业</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">发送通知</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
