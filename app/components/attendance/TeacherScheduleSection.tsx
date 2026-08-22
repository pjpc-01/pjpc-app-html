"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserCheck, UserX, Calendar, BarChart3, Grid3X3, CalendarDays, RefreshCw } from "lucide-react"
import { useAttendanceStats } from "@/hooks/useAttendanceStats"
import SimpleScheduleManager from "@/app/components/attendance/SimpleScheduleManager"
import CalendarScheduleView from "@/app/components/attendance/CalendarScheduleView"
import { useLanguage } from "@/contexts/language-context"

/**
 * 教师排班管理区块：统计卡片 + 周/月视图切换 + 排班管理 + 日历视图
 * 从课程管理页移入考勤报表页，编排在考勤记录上方。
 */
export default function TeacherScheduleSection() {
  const { t } = useLanguage()
  const [view, setView] = useState<"week" | "month">("week")
  const {
    todayPresent,
    todayAbsent,
    weekSchedules,
    attendanceRate,
    loading,
    refetch,
  } = useAttendanceStats()

  const stats = [
    {
      title: "今日出勤",
      value: loading ? "..." : todayPresent,
      icon: UserCheck,
      color: "bg-green-100",
      description: t('course.present_count'),
    },
    {
      title: "今日缺勤",
      value: loading ? "..." : todayAbsent,
      icon: UserX,
      color: "bg-red-100",
      description: t('course.absent_count'),
    },
    {
      title: "今日排班",
      value: loading ? "..." : weekSchedules,
      icon: Calendar,
      color: "bg-blue-100",
      description: "排班数量",
    },
    {
      title: t('teacher.attendance_rate'),
      value: loading ? "..." : `${attendanceRate}%`,
      icon: BarChart3,
      color: "bg-purple-100",
      description: "整体出勤率",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 视图切换和刷新 */}
      <div className="flex items-center gap-2">
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
    </div>
  )
}