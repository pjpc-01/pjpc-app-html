"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
import StatsGrid from "@/components/ui/StatsGrid"
import {
  BarChart3,
  DollarSign,
  Settings,
  BookOpen,
  Shield,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Trophy,
  Star,
  Calendar,
  Clock,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Download,
  RefreshCw,
  Calculator,
  GraduationCap
} from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useFinancialStats } from "@/hooks/useFinancialStats"

interface ModernAdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function ModernAdminDashboard({ activeTab, setActiveTab }: ModernAdminDashboardProps) {
  const { user, userProfile } = useAuth()
  const { stats, loading: statsLoading } = useDashboardStats()
  const { stats: financialStats, loading: financialLoading } = useFinancialStats()

  // 模拟数据
  const mockStats = {
    totalStudents: 1247,
    totalTeachers: 23,
    totalRevenue: 125000,
    monthlyGrowth: 12.5,
    attendanceRate: 94.2,
    satisfactionScore: 4.8
  }

  const recentActivities = [
    { id: 1, type: 'student', action: '新学生注册', name: '张三', time: '2分钟前', status: 'success' },
    { id: 2, type: 'payment', action: '学费缴纳', name: '李四', amount: '¥2,500', time: '5分钟前', status: 'success' },
    { id: 3, type: 'attendance', action: '考勤打卡', name: '王五', time: '8分钟前', status: 'success' },
    { id: 4, type: 'alert', action: '系统提醒', name: '设备维护', time: '15分钟前', status: 'warning' },
    { id: 5, type: 'teacher', action: '教师登录', name: '赵老师', time: '20分钟前', status: 'success' }
  ]

