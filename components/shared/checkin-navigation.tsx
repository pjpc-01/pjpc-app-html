"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Smartphone,
  ArrowRight,
  Activity,
  Users,
  Clock,
} from "lucide-react"
import Link from "next/link"

export default function CheckInNavigation() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">双设备打卡系统</h1>
        <p className="text-gray-600">选择对应的打卡设备页面</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RFID Check-in */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              RFID 打卡系统
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  125KHz
                </Badge>
                <span className="text-sm text-gray-600">主入口</span>
              </div>
              <p className="text-sm text-gray-600">
                使用125KHz RFID读卡器进行学生打卡，适用于传统门禁系统。
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">RFID</div>
                <div className="text-xs text-gray-500">传统门禁系统</div>
              </div>
              <Link href="/rfid-checkin">
                <Button className="flex items-center gap-2">
                  进入系统
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* NFC Check-in */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-green-600" />
              NFC 打卡系统
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  13.56MHz
                </Badge>
                <span className="text-sm text-gray-600">侧入口</span>
              </div>
              <p className="text-sm text-gray-600">
                使用13.56MHz NFC读卡器进行学生打卡，支持智能手机和NFC卡片。
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">NFC</div>
                <div className="text-xs text-gray-500">现代智能系统</div>
              </div>
              <Link href="/nfc-checkin">
                <Button className="flex items-center gap-2">
                  进入系统
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Unified Attendance System */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-purple-600" />
              统一打卡系统
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  统一
                </Badge>
                <span className="text-sm text-gray-600">新系统</span>
              </div>
              <p className="text-sm text-gray-600">
                统一的打卡系统，支持多设备、NFC读卡、实时数据同步。
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-600">统一</div>
                <div className="text-xs text-gray-500">新打卡系统</div>
              </div>
              <Link href="/attendance?center=test-center">
                <Button className="flex items-center gap-2">
                  进入系统
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            系统概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">RFID</div>
              <div className="text-sm text-gray-600">125KHz 传统门禁</div>
              <div className="text-xs text-gray-500 mt-1">主入口设备</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">NFC</div>
              <div className="text-sm text-gray-600">13.56MHz 智能系统</div>
              <div className="text-xs text-gray-500 mt-1">侧入口设备</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">统一</div>
              <div className="text-sm text-gray-600">中央数据库</div>
              <div className="text-xs text-gray-500 mt-1">数据同步</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">系统特点</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm">支持双设备类型</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm">实时打卡记录</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm">统一数据管理</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">技术规格</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">RFID频率:</span>
              <span className="text-sm font-medium">125KHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">NFC频率:</span>
              <span className="text-sm font-medium">13.56MHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">数据库:</span>
              <span className="text-sm font-medium">PocketBase</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 