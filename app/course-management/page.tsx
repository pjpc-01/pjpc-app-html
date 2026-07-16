"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import CourseManagement from "@/components/courses/CourseManagement"
import ClassManagement from "@/components/courses/ClassManagement"
import CourseScheduling from "@/components/courses/CourseScheduling"
import SimpleScheduleManager from "@/app/components/attendance/SimpleScheduleManager"
import CalendarScheduleView from "@/app/components/attendance/CalendarScheduleView"
import { useAttendanceStats } from "@/hooks/useAttendanceStats"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Calendar,
  BarChart3,
  Grid3X3,
  CalendarDays,
  RefreshCw,
} from "lucide-react"

export default function CourseManagementPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [view, setView] = useState<"week" | "month">("week")
  const {
    todayPresent,
    todayAbsent,
    weekSchedules,
    attendanceRate,
    loading,
    error,
    refetch,
  } = useAttendanceStats()

  const stats = [
    {
      title: "今日出勤",
      value: loading ? "..." : todayPresent,
      icon: UserCheck,
      color: "bg-green-100",
      description: "出勤人数",
    },
    {
      title: "今日缺勤",
      value: loading ? "..." : todayAbsent,
      icon: UserX,
      color: "bg-red-100",
      description: "缺勤人数",
    },
    {
      title: "今日排班",
      value: loading ? "..." : weekSchedules,
      icon: Calendar,
      color: "bg-blue-100",
      description: "排班数量",
    },
    {
      title: "出勤率",
      value: loading ? "..." : `${attendanceRate}%`,
      icon: BarChart3,
      color: "bg-purple-100",
      description: "整体出勤率",
    },
  ]

  return (
    <PageLayout
      title="课程管理"
      description="管理课程设置和教学安排"
      userRole={userProfile?.role || "admin"}
      status="系统正常"
      background="bg-gray-50"
      actions={
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回仪表板
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">课程管理</h2>
          <CourseManagement />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">班级管理</h2>
          <ClassManagement />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">排课管理</h2>
          <CourseScheduling />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">教师排班</h2>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 视图切换和刷新 */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("week")}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              周视图
            </Button>
            <Button
              variant={view === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("month")}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              月视图
            </Button>
            <Button
              variant="outline"
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              刷新数据
            </Button>
          </div>

          {/* 周视图 / 月视图 */}
          {view === "week" ? (
            <SimpleScheduleManager />
          ) : (
            <CalendarScheduleView />
          )}
        </section>
      </div>
    </PageLayout>
  )
}
