"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  MessageSquare,
  Activity
} from "lucide-react"

interface TeacherStatsProps {
  teacherId?: string
}

interface StatsData {
  totalStudents: number
  todayAttendance: number
  attendanceRate: number
  pendingAssignments: number
  completedAssignments: number
  todayClasses: number
  averageGrade: number
  recentMessages: number
  weeklyAttendance: number[]
  monthlyProgress: number
}

export default function TeacherStats({ teacherId }: TeacherStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    todayClasses: 0,
    averageGrade: 0,
    recentMessages: 0,
    weeklyAttendance: [],
    monthlyProgress: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatsData()
  }, [teacherId])

  const loadStatsData = async () => {
    try {
      setLoading(true)
      
      // 模拟数据加载
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟统计数据
      setStats({
        totalStudents: 45,
        todayAttendance: 38,
        attendanceRate: 84.4,
        pendingAssignments: 12,
        completedAssignments: 28,
        todayClasses: 4,
        averageGrade: 85.2,
        recentMessages: 3,
        weeklyAttendance: [85, 88, 82, 90, 87, 89, 84],
        monthlyProgress: 15.3
      })

    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载统计数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总学生数</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500">活跃学生</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日出勤</p>
                <p className="text-2xl font-bold text-green-600">{stats.todayAttendance}</p>
                <p className="text-xs text-gray-500">出勤率 {stats.attendanceRate}%</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待批作业</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingAssignments}</p>
                <p className="text-xs text-gray-500">已完成 {stats.completedAssignments}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均成绩</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageGrade}</p>
                <p className="text-xs text-gray-500">本月提升 {stats.monthlyProgress}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 出勤率趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              本周出勤率趋势
            </CardTitle>
            <CardDescription>过去7天的出勤情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.weeklyAttendance.map((rate, index) => {
                const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 w-12">
                      {days[index]}
                    </span>
                    <div className="flex-1 mx-4">
                      <Progress value={rate} className="h-2" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {rate}%
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 课程统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              课程统计
            </CardTitle>
            <CardDescription>今日课程安排</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">今日课程</p>
                    <p className="text-sm text-blue-700">已安排课程数</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{stats.todayClasses}</p>
                  <p className="text-sm text-blue-600">节</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">未读消息</p>
                    <p className="text-sm text-green-700">家长和学校消息</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{stats.recentMessages}</p>
                  <p className="text-sm text-green-600">条</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">月度进步</p>
                    <p className="text-sm text-purple-700">学生成绩提升</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">+{stats.monthlyProgress}%</p>
                  <p className="text-sm text-purple-600">较上月</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            详细统计
          </CardTitle>
          <CardDescription>各项指标的详细数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">学生管理</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">总学生数</span>
                  <span className="font-medium">{stats.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">今日出勤</span>
                  <span className="font-medium">{stats.todayAttendance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">出勤率</span>
                  <span className="font-medium">{stats.attendanceRate}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">作业管理</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">待批作业</span>
                  <span className="font-medium">{stats.pendingAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">已完成</span>
                  <span className="font-medium">{stats.completedAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">完成率</span>
                  <span className="font-medium">
                    {stats.completedAssignments + stats.pendingAssignments > 0 
                      ? Math.round((stats.completedAssignments / (stats.completedAssignments + stats.pendingAssignments)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">教学效果</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">平均成绩</span>
                  <span className="font-medium">{stats.averageGrade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">今日课程</span>
                  <span className="font-medium">{stats.todayClasses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">月度进步</span>
                  <span className="font-medium">+{stats.monthlyProgress}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
