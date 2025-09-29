"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
import StatsGrid from "@/components/ui/StatsGrid"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NFCAttendanceSystem from "./nfc-attendance-system"
import {
  Clock,
  UserCheck,
  Users,
  Camera,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Wifi,
  WifiOff,
  MessageSquare,
  Activity,
  Eye,
  Shield,
  CreditCard,
  Zap,
  Database,
} from "lucide-react"

export default function AttendanceSystem() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showNFCSystem, setShowNFCSystem] = useState(false)

  // Mock data
  const [stats] = useState({
    totalStudents: 89,
    presentToday: 82,
    absentToday: 7,
    lateArrivals: 3,
    // faceRecognitionAccuracy: 98.5, // 暂时隐藏脸部识别
    whatsappDeliveryRate: 99.2,
    systemHealth: 95,
  })

  const [students] = useState([
    {
      id: "1",
      name: "小明",
      class: "三年级A班",
      status: "present",
      arrivalTime: "08:30",
      departureTime: null,
      // faceId: "registered", // 暂时隐藏脸部识别
      parentPhone: "+886912345678",
      notificationSent: true,
    },
    {
      id: "2",
      name: "小红",
      class: "一年级B班",
      status: "present",
      arrivalTime: "08:25",
      departureTime: null,
      // faceId: "registered", // 暂时隐藏脸部识别
      parentPhone: "+886987654321",
      notificationSent: true,
    },
    {
      id: "3",
      name: "小华",
      class: "二年级C班",
      status: "late",
      arrivalTime: "09:15",
      departureTime: null,
      // faceId: "registered", // 暂时隐藏脸部识别
      parentPhone: "+886555666777",
      notificationSent: true,
    },
    {
      id: "4",
      name: "小美",
      class: "四年级A班",
      status: "absent",
      arrivalTime: null,
      departureTime: null,
      // faceId: "registered", // 暂时隐藏脸部识别
      parentPhone: "+886444555666",
      notificationSent: false,
    },
  ])

  const [accessControlDevices] = useState([
    {
      id: "main_gate",
      name: "主门",
      status: "online",
      location: "学校正门",
      lastActivity: "2分钟前",
      // recognitionCount: 45, // 暂时隐藏脸部识别统计
    },
    {
      id: "side_gate",
      name: "侧门",
      status: "online",
      location: "操场入口",
      lastActivity: "5分钟前",
      // recognitionCount: 23, // 暂时隐藏脸部识别统计
    },
    {
      id: "back_gate",
      name: "后门",
      status: "offline",
      location: "后院入口",
      lastActivity: "30分钟前",
      // recognitionCount: 0, // 暂时隐藏脸部识别统计
    },
  ])

  const [recentActivities] = useState([
    {
      time: "09:15",
      student: "小华",
      action: "迟到签到",
      device: "主门",
      status: "late",
      whatsappSent: true,
    },
    {
      time: "08:45",
      student: "小明",
      action: "正常签到",
      device: "主门",
      status: "present",
      whatsappSent: true,
    },
    {
      time: "08:30",
      student: "小红",
      action: "正常签到",
      device: "侧门",
      status: "present",
      whatsappSent: true,
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4" />
      case "absent":
        return <XCircle className="h-4 w-4" />
      case "late":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* NFC System Toggle */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">NFC/RFID 打卡系统</h3>
                    <p className="text-sm text-gray-600">使用NFC或RFID卡进行学生打卡</p>
                  </div>
                  <Button 
                    onClick={() => setShowNFCSystem(!showNFCSystem)}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    {showNFCSystem ? "隐藏" : "启用"} NFC系统
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">今日出勤</p>
                      <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
                      <p className="text-xs text-gray-500">
                        {((stats.presentToday / stats.totalStudents) * 100).toFixed(1)}% 出勤率
                      </p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">缺席人数</p>
                      <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
                      <p className="text-xs text-gray-500">需要关注</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">迟到人数</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.lateArrivals}</p>
                      <p className="text-xs text-gray-500">需要提醒</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              {/* 暂时隐藏脸部识别统计卡片
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">识别准确率</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.faceRecognitionAccuracy}%</p>
                      <p className="text-xs text-gray-500">系统表现优秀</p>
                    </div>
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              */}
            </div>

                         {/* System Status and Recent Activities */}
             <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
               {/* 暂时隐藏门禁设备状态 */}

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    最近活动
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="text-xs text-gray-500 w-12">{activity.time}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.student}</div>
                          <div className="text-xs text-gray-500">
                            {activity.action} • {activity.device}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(activity.status)}>
                            {getStatusIcon(activity.status)}
                          </Badge>
                          {activity.whatsappSent && <MessageSquare className="h-3 w-3 text-green-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* WhatsApp Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp 通知系统
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">{stats.whatsappDeliveryRate}%</div>
                    <div className="text-sm text-gray-600">消息送达率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {students.filter((s) => s.notificationSent).length}
                    </div>
                    <div className="text-sm text-gray-600">今日已发送</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-2">
                      {students.filter((s) => !s.notificationSent).length}
                    </div>
                    <div className="text-sm text-gray-600">待发送</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "students":
        return (
          <div className="space-y-6">
            {/* Student List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  学生出勤状况
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(student.status)}
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.class}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {student.arrivalTime && <div className="text-sm">到校: {student.arrivalTime}</div>}
                          {student.departureTime && <div className="text-sm">离校: {student.departureTime}</div>}
                        </div>
                        <Badge variant="outline" className={getStatusColor(student.status)}>
                          {student.status === "present" ? "在校" : student.status === "absent" ? "缺席" : "迟到"}
                        </Badge>
                        {student.notificationSent ? (
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "face-recognition":
        return (
          <div className="space-y-6">
            {/* 暂时隐藏脸部识别管理功能 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  脸部识别管理 (暂时隐藏)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    脸部识别功能暂时隐藏，如需启用请联系管理员。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )

      case "whatsapp":
        return (
          <div className="space-y-6">
            {/* WhatsApp Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp 通知设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    WhatsApp Business API 已连接，当前消息送达率: {stats.whatsappDeliveryRate}%
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">消息模板</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        编辑到校通知模板
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        编辑离校通知模板
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        编辑迟到提醒模板
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">发送设置</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        API 配置
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        发送状态监控
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        失败重试设置
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return <div className="text-center py-12 text-gray-500">请选择一个功能模块</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* NFC System */}
      {showNFCSystem && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-900">NFC/RFID 打卡系统</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNFCSystem(false)}
            >
              关闭
            </Button>
          </div>
          <div className="bg-white rounded-lg p-4">
            <NFCAttendanceSystem />
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            学生出勤
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
