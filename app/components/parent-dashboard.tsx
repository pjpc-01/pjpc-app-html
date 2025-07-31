"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import StudentManagement from "./student-management"
import CommunicationSystem from "./communication-system"
import LearningAnalytics from "./learning-analytics"
import FinanceManagement from "./finance-management"
import ScheduleManagement from "./schedule-management"
import {
  GraduationCap,
  MessageSquare,
  BarChart3,
  DollarSign,
  Clock,
  Heart,
  BookOpen,
  Calendar,
  Settings,
  TrendingUp,
  Activity,
  CheckCircle,
  Bell,
} from "lucide-react"

interface ParentDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function ParentDashboard({ activeTab, setActiveTab }: ParentDashboardProps) {
  const [stats] = useState({
    myChildren: 2,
    unreadMessages: 3,
    averageGrade: 88,
    attendanceRate: 95,
    monthlyFee: 2800,
    paidAmount: 2800,
    upcomingEvents: 2,
  })

  const children = [
    {
      id: 1,
      name: "小明",
      class: "三年级A班",
      recentGrade: 92,
      attendance: 98,
      status: "在校",
      arrivalTime: "08:30",
      departureTime: null,
      todaySubjects: ["数学", "英语", "科学"],
    },
    {
      id: 2,
      name: "小红",
      class: "一年级B班",
      recentGrade: 85,
      attendance: 92,
      status: "在校",
      arrivalTime: "08:25",
      departureTime: null,
      todaySubjects: ["语文", "数学", "美术"],
    },
  ]

  const recentActivities = [
    { time: "15:30", action: "作业完成", detail: "小明完成数学作业", child: "小明", type: "assignment" },
    { time: "14:20", action: "老师留言", detail: "英语课表现优秀", child: "小明", type: "message" },
    { time: "10:15", action: "考试成绩", detail: "小红数学测验92分", child: "小红", type: "grade" },
    { time: "08:30", action: "到校签到", detail: "小明已安全到校", child: "小明", type: "attendance" },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">我的孩子</p>
                      <p className="text-2xl font-bold">{stats.myChildren}</p>
                      <p className="text-xs text-blue-600 flex items-center mt-1">
                        <Heart className="h-3 w-3 mr-1" />
                        健康成长
                      </p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">平均成绩</p>
                      <p className="text-2xl font-bold">{stats.averageGrade}分</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        持续进步
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">出勤率</p>
                      <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                      <p className="text-xs text-orange-600 flex items-center mt-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        表现优秀
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">未读消息</p>
                      <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                      <p className="text-xs text-purple-600 flex items-center mt-1">
                        <Bell className="h-3 w-3 mr-1" />
                        待查看
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Children Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  孩子今日状况
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {children.map((child) => (
                    <Card key={child.id} className="border-2 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{child.name}</CardTitle>
                            <CardDescription>{child.class}</CardDescription>
                          </div>
                          <Badge className="bg-green-100 text-green-800">{child.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">到校时间</span>
                          <span className="font-medium">{child.arrivalTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">最近成绩</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {child.recentGrade}分
                          </Badge>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>出勤率</span>
                            <span>{child.attendance}%</span>
                          </div>
                          <Progress value={child.attendance} className="h-2" />
                        </div>
                        <div>
                          <div className="text-sm mb-2">今日课程</div>
                          <div className="flex flex-wrap gap-1">
                            {child.todaySubjects.map((subject, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities and Payment Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    最近动态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="text-xs text-gray-500 w-12">{activity.time}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.action}</div>
                          <div className="text-xs text-gray-500">{activity.detail}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            activity.type === "assignment"
                              ? "border-orange-200 text-orange-700"
                              : activity.type === "message"
                                ? "border-purple-200 text-purple-700"
                                : activity.type === "grade"
                                  ? "border-green-200 text-green-700"
                                  : "border-blue-200 text-blue-700"
                          }
                        >
                          {activity.child}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    缴费状况
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">本月费用</span>
                    <span className="font-medium">¥{stats.monthlyFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">已缴金额</span>
                    <span className="font-medium text-green-600">¥{stats.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">缴费状态</span>
                    <Badge className="bg-green-100 text-green-800">已完成</Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>缴费进度</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    查看详细账单
                  </Button>
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
                    onClick={() => setActiveTab("education")}
                  >
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <span className="text-sm">学习情况</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-purple-50"
                    onClick={() => setActiveTab("communication")}
                  >
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    <span className="text-sm">联系老师</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-green-50"
                    onClick={() => setActiveTab("finance")}
                  >
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span className="text-sm">缴费记录</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-orange-50"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-6 w-6 text-orange-600" />
                    <span className="text-sm">账户设置</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  账户设置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">个人信息</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        修改个人资料
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        更改密码
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        联系方式管理
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">通知设置</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        WhatsApp通知设置
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        邮件通知偏好
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        紧急联系设置
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "finance":
        return <FinanceManagement />

      case "education":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("children")}>
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">孩子信息</h3>
                  <p className="text-sm text-gray-600 mb-3">查看孩子的详细学习信息</p>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {stats.myChildren} 个孩子
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("analytics")}>
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">学习分析</h3>
                  <p className="text-sm text-gray-600 mb-3">孩子的学习报告和进度</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stats.averageGrade}分 平均
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("schedule")}>
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">课程安排</h3>
                  <p className="text-sm text-gray-600 mb-3">孩子的课程时间表</p>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {stats.upcomingEvents} 即将到来
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      // Individual feature pages
      case "children":
        return <StudentManagement />
      case "communication":
        return <CommunicationSystem />
      case "analytics":
        return <LearningAnalytics />
      case "schedule":
        return <ScheduleManagement />
      default:
        return <div className="text-center py-12 text-gray-500">请选择一个功能模块</div>
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            设定
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            财务
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            教育
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
