"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  DollarSign,
  GraduationCap,
  Clock,
  TrendingUp,
  AlertTriangle,
  Activity,
  Shield,
  RefreshCw,
  BarChart3,
} from "lucide-react"

interface OverviewTabProps {
  stats: any
  statsLoading: boolean
  statsError: string | null
}

export default function OverviewTab({ stats, statsLoading, statsError }: OverviewTabProps) {
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
                    <p className="text-2xl font-bold">RM {(stats?.monthlyRevenue || 0).toLocaleString()}</p>
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
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">系统运行正常</span>
                  </div>
                  <span className="text-xs text-green-600">在线</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">数据库连接</span>
                  </div>
                  <span className="text-xs text-blue-600">正常</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium">API服务</span>
                  </div>
                  <span className="text-xs text-purple-600">正常</span>
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
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">新用户注册</p>
                    <p className="text-xs text-gray-500">2分钟前</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">学生出勤记录</p>
                    <p className="text-xs text-gray-500">5分钟前</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">费用支付完成</p>
                    <p className="text-xs text-gray-500">10分钟前</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">用户增长趋势</CardTitle>
            <CardDescription>过去30天的用户注册情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">用户增长图表</p>
                <p className="text-sm text-gray-400">图表功能开发中...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">收入统计</CardTitle>
            <CardDescription>月度收入变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">收入统计图表</p>
                <p className="text-sm text-gray-400">图表功能开发中...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
