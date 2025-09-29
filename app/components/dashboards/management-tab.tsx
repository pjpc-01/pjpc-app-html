"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Shield,
  CreditCard,
  Smartphone,
  Activity,
  BarChart3,
  Settings,
  ArrowRight,
  UserCheck,
  UserX,
  Clock,
  Database,
  Globe,
  Trophy,
  Star,
  RefreshCw,
  Monitor,
  Wifi,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Server,
  HardDrive,
  Cpu,
  Network,
  Calendar,
} from "lucide-react"
import Link from "next/link"

interface ManagementTabProps {
  stats: any
  statsLoading: boolean
  setActiveTab: (tab: string) => void
}

export default function ManagementTab({ stats, statsLoading, setActiveTab }: ManagementTabProps) {
  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理中心</h1>
        <p className="text-gray-600">统一管理安亲班各项业务功能</p>
      </div>

      {/* 加载状态 */}
      {statsLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>加载系统数据中...</span>
        </div>
      )}

      {/* 系统状态概览 */}
      {!statsLoading && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
            <Monitor className="h-6 w-6 text-blue-600" />
            系统状态概览
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 系统健康状态 */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">系统健康</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">正常</div>
                <p className="text-xs text-gray-500 mt-1">
                  所有服务运行正常
                </p>
              </CardContent>
            </Card>

            {/* 数据库状态 */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">数据库</CardTitle>
                <Database className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">在线</div>
                <p className="text-xs text-gray-500 mt-1">
                  连接稳定，响应快速
                </p>
              </CardContent>
            </Card>

            {/* 网络状态 */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">网络连接</CardTitle>
                <Network className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">良好</div>
                <p className="text-xs text-gray-500 mt-1">
                  延迟: 12ms
                </p>
              </CardContent>
            </Card>

            {/* 存储状态 */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">存储空间</CardTitle>
                <HardDrive className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">充足</div>
                <p className="text-xs text-gray-500 mt-1">
                  使用率: 45%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 数据统计概览 */}
      {!statsLoading && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-600" />
            数据统计概览
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">总学生数</p>
                    <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
                    <p className="text-blue-200 text-xs">注册学生</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">总教师数</p>
                    <p className="text-3xl font-bold">{stats?.totalTeachers || 0}</p>
                    <p className="text-green-200 text-xs">在职教师</p>
                  </div>
                  <UserCheck className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">今日出勤</p>
                    <p className="text-3xl font-bold">{stats?.todayPresent || 0}</p>
                    <p className="text-purple-200 text-xs">出勤人数</p>
                  </div>
                  <Activity className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">出勤率</p>
                    <p className="text-3xl font-bold">{stats?.attendanceRate || 0}%</p>
                    <p className="text-orange-200 text-xs">今日统计</p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 设备状态监控 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
          <Server className="h-6 w-6 text-indigo-600" />
          设备状态监控
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Wifi className="h-6 w-6 text-green-600" />
                    </div>
                <div>
                  <h3 className="font-semibold text-gray-900">WiFi网络</h3>
                  <p className="text-sm text-gray-500">状态: 正常</p>
                  <p className="text-xs text-gray-400">信号强度: 85%</p>
                  </div>
                    </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                <div>
                  <h3 className="font-semibold text-gray-900">NFC读卡器</h3>
                  <p className="text-sm text-gray-500">状态: 在线</p>
                  <p className="text-xs text-gray-400">设备数量: 2台</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">系统性能</h3>
                  <p className="text-sm text-gray-500">CPU使用率: 35%</p>
                  <p className="text-xs text-gray-400">内存使用率: 60%</p>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* 核心功能模块 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
          <Settings className="h-6 w-6 text-gray-600" />
          核心功能模块
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* 学生考勤模块 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              学生考勤模块
            </h3>
            <div className="space-y-3">
              <Link href="/student-checkin">
                <Card className="hover:shadow-lg transition-all duration-200 hover:bg-blue-50 hover:border-blue-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">学生NFC考勤</h4>
                        <p className="text-sm text-gray-500">学生考勤打卡系统</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* 教师考勤模块 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-600" />
              教师考勤模块
            </h3>
            <div className="space-y-3">
              <Link href="/teacher-checkin">
                <Card className="hover:shadow-lg transition-all duration-200 hover:bg-purple-50 hover:border-purple-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">教师考勤管理</h4>
                        <p className="text-sm text-gray-500">教师考勤打卡系统</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* 智能排班模块 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              智能排班模块
            </h3>
            <div className="space-y-3">
              <Link href="/schedule-management">
                <Card className="hover:shadow-lg transition-all duration-200 hover:bg-green-50 hover:border-green-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">AI智能排班</h4>
                        <p className="text-sm text-gray-500">企业级考勤管理</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/tv-board">
                <Card className="hover:shadow-lg transition-all duration-200 hover:bg-pink-50 hover:border-pink-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">TV大屏</h4>
                        <p className="text-sm text-gray-500">大屏显示系统</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* 卡片管理模块 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              卡片管理模块
            </h3>
            <div className="space-y-3">
              <Link href="/card-management">
                <Card className="hover:shadow-lg transition-all duration-200 hover:bg-indigo-50 hover:border-indigo-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">NFC卡片管理</h4>
                        <p className="text-sm text-gray-500">卡片补办、关联、监控</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* 数据管理模块 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-600" />
              数据管理模块
            </h3>
            <div className="space-y-3">

              <Link href="/points-management">
                <Card className="hover:shadow-lg transition-all duration-200 hover:bg-yellow-50 hover:border-yellow-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">积分管理</h4>
                        <p className="text-sm text-gray-500">学生积分系统</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}