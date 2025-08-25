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
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员仪表板</h1>
          <p className="text-gray-600">系统管理和监控中心</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 用户管理 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                用户审核管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    <Clock className="h-3 w-3 mr-1" />
                    待审核: 5
                  </Badge>
                  <span className="text-sm text-gray-600">新用户申请</span>
                </div>
                <p className="text-sm text-gray-600">
                  企业级用户审核系统，支持批量操作、审计日志和数据分析
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">高级审核</div>
                  <div className="text-xs text-gray-500">批量操作 + 审计</div>
                </div>
                <Link href="/enterprise-user-approval">
                  <Button className="flex items-center gap-2">
                    进入系统
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 统一打卡系统 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-green-600" />
                统一打卡系统
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <Activity className="h-3 w-3 mr-1" />
                    在线: 2
                  </Badge>
                  <span className="text-sm text-gray-600">设备状态</span>
                </div>
                <p className="text-sm text-gray-600">
                  NFC/RFID 统一管理平台，支持卡片读写、设备管理和打卡记录
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">双设备</div>
                  <div className="text-xs text-gray-500">NFC + RFID</div>
                </div>
                <Link href="/unified-attendance">
                  <Button className="flex items-center gap-2">
                    进入系统
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* URL考勤系统 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-blue-600" />
                URL考勤系统
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    <Users className="h-3 w-3 mr-1" />
                    有URL: 25
                  </Badge>
                  <span className="text-sm text-gray-600">学生状态</span>
                </div>
                <p className="text-sm text-gray-600">
                  基于学生专属URL的智能考勤系统，支持移动设备NFC打卡
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">URL识别</div>
                  <div className="text-xs text-gray-500">移动 + NFC</div>
                </div>
                <Link href="/url-attendance">
                  <Button className="flex items-center gap-2">
                    进入系统
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 系统监控 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                系统监控
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    <Database className="h-3 w-3 mr-1" />
                    健康: 95%
                  </Badge>
                  <span className="text-sm text-gray-600">系统状态</span>
                </div>
                <p className="text-sm text-gray-600">
                  实时监控系统性能、用户活动和数据统计
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-purple-600">实时监控</div>
                  <div className="text-xs text-gray-500">性能 + 统计</div>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  查看详情
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 快速统计 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-indigo-600" />
                用户统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">128</div>
                  <div className="text-xs text-gray-500">总用户</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">5</div>
                  <div className="text-xs text-gray-500">待审核</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <div className="text-xs text-gray-500">今日活跃</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">2</div>
                  <div className="text-xs text-gray-500">已拒绝</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 设备状态 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-teal-600" />
                设备状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">主入口读卡器</span>
                  <Badge className="bg-green-100 text-green-800">在线</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">侧门读卡器</span>
                  <Badge className="bg-green-100 text-green-800">在线</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">备用读卡器</span>
                  <Badge variant="secondary">离线</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 系统设置 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-gray-600" />
                系统设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  系统配置、权限管理和安全设置
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-gray-600">配置</div>
                  <div className="text-xs text-gray-500">权限 + 安全</div>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  设置
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/enterprise-user-approval">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center gap-2">
                    <UserCheck className="h-6 w-6" />
                    <span>用户审核</span>
                  </Button>
                </Link>
                <Link href="/unified-attendance">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    <span>打卡系统</span>
                  </Button>
                </Link>
                <Button variant="outline" className="w-full h-16 flex flex-col items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>数据报表</span>
                </Button>
                <Button variant="outline" className="w-full h-16 flex flex-col items-center gap-2">
                  <Settings className="h-6 w-6" />
                  <span>系统设置</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

