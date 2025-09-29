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
    <div className="space-y-4 sm:space-y-6">
      {/* 错误提示 */}
      {statsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{statsError}</AlertDescription>
        </Alert>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-700">学生总数</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats?.totalStudents || 0}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      注册学生
                    </p>
                  </>
                )}
              </div>
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-700">今日出勤</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl font-bold text-green-900">{stats?.todayAttendance || 0}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      实时出勤
                    </p>
                  </>
                )}
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-700">教师总数</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">{stats?.totalTeachers || 0}</p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      在职教师
                    </p>
                  </>
                )}
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-orange-700">出勤率</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl font-bold text-orange-900">{stats?.attendanceRate || 0}%</p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      今日统计
                    </p>
                  </>
                )}
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              快速操作
            </CardTitle>
            <CardDescription>常用功能快速访问</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/student-checkin" className="group">
                <div className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:bg-blue-50 hover:border-blue-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-sm text-gray-900">学生考勤</h3>
                    <p className="text-xs text-gray-500 mt-1">NFC打卡</p>
                  </div>
                </div>
              </a>
              
              <a href="/teacher-checkin" className="group">
                <div className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:bg-purple-50 hover:border-purple-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-medium text-sm text-gray-900">教师考勤</h3>
                    <p className="text-xs text-gray-500 mt-1">教师打卡</p>
                  </div>
                </div>
              </a>
              
              <a href="/schedule-management" className="group">
                <div className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:bg-green-50 hover:border-green-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium text-sm text-gray-900">排班管理</h3>
                    <p className="text-xs text-gray-500 mt-1">智能排班</p>
                  </div>
                </div>
              </a>
              
              <a href="/card-management" className="group">
                <div className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:bg-orange-50 hover:border-orange-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                      <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="font-medium text-sm text-gray-900">卡片管理</h3>
                    <p className="text-xs text-gray-500 mt-1">NFC卡片</p>
                  </div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

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
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">系统运行</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">正常</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">数据库</span>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">连接正常</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-purple-800">API服务</span>
                  </div>
                  <span className="text-xs text-purple-600 font-medium">运行中</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              今日概览
            </CardTitle>
            <CardDescription>今日系统使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>加载今日数据...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">学生考勤</p>
                      <p className="text-xs text-blue-600">今日打卡次数</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-blue-900">{stats?.todayAttendance || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">教师考勤</p>
                      <p className="text-xs text-green-600">今日教师打卡</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-900">{stats?.teacherAttendance || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-800">出勤率</p>
                      <p className="text-xs text-purple-600">今日整体出勤率</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-purple-900">{stats?.attendanceRate || 0}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              系统活动
            </CardTitle>
            <CardDescription>最近系统活动记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">学生考勤系统</p>
                  <p className="text-xs text-gray-500">系统运行正常，NFC读卡器已连接</p>
                </div>
                <span className="text-xs text-green-600 font-medium">正常</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">排班管理系统</p>
                  <p className="text-xs text-gray-500">智能排班功能已启用</p>
                </div>
                <span className="text-xs text-green-600 font-medium">正常</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">卡片管理系统</p>
                  <p className="text-xs text-gray-500">NFC卡片管理功能正常</p>
                </div>
                <span className="text-xs text-green-600 font-medium">正常</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