  const quickActions = [
    { 
      title: '学生管理', 
      icon: Users, 
      color: 'from-blue-500 to-blue-600', 
      href: '/student-management',
      onClick: () => {
        window.location.href = '/student-management'
      }
    },
    { 
      title: '教师管理', 
      icon: Shield, 
      color: 'from-indigo-500 to-indigo-600', 
      href: '/teacher-management',
      onClick: () => {
        window.location.href = '/teacher-management'
      }
    },
    { 
      title: '财务管理', 
      icon: DollarSign, 
      color: 'from-green-500 to-emerald-600', 
      href: '/finance-management',
      onClick: () => {
        window.location.href = '/finance-management'
      }
    },
    { 
      title: '课程管理', 
      icon: BookOpen, 
      color: 'from-orange-500 to-red-500', 
      href: '/course-management',
      onClick: () => {
        window.location.href = '/course-management'
      }
    },
    { 
      title: '用户管理', 
      icon: Settings, 
      color: 'from-gray-500 to-slate-500', 
      href: '/user-management',
      onClick: () => {
        window.location.href = '/user-management'
      }
    },
    { 
      title: '考勤系统', 
      icon: Clock, 
      color: 'from-purple-500 to-purple-600', 
      href: '/unified-attendance',
      onClick: () => {
        window.location.href = '/unified-attendance'
      }
    },
    { 
      title: '积分管理', 
      icon: Star, 
      color: 'from-yellow-500 to-orange-600', 
      href: '/points-management',
      onClick: () => {
        window.location.href = '/points-management'
      }
    },
    { 
      title: '卡片管理', 
      icon: CreditCard, 
      color: 'from-teal-500 to-cyan-600', 
      href: '/card-management',
      onClick: () => {
        window.location.href = '/card-management'
      }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">欢迎回来，{userProfile?.name}</h2>
              <p className="text-blue-100 text-lg">今天是美好的一天，让我们开始工作吧！</p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-blue-100 text-sm">当前时间</p>
                <p className="text-2xl font-bold">{new Date().toLocaleTimeString('zh-CN')}</p>
                <p className="text-blue-100 text-sm">{new Date().toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">总学生数</p>
                <p className="text-3xl font-bold text-blue-900">{mockStats.totalStudents.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm">+5.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">月度收入</p>
                <p className="text-3xl font-bold text-green-900">¥{mockStats.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm">+{mockStats.monthlyGrowth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">出勤率</p>
                <p className="text-3xl font-bold text-purple-900">{mockStats.attendanceRate}%</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm">优秀</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">满意度</p>
                <p className="text-3xl font-bold text-orange-900">{mockStats.satisfactionScore}/5.0</p>
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-600 text-sm">很高</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20 mb-6">
          <TabsList className="grid w-full bg-transparent h-auto p-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">概览</span>
            </TabsTrigger>
            <TabsTrigger 
              value="finance" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">财务</span>
            </TabsTrigger>
            <TabsTrigger 
              value="education" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">教育</span>
            </TabsTrigger>
            <TabsTrigger 
              value="management" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Shield className="h-4 w-4" />
              <span className="font-medium">管理</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
              <span className="font-medium">设置</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总学生数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600">+12% 较上月</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">今日出勤</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600">94.2% 出勤率</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">本月收入</p>
                    <p className="text-2xl font-bold text-gray-900">RM {stats.monthlyRevenue?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600">+15% 较上月</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">活跃教师</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeTeachers}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">8 位教师</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  最近活动
                </CardTitle>
                <CardDescription>系统最新动态和用户操作记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.status === 'success' ? 'bg-green-100' : 
                        activity.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {activity.type === 'student' && <Users className="h-5 w-5 text-green-600" />}
                        {activity.type === 'payment' && <DollarSign className="h-5 w-5 text-green-600" />}
                        {activity.type === 'attendance' && <Clock className="h-5 w-5 text-green-600" />}
                        {activity.type === 'alert' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {activity.type === 'teacher' && <Shield className="h-5 w-5 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.name} {activity.amount && `- ${activity.amount}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  快速操作
                </CardTitle>
                <CardDescription>常用功能快速访问</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start p-4 h-auto hover:bg-gray-50"
                      onClick={action.onClick}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mr-3`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{action.title}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>月度收入趋势</CardTitle>
                <CardDescription>过去6个月的收入变化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">今日出勤</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-blue-800">156</div>
                      <div className="text-xs text-blue-500">+12% 较昨日</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-600">出勤率</span>
                        <Activity className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-800">94.2%</div>
                      <div className="text-xs text-green-500">+2.1% 较昨日</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-600">本周统计</span>
                      <Calendar className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-purple-800">1,234</div>
                        <div className="text-xs text-purple-500">总出勤</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-800">89</div>
                        <div className="text-xs text-purple-500">缺勤</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-800">93.2%</div>
                        <div className="text-xs text-purple-500">平均出勤率</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学生分布</CardTitle>
                <CardDescription>各年级学生人数统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-600">活跃学生</span>
                        <Users className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-800">234</div>
                      <div className="text-xs text-green-500">+8% 较上周</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">新注册</span>
                        <Plus className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-blue-800">12</div>
                      <div className="text-xs text-blue-500">本周新增</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-emerald-600">学生分布</span>
                      <Globe className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-800">156</div>
                        <div className="text-xs text-emerald-500">标准1</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-emerald-800">78</div>
                        <div className="text-xs text-emerald-500">标准2</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-emerald-800">45</div>
                        <div className="text-xs text-emerald-500">标准3</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-6">
          {/* 财务统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">本月收入</p>
                    <p className="text-2xl font-bold text-gray-900">RM {financialStats.monthlyRevenue?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600">+15% 较上月</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">待收费用</p>
                    <p className="text-2xl font-bold text-gray-900">RM 8,900</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-yellow-600">23 个家庭</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总资产</p>
                    <p className="text-2xl font-bold text-gray-900">RM 125,000</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-blue-600">稳定增长</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">利润率</p>
                    <p className="text-2xl font-bold text-gray-900">68.5%</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-purple-600">健康水平</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 收入趋势 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  收入趋势
                </CardTitle>
                <CardDescription>过去6个月的收入变化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">今日出勤</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-blue-800">156</div>
                      <div className="text-xs text-blue-500">+12% 较昨日</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-600">出勤率</span>
                        <Activity className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-800">94.2%</div>
                      <div className="text-xs text-green-500">+2.1% 较昨日</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-600">本周统计</span>
                      <Calendar className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-purple-800">1,234</div>
                        <div className="text-xs text-purple-500">总出勤</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-800">89</div>
                        <div className="text-xs text-purple-500">缺勤</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-800">93.2%</div>
                        <div className="text-xs text-purple-500">平均出勤率</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 费用分类 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  费用分类
                </CardTitle>
                <CardDescription>各类费用的详细统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">学费收入</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">RM 2,400</div>
                      <div className="text-xs text-gray-500">60%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">杂费收入</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">RM 1,200</div>
                      <div className="text-xs text-gray-500">30%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">其他收入</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">RM 400</div>
                      <div className="text-xs text-gray-500">10%</div>
                    </div>
                  </div>
                </div>
                
                {/* 财务操作按钮 */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/finance-management'}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      财务管理
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/points-management'}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      积分管理
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/card-management'}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      卡片管理
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/resource-library'}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      资源库
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6">
          {/* 教育统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">活跃课程</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-orange-600">+2 新增课程</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">教师数量</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-purple-600">全职教师</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">班级数量</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-blue-600">活跃班级</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">平均成绩</p>
                    <p className="text-2xl font-bold text-gray-900">85.6</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600">优秀水平</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 课程分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  课程分布
                </CardTitle>
                <CardDescription>各类课程的详细统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">数学课程</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">6 门</div>
                      <div className="text-xs text-gray-500">50%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">英语课程</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">4 门</div>
                      <div className="text-xs text-gray-500">33%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">科学课程</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">2 门</div>
                      <div className="text-xs text-gray-500">17%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 教师绩效 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  教师绩效
                </CardTitle>
                <CardDescription>教师表现和评分统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">A</span>
                      </div>
                      <div>
                        <div className="font-medium">张老师</div>
                        <div className="text-xs text-gray-500">数学</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">4.9</div>
                      <div className="text-xs text-gray-500">评分</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">B</span>
                      </div>
                      <div>
                        <div className="font-medium">李老师</div>
                        <div className="text-xs text-gray-500">英语</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">4.7</div>
                      <div className="text-xs text-gray-500">评分</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">C</span>
                      </div>
                      <div>
                        <div className="font-medium">王老师</div>
                        <div className="text-xs text-gray-500">科学</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">4.8</div>
                      <div className="text-xs text-gray-500">评分</div>
                    </div>
                  </div>
                </div>
                
                {/* 教育操作按钮 */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/teacher-management'}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      教师管理
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/teacher-checkin'}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      教师考勤
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/schedule-management'}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      排班管理
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/teacher-workspace'}
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      教师工作台
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系统管理</CardTitle>
              <CardDescription>用户权限和系统设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-600">系统状态</span>
                      <Shield className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-purple-800">正常</div>
                    <div className="text-xs text-purple-500">99.9% 正常运行</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-600">安全等级</span>
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-800">高</div>
                    <div className="text-xs text-blue-500">无安全威胁</div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-indigo-600">管理统计</span>
                    <Settings className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-indigo-800">156</div>
                      <div className="text-xs text-indigo-500">活跃用户</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-indigo-800">23</div>
                      <div className="text-xs text-indigo-500">待审核</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-indigo-800">8</div>
                      <div className="text-xs text-indigo-500">管理员</div>
                    </div>
                  </div>
                </div>
                
                {/* 管理操作按钮 */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/student-management'}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      学生管理
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/unified-attendance'}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      考勤系统
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/points-management'}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      积分系统
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/card-management'}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      卡片系统
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系统设置</CardTitle>
              <CardDescription>系统配置和偏好设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">系统版本</span>
                      <Settings className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">v2.1.0</div>
                    <div className="text-xs text-gray-500">最新版本</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-600">备份状态</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-800">正常</div>
                    <div className="text-xs text-green-500">每日自动备份</div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">系统信息</span>
                    <Bell className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-slate-800">24/7</div>
                      <div className="text-xs text-slate-500">运行时间</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-800">99.9%</div>
                      <div className="text-xs text-slate-500">可用性</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-800">256GB</div>
                      <div className="text-xs text-slate-500">存储空间</div>
                    </div>
                  </div>
                </div>
                
                {/* 设置操作按钮 */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      系统配置
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      备份数据
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      重启服务
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Bell className="h-4 w-4 mr-2" />
                      通知设置
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
