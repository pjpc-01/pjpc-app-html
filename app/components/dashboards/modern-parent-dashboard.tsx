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
  Heart,
  BookOpen,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  Bell,
  MessageSquare,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
  Users,
  GraduationCap,
  Activity,
  BarChart3,
  Settings
} from "lucide-react"

interface ModernParentDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function ModernParentDashboard({ activeTab, setActiveTab }: ModernParentDashboardProps) {
  // 模拟数据
  const childData = {
    name: "小明",
    grade: "三年级",
    class: "3A班",
    teacher: "李老师",
    points: 1250,
    attendance: 98.5,
    performance: 4.8
  }

  const recentActivities = [
    { id: 1, type: 'achievement', title: '获得学习之星', description: '数学作业表现优秀', time: '今天', points: 50 },
    { id: 2, type: 'attendance', title: '按时到校', description: '本周第5天准时到校', time: '今天', points: 10 },
    { id: 3, type: 'homework', title: '完成作业', description: '语文作业按时完成', time: '昨天', points: 20 },
    { id: 4, type: 'behavior', title: '帮助同学', description: '主动帮助同桌解决难题', time: '昨天', points: 30 }
  ]

  const upcomingEvents = [
    { id: 1, title: '家长会', date: '2024-01-15', time: '14:00', type: 'meeting' },
    { id: 2, title: '数学考试', date: '2024-01-18', time: '09:00', type: 'exam' },
    { id: 3, title: '学校开放日', date: '2024-01-20', time: '10:00', type: 'event' }
  ]

  const quickActions = [
    { 
      title: '查看成绩', 
      icon: BarChart3, 
      color: 'from-blue-500 to-blue-600', 
      href: '/grades',
      onClick: () => {
        console.log('查看成绩')
        setActiveTab('progress')
      }
    },
    { 
      title: '联系老师', 
      icon: MessageSquare, 
      color: 'from-green-500 to-green-600', 
      href: '/contact',
      onClick: () => {
        console.log('联系老师')
        setActiveTab('communication')
      }
    },
    { 
      title: '查看作业', 
      icon: BookOpen, 
      color: 'from-purple-500 to-purple-600', 
      href: '/homework',
      onClick: () => {
        console.log('查看作业')
        // 这里可以添加实际的导航逻辑
      }
    },
    { 
      title: '积分商城', 
      icon: Award, 
      color: 'from-orange-500 to-orange-600', 
      href: '/points',
      onClick: () => {
        console.log('积分商城')
        setActiveTab('rewards')
      }
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">亲爱的家长，您好！</h2>
              <p className="text-pink-100 text-lg">让我们一起关注孩子的成长吧</p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-pink-100 text-sm">当前时间</p>
                <p className="text-2xl font-bold">{new Date().toLocaleTimeString('zh-CN')}</p>
                <p className="text-pink-100 text-sm">{new Date().toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {/* Child Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-600" />
              孩子概况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{childData.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{childData.name}</h3>
                <p className="text-gray-600">{childData.grade} {childData.class}</p>
                <p className="text-sm text-gray-500">班主任：{childData.teacher}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{childData.points}</div>
                <div className="text-sm text-gray-500">积分</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              本周表现
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>出勤率</span>
                <span className="font-medium">{childData.attendance}%</span>
              </div>
              <Progress value={childData.attendance} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>综合表现</span>
                <span className="font-medium">{childData.performance}/5.0</span>
              </div>
              <Progress value={(childData.performance / 5) * 100} className="h-2" />
            </div>
            <div className="flex items-center justify-center pt-2">
              <Star className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="text-sm font-medium text-yellow-600">表现优秀</span>
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
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Activity className="h-4 w-4" />
              <span className="font-medium">概览</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">学习进度</span>
            </TabsTrigger>
            <TabsTrigger 
              value="communication" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">沟通交流</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Award className="h-4 w-4" />
              <span className="font-medium">奖励积分</span>
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
                    <p className="text-sm font-medium text-gray-600">孩子积分</p>
                    <p className="text-2xl font-bold text-gray-900">1,250</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-yellow-600">+50 本周新增</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">出勤率</p>
                    <p className="text-2xl font-bold text-gray-900">96.8%</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600">优秀表现</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">平均成绩</p>
                    <p className="text-2xl font-bold text-gray-900">88.5</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-blue-600">A级水平</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">本月奖励</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-purple-600">表现优秀</span>
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
                  最近表现
                </CardTitle>
                <CardDescription>孩子的日常表现和成就</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-md transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">+{activity.points}</div>
                        <div className="text-xs text-gray-500">积分</div>
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
                  <Settings className="h-5 w-5" />
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

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                即将到来的活动
              </CardTitle>
              <CardDescription>重要的学校活动和考试安排</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        event.type === 'meeting' ? 'bg-blue-100' :
                        event.type === 'exam' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {event.type === 'meeting' && <Users className="h-5 w-5 text-blue-600" />}
                        {event.type === 'exam' && <BookOpen className="h-5 w-5 text-red-600" />}
                        {event.type === 'event' && <Calendar className="h-5 w-5 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.date} {event.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tabs */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>学习进度</CardTitle>
              <CardDescription>孩子的学习表现和进步情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">学习进度模块开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>沟通交流</CardTitle>
              <CardDescription>与老师和学校的沟通记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">沟通模块开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>奖励积分</CardTitle>
              <CardDescription>积分获取记录和奖励兑换</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">奖励模块开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
