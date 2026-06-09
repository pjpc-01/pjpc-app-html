"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  DollarSign,
  Settings,
  BookOpen,
  Shield,
  Users,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowUpRight
} from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useFinancialStats } from "@/hooks/useFinancialStats"
import { useRouter } from "next/navigation"
import { useRecentActivities } from "@/hooks/useRecentActivities"

interface ModernAdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function ModernAdminDashboard({ activeTab, setActiveTab }: ModernAdminDashboardProps) {
  const { userProfile } = useAuth()
  const router = useRouter()
  const { stats, loading: statsLoading } = useDashboardStats()
  const { stats: financialStats, loading: financialLoading } = useFinancialStats()
  const { activities, loading: activitiesLoading } = useRecentActivities()

  const quickActions = [
    { 
      title: '学生管理', 
      icon: Users, 
      iconColor: 'text-indigo-600', 
      bgColor: 'bg-indigo-100', 
      path: '/student-management'
    },
    { 
      title: '财务管理', 
      icon: DollarSign, 
      iconColor: 'text-emerald-600', 
      bgColor: 'bg-emerald-100', 
      path: '/finance-management'
    },
    { 
      title: '课程管理', 
      icon: BookOpen, 
      iconColor: 'text-blue-600', 
      bgColor: 'bg-blue-100', 
      path: '/course-management'
    },
    { 
      title: '考勤系统', 
      icon: Clock, 
      iconColor: 'text-amber-600', 
      bgColor: 'bg-amber-100', 
      path: '/unified-attendance'
    },
    { 
      title: '系统设置', 
      icon: Settings, 
      iconColor: 'text-slate-600', 
      bgColor: 'bg-slate-100', 
      path: '/user-management'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Vibrant Gradient Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">欢迎回来，{userProfile?.name || '管理员'}</h2>
            <p className="text-indigo-100 text-lg">系统运行状态正常，您可以开始管理中心事务。</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-indigo-100 text-sm">当前系统时间</p>
            <p className="text-2xl font-mono font-bold">{new Date().toLocaleTimeString('zh-CN')}</p>
            <p className="text-indigo-100 text-sm">{new Date().toLocaleDateString('zh-CN')}</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
      </div>

      {/* Colorful Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-indigo-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">总学生数</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.totalStudents || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 text-sm font-medium">+12% 较上月</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">本月收入</p>
                <p className="text-3xl font-bold text-slate-900">RM {financialStats?.monthlyRevenue?.toLocaleString() || '0'}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 text-sm font-medium">+15% 较上月</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">今日出勤</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.todayAttendance || 0}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 text-sm font-medium">94.2% 出勤率</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">活跃教师</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.activeTeachers || 0}</p>
                <div className="flex items-center mt-2">
                  <span className="text-slate-500 text-sm">8 位在职教师</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Shield className="h-6 w-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-indigo-600" />
                最近活动
              </CardTitle>
              <CardDescription>系统最新动态和用户操作记录</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
              查看全部 <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activitiesLoading ? (
                <div className="flex items-center justify-center p-8 text-slate-400">加载中...</div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-slate-400">暂无最近活动</div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      activity.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                      activity.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {activity.type === 'student' && <Users className="h-5 w-5" />}
                      {activity.type === 'payment' && <DollarSign className="h-5 w-5" />}
                      {activity.type === 'attendance' && <Clock className="h-5 w-5" />}
                      {activity.type === 'alert' && <AlertTriangle className="h-5 w-5" />}
                      {activity.type === 'teacher' && <Shield className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{activity.action}</p>
                      <p className="text-sm text-slate-500">{activity.name} {activity.amount && ` - ${activity.amount}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-indigo-600" />
              快速操作
            </CardTitle>
            <CardDescription>常用功能快速访问</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto hover:bg-slate-50 transition-all group"
                  onClick={() => router.push(action.path)}
                >
                  <div className={`w-10 h-10 rounded-lg ${action.bgColor} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-700 group-hover:text-indigo-600">{action.title}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
