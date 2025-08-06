"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import UserManagement from "./user-management"
import StudentManagement from "./student-management-page"
import CourseManagement from "./course-management"
import AssignmentManagement from "./assignment-management"
import ExamSystem from "./exam-system"
import LearningAnalytics from "./learning-analytics"
import FinanceManagement from "./finance-management-page"
import SecurityMonitoring from "./security-monitoring"
import AttendanceSystem from "./attendance-system"
import UserApproval from "@/components/admin/user-approval"
import {
  Users,
  GraduationCap,
  DollarSign,
  UserCheck,
  Clock,
  Settings,
  BookOpen,
  BarChart3,
  Shield,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  Database,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/enhanced-auth-context"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function AdminDashboard({ activeTab, setActiveTab }: AdminDashboardProps) {
  const { userProfile } = useAuth()
  const { stats, loading, error, refetch } = useDashboardStats()

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总用户数</p>
                      {loading ? (
                        <div className="flex items-center mt-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats.totalUsers}</p>
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
                      {loading ? (
                        <div className="flex items-center mt-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats.totalStudents}</p>
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
                      {loading ? (
                        <div className="flex items-center mt-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">¥{stats.monthlyRevenue.toLocaleString()}</p>
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
                      {loading ? (
                        <div className="flex items-center mt-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats.todayAttendance}</p>
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
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>加载系统状态...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">系统健康度</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {stats.systemHealth}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">活跃教师</span>
                        <span className="font-medium">{stats.activeTeachers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">注册家长</span>
                        <span className="font-medium">{stats.totalParents}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">待审核用户</span>
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          {stats.pendingApprovals}
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
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>加载活动数据...</span>
                    </div>
                  ) : stats.recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentActivities.map((activity) => (
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
                  {userProfile?.role === "admin" && (
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col gap-2 bg-transparent hover:bg-purple-50"
                      onClick={() => setActiveTab("finance")}
                    >
                      <DollarSign className="h-6 w-6 text-purple-600" />
                      <span className="text-sm">财务管理</span>
                    </Button>
                  )}
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

      case "settings":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("user-approval")}>
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">用户审核</h3>
                  <p className="text-sm text-gray-600 mb-3">审核新用户注册申请</p>
                  {!loading && stats.pendingApprovals > 0 && (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      {stats.pendingApprovals} 待处理
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("users")}>
                  <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">用户管理</h3>
                  <p className="text-sm text-gray-600 mb-3">管理所有系统用户权限</p>
                  {!loading && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.totalUsers} 用户
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("security")}>
                  <Shield className="h-12 w-12 mx-auto mb-4 text-red-600" />
                  <h3 className="font-semibold mb-2">安全监控</h3>
                  <p className="text-sm text-gray-600 mb-3">系统安全和访问监控</p>
                  {!loading && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.systemHealth}% 健康
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
                <CardContent className="p-6 text-center" onClick={() => window.location.href = '/data-import'}>
                  <Database className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">数据导入</h3>
                  <p className="text-sm text-gray-600 mb-3">从Google Sheets导入学生数据</p>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    一次性设置
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "finance":
        return <FinanceManagement />

      case "education":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("students")}>
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">学生管理</h3>
                  <p className="text-sm text-gray-600 mb-3">管理学生信息和档案</p>
                  {!loading && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {stats.totalStudents} 学生
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("attendance")}>
                  <Clock className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">出勤管理</h3>
                  <p className="text-sm text-gray-600 mb-3">门禁系统和出勤记录</p>
                  {!loading && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.todayAttendance} 今日出勤
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

      // Individual feature pages
      case "user-approval":
        return <UserApproval />
      case "users":
        return <UserManagement />
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
      default:
        return <div className="text-center py-12 text-gray-500">请选择一个功能模块</div>
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full h-12 ${
          userProfile?.role === "admin" ? "grid-cols-4" : "grid-cols-3"
        }`}>
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          {userProfile?.role === "admin" && (
            <TabsTrigger value="finance" className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              财务
            </TabsTrigger>
          )}
          <TabsTrigger value="education" className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            教育
          </TabsTrigger>
          {userProfile?.role === "admin" && (
            <TabsTrigger value="settings" className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              设定
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
