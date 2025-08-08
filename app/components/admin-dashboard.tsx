"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Users,
  DollarSign,
  Settings,
  UserCheck,
  GraduationCap,
  Clock,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Activity,
  Shield,
  FileText,
  Calendar,
  RefreshCw,
  User,
} from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { pb } from "@/lib/pocketbase"
// import { useDashboardStats } from "@/hooks/useDashboardStats"
// import { useFinancialStats } from "@/hooks/useFinancialStats"
import FinanceManagement from "./finance-management-page"
        import UserApproval from "@/components/admin/user-approval"
        import StudentManagement from "./student-management-page"
        import GoogleCSVImport from "./data-import/GoogleCSVImport"
        // import TeacherManagement from "./teacher-management"
import PrimaryStudentManagement from "./student/PrimaryStudentManagement"
import SecondaryStudentManagement from "./student/SecondaryStudentManagement"
import AttendanceSystem from "./attendance-system"
import SecurityMonitoring from "./security-monitoring"
import CommunicationSystem from "./communication-system"
import ExamSystem from "./exam-system"
import AssignmentManagement from "./assignment-management"
import CourseManagement from "./course-management"
import ResourceLibrary from "./resource-library"
import ScheduleManagement from "./schedule-management"
import LearningAnalytics from "./learning-analytics"
import EducationDropdown, { EducationDataType } from "./education-dropdown"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function AdminDashboard({ activeTab, setActiveTab }: AdminDashboardProps) {
  const { user, userProfile, loading: authLoading, error: authError } = useAuth()
  // const { stats, loading: statsLoading, error: statsError } = useDashboardStats()
  // const { stats: financialStats, loading: financialLoading, error: financialError } = useFinancialStats()
  const [educationDataType, setEducationDataType] = useState<EducationDataType>('primary')
  
  // 临时统计数据（迁移期间使用）
  const stats = {
    totalUsers: 0,
    totalStudents: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    todayAttendance: 0,
    activeTeachers: 0,
    totalParents: 0,
    systemHealth: 100,
    recentActivities: []
  }
  const statsLoading = false
  const statsError = null
  const financialStats = {
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    revenueGrowth: 0,
    averagePayment: 0,
    paymentMethods: {},
    revenueByMonth: []
  }
  const financialLoading = false
  const financialError = null

  // 获取教育数据统计
  const getEducationStats = useCallback(() => {
    if (!stats) return { primaryCount: 0, secondaryCount: 0, teachersCount: 0 }
    
    return {
      primaryCount: stats.totalStudents || 0,
      secondaryCount: stats.totalStudents || 0,
      teachersCount: stats.activeTeachers || 0
    }
  }, [stats])

  const educationStats = getEducationStats()

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* 错误提示 */}
            {statsError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{statsError}</AlertDescription>
              </Alert>
            )}

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总用户数</p>
                      {statsLoading ? (
                        <div className="flex items-center mt-2">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                          <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            实时数据
                          </p>
                        </>
                      )}
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">学生总数</p>
                      {statsLoading ? (
                        <div className="flex items-center mt-2">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                          <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            实时数据
                          </p>
                        </>
                      )}
                    </div>
                    <GraduationCap className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">月收入</p>
                      {statsLoading ? (
                        <div className="flex items-center mt-2">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">¥{(stats?.monthlyRevenue || 0).toLocaleString()}</p>
                          <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            实时数据
                          </p>
                        </>
                      )}
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">今日出勤</p>
                      {statsLoading ? (
                        <div className="flex items-center mt-2">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats?.todayAttendance || 0}</p>
                          <p className="text-xs text-blue-600 flex items-center mt-1">
                            <Activity className="h-3 w-3 mr-1" />
                            实时数据
                          </p>
                        </>
                      )}
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status and Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    系统状态
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>加载系统状态...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">系统健康度</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {stats?.systemHealth || 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">活跃教师</span>
                        <span className="font-medium">{stats?.activeTeachers || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">注册家长</span>
                        <span className="font-medium">{stats?.totalParents || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">待审核用户</span>
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          {stats?.pendingApprovals || 0}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    最近活动
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>加载活动数据...</span>
                    </div>
                  ) : stats?.recentActivities?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentActivities.map((activity: any) => (
                        <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <div className="text-xs text-gray-500 w-12">{activity.time}</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{activity.action}</div>
                            <div className="text-xs text-gray-500">{activity.user}</div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              activity.type === "user"
                                ? "border-blue-200 text-blue-700"
                                : activity.type === "attendance"
                                  ? "border-green-200 text-green-700"
                                  : activity.type === "assignment"
                                    ? "border-orange-200 text-orange-700"
                                    : activity.type === "payment"
                                      ? "border-purple-200 text-purple-700"
                                      : activity.type === "login"
                                        ? "border-indigo-200 text-indigo-700"
                                        : "border-gray-200 text-gray-700"
                            }
                          >
                            {activity.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>暂无活动记录</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-blue-50"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-6 w-6 text-blue-600" />
                    <span className="text-sm">系统设定</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-purple-50"
                    onClick={() => setActiveTab("finance")}
                  >
                    <DollarSign className="h-6 w-6 text-purple-600" />
                    <span className="text-sm">财务管理</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-green-50"
                    onClick={() => setActiveTab("education")}
                  >
                    <BookOpen className="h-6 w-6 text-green-600" />
                    <span className="text-sm">教育管理</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-orange-50"
                    onClick={() => setActiveTab("user-approval")}
                  >
                    <UserCheck className="h-6 w-6 text-orange-600" />
                    <span className="text-sm">用户审核</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "finance":
        return <FinanceManagement />

      case "education":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">教育管理</h2>
                <p className="text-gray-600">管理学生、课程和教学活动</p>
              </div>
              
              {/* 教育数据类型选择器 */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">数据类型:</span>
                <EducationDropdown
                  selectedType={educationDataType}
                  onTypeChange={setEducationDataType}
                  showCounts={true}
                  primaryCount={educationStats.primaryCount}
                  secondaryCount={educationStats.secondaryCount}
                  teachersCount={educationStats.teachersCount}
                />
              </div>
            </div>

            {/* 根据选择的数据类型显示不同内容 */}
            {educationDataType === 'primary' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      小学生管理
                    </CardTitle>
                    <CardDescription>管理小学学生信息和学习进度</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PrimaryStudentManagement />
                  </CardContent>
                </Card>
              </div>
            )}

            {educationDataType === 'secondary' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      中学生管理
                    </CardTitle>
                    <CardDescription>管理中学学生信息和学习进度</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SecondaryStudentManagement />
                  </CardContent>
                </Card>
              </div>
            )}

            {educationDataType === 'teachers' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      教师管理
                    </CardTitle>
                    <CardDescription>管理教师信息和教学安排</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-purple-700 font-medium">✅ 正在加载教师管理界面...</p>
                    </div>
                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-purple-700 font-medium">✅ 教师管理功能正在开发中...</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 其他教育功能 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("attendance")}>
                  <Clock className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">出勤管理</h3>
                  <p className="text-sm text-gray-600 mb-3">门禁系统和出勤记录</p>
                  {!statsLoading && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats?.todayAttendance || 0} 今日出勤
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("courses")}>
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">课程管理</h3>
                  <p className="text-sm text-gray-600 mb-3">课程设置和教学安排</p>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    活跃课程
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("assignments")}>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="font-semibold mb-2">作业管理</h3>
                  <p className="text-sm text-gray-600 mb-3">作业布置和批改系统</p>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    作业系统
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("exams")}>
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-red-600" />
                  <h3 className="font-semibold mb-2">考试系统</h3>
                  <p className="text-sm text-gray-600 mb-3">考试安排和成绩管理</p>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    考试管理
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("analytics")}>
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                  <h3 className="font-semibold mb-2">学习分析</h3>
                  <p className="text-sm text-gray-600 mb-3">学习数据和报告分析</p>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                    数据分析
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">系统设定</h2>
                <p className="text-gray-600">系统配置和安全设置</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("user-approval")}>
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">用户审核</h3>
                  <p className="text-sm text-gray-600 mb-3">新用户注册审核</p>
                  {!statsLoading && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {stats?.pendingApprovals || 0} 待审核
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("security")}>
                  <Shield className="h-12 w-12 mx-auto mb-4 text-red-600" />
                  <h3 className="font-semibold mb-2">安全监控</h3>
                  <p className="text-sm text-gray-600 mb-3">系统安全和访问控制</p>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    安全系统
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("google-csv-import")}>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">Google CSV导入</h3>
                  <p className="text-sm text-gray-600 mb-3">从Google Sheets导入学生和教师数据</p>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    导入功能
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("system-settings")}>
                  <Settings className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">系统设置</h3>
                  <p className="text-sm text-gray-600 mb-3">系统配置和参数设置</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    系统配置
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("backup-restore")}>
                  <Activity className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="font-semibold mb-2">备份恢复</h3>
                  <p className="text-sm text-gray-600 mb-3">数据备份和恢复功能</p>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    数据管理
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      // Individual feature pages
              case "user-approval":
        return (
          <div className="space-y-6">
            <UserApproval />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  测试功能
                </CardTitle>
                <CardDescription>创建测试用户以验证审核功能</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={async () => {
                    try {
                      const testUser = {
                        email: `test${Date.now()}@example.com`,
                        password: 'test123456',
                        passwordConfirm: 'test123456',
                        name: `测试用户${Date.now()}`,
                        role: 'teacher',
                        status: 'pending'
                      }
                      
                      await pb.collection('users').create(testUser)
                      alert('测试用户创建成功！请刷新用户审核页面查看。')
                    } catch (err) {
                      alert('创建测试用户失败：' + (err instanceof Error ? err.message : '未知错误'))
                    }
                  }}
                  variant="outline"
                >
                  创建测试用户
                </Button>
              </CardContent>
            </Card>
          </div>
        )
              case "users":
          return (
            <div className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">用户管理</h2>
                <p className="text-gray-600">此功能正在迁移到PocketBase，暂时不可用</p>
              </div>
            </div>
          )
      case "security":
        return <SecurityMonitoring />
      case "students":
        return <StudentManagement />
      case "attendance":
        return <AttendanceSystem />
      case "courses":
        return <CourseManagement />
      case "assignments":
        return <AssignmentManagement />
      case "exams":
        return <ExamSystem />
      case "analytics":
        return <LearningAnalytics />
      case "google-csv-import":
        return <GoogleCSVImport />
      case "system-settings":
        return (
          <div className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">系统设置</h2>
              <p className="text-gray-600">系统配置功能正在开发中</p>
            </div>
          </div>
        )
      case "backup-restore":
        return (
          <div className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">备份恢复</h2>
              <p className="text-gray-600">数据备份和恢复功能正在开发中</p>
            </div>
          </div>
        )
      default:
        return <div className="text-center py-12 text-gray-500">请选择一个功能模块</div>
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            财务
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            教育
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            设定
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
