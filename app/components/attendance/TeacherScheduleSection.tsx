"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserCheck, UserX, Calendar, BarChart3, RefreshCw, Clock } from "lucide-react"
import { useAttendanceStats } from "@/hooks/useAttendanceStats"
import CalendarScheduleView from "@/app/components/attendance/CalendarScheduleView"
import TeacherMonthHours from "@/app/components/attendance/TeacherMonthHours"
import { useLanguage } from "@/contexts/language-context"

/**
 * 教师排班管理区块：统计卡片 + 月视图 + 教师本月工时面板
 * 周视图已移除，月视图为主视图；工时独立面板显示在月视图下方（有间距分隔）。
 */
export default function TeacherScheduleSection() {
  const { t } = useLanguage()
  // 月份状态（月视图和工时面板共享，跟随切换）
  const [month, setMonth] = useState(new Date())
  const {
    todayPresent,
    todayAbsent,
    weekSchedules,
    attendanceRate,
    monthHours,
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
    {
      title: "本月教学工时",
      value: loading ? "..." : `${monthHours} h`,
      icon: Clock,
      color: "bg-cyan-100",
      description: "本月课程排班总时长",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* 刷新 */}
      <div className="flex items-center gap-2">
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

      {/* 月视图（月份状态提升，工时面板跟随切换） */}
      <CalendarScheduleView month={month} onMonthChange={setMonth} />

      {/* 教师当月工时（独立面板，与月视图有间距分隔，不连着；随月视图切换月份） */}
      <div className="mt-10">
        <TeacherMonthHours month={month} />
      </div>
    </div>
  )
}