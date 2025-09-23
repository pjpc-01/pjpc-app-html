"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import TeacherDashboard from "@/app/components/teacher/TeacherDashboard"
import StudentProfileView from "@/app/components/teacher/StudentProfileView"
import TeacherStats from "@/app/components/teacher/TeacherStats"
import ClassSchedule from "@/app/components/teacher/ClassSchedule"
import AssignmentManagement from "@/app/components/management/assignment-management"
import CourseManagement from "@/app/components/management/course-management"
import ClassManagement from "@/app/components/management/class-management"
import AnnouncementManagement from "@/app/components/management/announcement-management"
import PointsManagement from "@/app/components/management/points-management"
import NFCReplacementCard from "@/components/teacher/NFCReplacementCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  LogOut,
  Bell,
  Settings,
  BarChart3,
  TrendingUp,
  Megaphone,
  Trophy,
  CreditCard
} from "lucide-react"

export default function TeacherWorkspace() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { teacher, loading: teacherLoading, error: teacherError } = useCurrentTeacher()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    loadNotifications()
  }, [user, router])

  const loadNotifications = async () => {
    try {
      // 模拟通知数据
      const mockNotifications = [
        {
          id: "1",
          title: "新作业提交",
          message: "李四提交了英语作业",
          time: "10分钟前",
          type: "assignment",
          read: false
        },
        {
          id: "2",
          title: "课程提醒",
          message: "数学课将在15分钟后开始",
          time: "5分钟前",
          type: "schedule",
          read: false
        },
        {
          id: "3",
          title: "家长消息",
          message: "张三的家长发来消息",
          time: "1小时前",
          type: "message",
          read: true
        }
      ]
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('加载通知失败:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }
  
  const unreadNotifications = notifications.filter(n => !n.read).length

  if (teacherLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载教师工作台...</p>
            </div>
      </div>
    )
  }

  if (teacherError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            加载教师信息失败: {teacherError}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!teacher) {
  return (
            <div className="p-6">
        <Alert>
          <AlertDescription>
            未找到教师信息，请检查您的账户设置。
          </AlertDescription>
        </Alert>
                  </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">教师工作台</h1>
                <p className="text-sm text-gray-600">欢迎回来，{teacher.name || user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 通知 */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {unreadNotifications}
                     </Badge>
                  )}
                             </Button>
                 </div>

              {/* 用户信息 */}
                            <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={teacher.avatar || user?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getInitials(teacher.name || user?.name || '')}
                                </AvatarFallback>
                              </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{teacher.name || user?.name}</p>
                  <p className="text-xs text-gray-500">{teacher.email || user?.email}</p>
              </div>
            </div>
              
              {/* 登出按钮 */}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                登出
                              </Button>
                            </div>
                          </div>
                  </div>
                </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              仪表板
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
              学生档案
              </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
              课程表
                  </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
              作业管理
                  </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              统计报告
                  </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              设置
                  </TabsTrigger>
                </TabsList>
                
          <TabsContent value="dashboard" className="space-y-6">
            <TeacherDashboard teacherId={teacher.id} />
                </TabsContent>
                
          <TabsContent value="students" className="space-y-6">
            <StudentProfileView teacherId={teacher.id} />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <ClassSchedule teacherId={teacher.id} />
                </TabsContent>
                
                <TabsContent value="assignments" className="space-y-6">
                  <AssignmentManagement />
            </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <TeacherStats teacherId={teacher.id} />
            </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 课程管理 */}
                  <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    课程管理
                  </CardTitle>
                  <CardDescription>管理您的课程和班级</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <CourseManagement />
                    <Separator />
                    <ClassManagement />
                      </div>
                    </CardContent>
                  </Card>

              {/* 通知管理 */}
                  <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    通知管理
                  </CardTitle>
                  <CardDescription>发送通知和公告</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnnouncementManagement />
                    </CardContent>
                  </Card>

              {/* 积分管理 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    积分管理
                      </CardTitle>
                  <CardDescription>管理学生积分和奖励</CardDescription>
                    </CardHeader>
                    <CardContent>
                  <PointsManagement />
                    </CardContent>
                  </Card>

              {/* NFC卡片管理 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    NFC卡片管理
                      </CardTitle>
                  <CardDescription>管理学生NFC卡片</CardDescription>
                    </CardHeader>
                    <CardContent>
                  <NFCReplacementCard />
                    </CardContent>
                  </Card>
              </div>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  )
}

