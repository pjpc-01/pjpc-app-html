"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import TeacherDashboard from "@/app/components/teacher/TeacherDashboard"
import StudentProfileView from "@/app/components/teacher/StudentProfileView"
import TeacherStats from "@/app/components/teacher/TeacherStats"
import ClassSchedule from "@/app/components/teacher/ClassSchedule"
import TeacherProfile from "@/app/components/teacher/TeacherProfile"
// 这些组件暂时注释掉，因为文件不存在
// import AssignmentManagement from "@/app/components/management/assignment-management"
// import CourseManagement from "@/app/components/management/course-management"
// import ClassManagement from "@/app/components/management/class-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
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
  CreditCard,
  Trophy,
  User
} from "lucide-react"

export default function TeacherWorkspace() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { teacher, loading: teacherLoading, error: teacherError } = useCurrentTeacher()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    // 检查用户角色，管理员不应该访问教师工作台
    if (user.role === 'admin') {
      console.log('⚠️ 管理员账户尝试访问教师工作台，重定向到管理员面板')
      router.push('/admin-dashboard')
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
      router.push('/')
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

  const teacherActions = (
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
  )

  return (
    <PageLayout
      title="教师工作台"
      description={`欢迎回来，${teacher.name || user?.name}`}
      userRole="teacher"
      status="系统正常"
      background="bg-gray-50"
      actions={teacherActions}
    >

      <TabbedPage
        tabs={[
          {
            id: 'dashboard',
            label: '仪表板',
            icon: BarChart3,
            content: <TeacherDashboard teacherId={teacher.id} />
          },
          {
            id: 'students',
            label: '学生档案',
            icon: Users,
            content: <StudentProfileView teacherId={teacher.id} />
          },
          {
            id: 'schedule',
            label: '课程表',
            icon: Calendar,
            content: <ClassSchedule teacherId={teacher.id} />
          },
          {
            id: 'assignments',
            label: '作业管理',
            icon: BookOpen,
            content: (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    作业管理
                  </CardTitle>
                  <CardDescription>管理学生作业和评分</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>作业管理功能开发中...</p>
                  </div>
                </CardContent>
              </Card>
            )
          },
          {
            id: 'profile',
            label: '个人档案',
            icon: User,
            content: <TeacherProfile teacherId={teacher.id} />
          },
          {
            id: 'stats',
            label: '统计报告',
            icon: TrendingUp,
            content: <TeacherStats teacherId={teacher.id} />
          },
          {
            id: 'settings',
            label: '设置',
            icon: Settings,
            content: (
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
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>课程管理功能开发中...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* NFC卡片管理 - 教师权限 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      NFC卡片管理
                    </CardTitle>
                    <CardDescription>申请补办和管理学生卡片</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <h4 className="font-medium mb-2 text-blue-800">卡片申请</h4>
                        <p className="text-sm text-blue-600 mb-3">为学生申请NFC卡片补办</p>
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                          申请补办
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg bg-green-50">
                        <h4 className="font-medium mb-2 text-green-800">查看状态</h4>
                        <p className="text-sm text-green-600 mb-3">查看学生卡片状态和记录</p>
                        <Button variant="outline" size="sm" className="text-green-600 border-green-300">
                          查看记录
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 通知管理 - 教师权限 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      通知管理
                    </CardTitle>
                    <CardDescription>查看通知和发送班级消息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-purple-50">
                        <h4 className="font-medium mb-2 text-purple-800">我的通知</h4>
                        <p className="text-sm text-purple-600 mb-3">查看收到的通知消息</p>
                        <Button variant="outline" size="sm" className="text-purple-600 border-purple-300">
                          查看通知
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg bg-orange-50">
                        <h4 className="font-medium mb-2 text-orange-800">班级通知</h4>
                        <p className="text-sm text-orange-600 mb-3">发送班级内部通知</p>
                        <Button variant="outline" size="sm" className="text-orange-600 border-orange-300">
                          发送通知
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 积分管理 - 教师权限 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      积分管理
                    </CardTitle>
                    <CardDescription>管理学生积分和奖励</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-yellow-50">
                        <h4 className="font-medium mb-2 text-yellow-800">积分操作</h4>
                        <p className="text-sm text-yellow-600 mb-3">为学生添加或扣除积分</p>
                        <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-300">
                          积分操作
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg bg-indigo-50">
                        <h4 className="font-medium mb-2 text-indigo-800">积分排行</h4>
                        <p className="text-sm text-indigo-600 mb-3">查看班级积分排行榜</p>
                        <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-300">
                          查看排行
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 个人设置 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      个人设置
                    </CardTitle>
                    <CardDescription>管理您的个人信息和偏好</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">个人信息</h4>
                        <p className="text-sm text-gray-600 mb-3">姓名: {teacher.name || user?.name}</p>
                        <p className="text-sm text-gray-600 mb-3">邮箱: {teacher.email || user?.email}</p>
                        <Button variant="outline" size="sm">
                          编辑资料
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">通知偏好</h4>
                        <p className="text-sm text-gray-600 mb-3">管理您接收的通知类型</p>
                        <Button variant="outline" size="sm">
                          设置通知
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          }
        ]}
        defaultTab={activeTab}
        onTabChange={setActiveTab}
      />
    </PageLayout>
  )
}

