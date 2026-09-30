"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import TeacherDashboard from "@/components/teacher/TeacherDashboard"
import StudentProfileView from "@/components/teacher/StudentProfileView"
import TeacherStats from "@/components/teacher/TeacherStats"
import ClassSchedule from "@/components/teacher/ClassSchedule"
import TeacherProfile from "@/components/teacher/TeacherProfile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
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
  User,
  FileEdit,
  ExternalLink,
  ClipboardCheck,
  Info,
  Clock,
  ChevronLeft,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { usePendingGradingCount } from "@/hooks/useHomework"

function SettingsPanel({ teacher, user, t }: { teacher: any; user: any; t: (k: string) => string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 课程管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("课程管理")}
          </CardTitle>
          <CardDescription>{t("管理您的课程和班级")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>{t("课程管理功能开发中...")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFC卡片管理 - 教师权限 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("NFC卡片管理")}
          </CardTitle>
          <CardDescription>{t("申请补办和管理学生卡片")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium mb-2 text-blue-800">{t("卡片申请")}</h4>
              <p className="text-sm text-blue-600 mb-3">{t("为学生申请NFC卡片补办")}</p>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                {t("申请补办")}
              </Button>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <h4 className="font-medium mb-2 text-green-800">{t("查看状态")}</h4>
              <p className="text-sm text-green-600 mb-3">{t("查看学生卡片状态和记录")}</p>
              <Button variant="outline" size="sm" className="text-green-600 border-green-300">
                {t("查看记录")}
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
            {t("通知管理")}
          </CardTitle>
          <CardDescription>{t("查看通知和发送班级消息")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-purple-50">
              <h4 className="font-medium mb-2 text-purple-800">{t("我的通知")}</h4>
              <p className="text-sm text-purple-600 mb-3">{t("查看收到的通知消息")}</p>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-300">
                {t("查看通知")}
              </Button>
            </div>
            <div className="p-4 border rounded-lg bg-orange-50">
              <h4 className="font-medium mb-2 text-orange-800">{t("班级通知")}</h4>
              <p className="text-sm text-orange-600 mb-3">{t("发送班级内部通知")}</p>
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-300">
                {t("发送通知")}
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
            {t("积分管理")}
          </CardTitle>
          <CardDescription>{t("管理学生积分和奖励")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-yellow-50">
              <h4 className="font-medium mb-2 text-yellow-800">{t('teacher.points')}</h4>
              <p className="text-sm text-yellow-600 mb-3">{t("为学生添加或扣除积分")}</p>
              <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-300">
                {t("积分操作")}
              </Button>
            </div>
            <div className="p-4 border rounded-lg bg-indigo-50">
              <h4 className="font-medium mb-2 text-indigo-800">{t('teacher.points_leaderboard')}</h4>
              <p className="text-sm text-indigo-600 mb-3">{t("查看班级积分排行榜")}</p>
              <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-300">
                {t("查看排行")}
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
            {t("个人设置")}
          </CardTitle>
          <CardDescription>{t("管理您的个人信息和偏好")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">{t("个人信息")}</h4>
              <p className="text-sm text-gray-600 mb-3">{t("姓名:")} {teacher.name || user?.name}</p>
              <p className="text-sm text-gray-600 mb-3">{t("邮箱:")} {teacher.email || user?.email}</p>
              <Button variant="outline" size="sm">
                {t("编辑资料")}
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">{t("通知偏好")}</h4>
              <p className="text-sm text-gray-600 mb-3">{t("管理您接收的通知类型")}</p>
              <Button variant="outline" size="sm">
                {t("设置通知")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AttendanceAndPoints({ teacherId, teacherName, t }: { teacherId: string; teacherName: string; t: (k: string) => string }) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const month = new Date().toISOString().slice(0, 7)
        const res = await fetch(
          `/api/attendance/person-calendar?person_id=${encodeURIComponent(teacherId)}&person_type=teacher&month=${month}`
        )
        const data = await res.json()
        if (data.success && data.calendar) {
          setRecords(Object.entries(data.calendar))
        } else if (data.error) {
          setError(data.error)
        }
      } catch (e: any) {
        setError(e?.message || "加载失败")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [teacherId])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 我的排班/打卡记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("我的排班/打卡记录")}
          </CardTitle>
          <CardDescription>{t("查看您本月的签到与签退记录")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{t("本月暂无打卡记录")}</p>
            </div>
          ) : (
            <div className="space-y-1 overflow-x-auto">
              {records.map(([date, info]: any) => (
                <div key={date} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg min-w-[320px]">
                  <span className="text-sm text-gray-600">{date}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <Badge variant="outline" className="text-green-600">{t("进")} {info.check_ins?.length || 0}</Badge>
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <Badge variant="outline" className="text-blue-600">{t("出")} {info.check_outs?.length || 0}</Badge>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 我的积分 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {t("我的积分")}
          </CardTitle>
          <CardDescription>{t("查看您的积分与奖励情况")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">{t("暂无数据")}</p>
            <p className="text-sm text-gray-400 mt-1">{t("教师积分功能暂未开放")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TeacherWorkspace() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { teacher, loading: teacherLoading, error: teacherError } = useCurrentTeacher()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [menuItem, setMenuItem] = useState<string | null>(null)
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

  useEffect(() => {
    if (menuItem) {
      setActiveTab("menu")
    }
  }, [menuItem])

  const loadNotifications = async () => {
    try {
      // Fetch real pending grading count
      try {
        const subRes = await fetch(
          "/api/pocketbase-proxy/api/collections/homework_submissions/records?filter=status%3D%27submitted%27&perPage=1"
        )
        const subData = await subRes.json()
        const pendingCount = subData?.totalItems || 0

        if (pendingCount > 0) {
          setNotifications([{
            id: "pending-grading",
            title: "待批改作业",
            message: `有 ${pendingCount} 份作业等待批改`,
            time: "现在",
            type: "assignment",
            read: false
          }])
          return
        }
      } catch {}

      // 没有待批改作业 → 无通知（不显示任何假数据）
      setNotifications([])
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
          <p className="text-gray-600">{t("加载教师工作台...")}</p>
            </div>
      </div>
    )
  }

  if (teacherError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {t("加载教师信息失败:")} {teacherError}
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
            {t("未找到教师信息，请检查您的账户设置。")}
          </AlertDescription>
        </Alert>
                  </div>
    )
  }

  const menuContent = (() => {
    if (menuItem === 'profile') {
      return <TeacherProfile teacherId={teacher.id} />
    }
    if (menuItem === 'stats') {
      return <TeacherStats teacherId={teacher.id} />
    }
    if (menuItem === 'settings') {
      return <SettingsPanel teacher={teacher} user={user} t={t} />
    }
    return null
  })()

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

      {/* 用户信息 + 更多下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center space-x-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8">
              <AvatarImage src={teacher.avatar || user?.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getInitials(teacher.name || user?.name || '')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{teacher.name || user?.name}</p>
              <p className="text-xs text-gray-500">{teacher.email || user?.email}</p>
            </div>
            <Info className="hidden md:block h-4 w-4 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{teacher.name || user?.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMenuItem('profile')}>
            <User className="h-4 w-4 mr-2" /> {t("个人档案")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMenuItem('stats')}>
            <TrendingUp className="h-4 w-4 mr-2" /> {t("统计报告")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMenuItem('settings')}>
            <Settings className="h-4 w-4 mr-2" /> {t("设置")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> {t("登出")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <PageLayout
      title={t("教师工作台")}
      description={`欢迎回来，${teacher.name || user?.name}`}
      userRole="teacher"
      status="系统正常"
      background="bg-gray-50"
      actions={teacherActions}
    >
      {menuItem && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => setMenuItem(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {t("返回工作台")}
          </Button>
        </div>
      )}

      {menuItem ? (
        <div className="space-y-6">
          {menuContent}
        </div>
      ) : (
        <TabbedPage
          tabs={[
            {
              id: 'dashboard',
              label: t("今日"),
              icon: BarChart3,
              content: <TeacherDashboard teacherId={teacher.id} />
            },
            {
              id: 'students',
              label: t("我的学生"),
              icon: Users,
              content: <StudentProfileView teacherId={teacher.id} />
            },
            {
              id: 'courses',
              label: t("我的课程"),
              icon: Calendar,
              content: (
                <div className="space-y-6">
                  <ClassSchedule teacherId={teacher.id} />
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileEdit className="h-5 w-5" />
                        {t("作业管理")}
                      </CardTitle>
                      <CardDescription>{t("布置、查看和批改学生作业")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open('/homework', '_blank')}>
                          <CardContent className="pt-6 text-center">
                            <FileEdit className="h-10 w-10 mx-auto mb-3 text-blue-600" />
                            <h3 className="font-medium">{t("作业总览")}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{t("查看所有作业和提交状态")}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open('/homework/new', '_blank')}>
                          <CardContent className="pt-6 text-center">
                            <BookOpen className="h-10 w-10 mx-auto mb-3 text-green-600" />
                            <h3 className="font-medium">{t("布置新作业")}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{t("为学生布置新的作业和练习")}</p>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="mt-4 text-center">
                        <Button variant="outline" onClick={() => window.open('/homework', '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t("打开完整作业管理")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            },
            {
              id: 'attendance',
              label: t("我的考勤与积分"),
              icon: ClipboardCheck,
              content: <AttendanceAndPoints teacherId={teacher.id} teacherName={teacher.name || ''} t={t} />
            },
          ]}
          defaultTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </PageLayout>
  )
}