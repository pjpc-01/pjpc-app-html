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
} from "lucide-react"
import Link from "next/link"

interface ManagementTabProps {
  stats: any
  statsLoading: boolean
  setActiveTab: (tab: string) => void
}

export default function ManagementTab({ stats, statsLoading, setActiveTab }: ManagementTabProps) {
  return (
    <div className="space-y-6">
      {/* 加载状态 */}
      {statsLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>加载系统数据中...</span>
        </div>
      )}
      {/* 系统状态监控 */}
      {!statsLoading && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700">系统状态监控</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 系统健康状态 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">系统健康</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.systemHealth || '正常'}
                </div>
                <p className="text-xs text-muted-foreground">
                  系统运行状态良好
                </p>
                <div className="mt-2">
                  <Badge className="bg-green-100 text-green-800">在线</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 数据库状态 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">数据库</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.databaseStatus || '正常'}
                </div>
                <p className="text-xs text-muted-foreground">
                  数据库连接稳定
                </p>
                <div className="mt-2">
                  <Badge className="bg-blue-100 text-blue-800">连接正常</Badge>
                </div>
              </CardContent>
            </Card>

            {/* API服务状态 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API服务</CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.apiStatus || '正常'}
                </div>
                <p className="text-xs text-muted-foreground">
                  API服务响应正常
                </p>
                <div className="mt-2">
                  <Badge className="bg-purple-100 text-purple-800">服务正常</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 数据统计概览 */}
      {!statsLoading && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700">数据统计概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 用户统计 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">用户统计</CardTitle>
                <Users className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  总用户数
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="text-xs">活跃: {stats?.activeUsers || 0}</Badge>
                  <Badge variant="outline" className="text-xs">待审: {stats?.pendingUsers || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 学生统计 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">学生统计</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  在校学生
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="text-xs">今日出勤: {stats?.todayAttendance || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 积分统计 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">积分统计</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.totalPoints || 0}</div>
                <p className="text-xs text-muted-foreground">
                  总奖励次数
                </p>
                <div className="mt-2">
                  <Link href="/points-management">
                    <Button variant="outline" size="sm" className="w-full">
                      管理积分
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 考勤统计 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">考勤统计</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats?.todayAttendance || 0}</div>
                <p className="text-xs text-muted-foreground">
                  今日出勤
                </p>
                <div className="mt-2 space-y-2">
                  <Link href="/unified-attendance">
                    <Button variant="outline" size="sm" className="w-full">
                      查看考勤
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                  <Link href="/attendance-management">
                    <Button variant="outline" size="sm" className="w-full">
                      AI企业级考勤系统
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 设备状态监控 */}
      {!statsLoading && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4 text-gray-700">设备状态监控</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-teal-600" />
                  设备运行状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">主入口读卡器</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {stats?.devices?.mainReader || '在线'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">侧门读卡器</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {stats?.devices?.sideReader || '在线'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium">备用读卡器</span>
                    </div>
                    <Badge variant="secondary">
                      {stats?.devices?.backupReader || '离线'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  NFC测试工具
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  使用虚拟数据测试NFC读取和写入功能，无需真实NFC设备
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Link href="/nfc-virtual-test">
                    <Button variant="outline" size="sm" className="w-full">
                      <Database className="mr-2 h-4 w-4" />
                      NFC虚拟测试
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                  <Link href="/nfc-encryption-test">
                    <Button variant="outline" size="sm" className="w-full">
                      <Shield className="mr-2 h-4 w-4" />
                      NFC加密测试
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 快速访问 */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-4 text-gray-700">快速访问</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center gap-2"
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 className="h-6 w-6" />
            <span>数据报表</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center gap-2"
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-6 w-6" />
            <span>系统设置</span>
          </Button>
          <Link href="/admin/nfc-approval">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center gap-2">
              <Shield className="h-6 w-6" />
              <span>NFC审核</span>
            </Button>
          </Link>
          <Link href="/admin/wifi-networks">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center gap-2">
              <Globe className="h-6 w-6" />
              <span>WiFi管理</span>
            </Button>
          </Link>
          <Link href="/unified-attendance">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center gap-2">
              <CreditCard className="h-6 w-6" />
              <span>统一考勤</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
