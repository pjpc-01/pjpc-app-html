"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserCheck, UserX, Calendar, BarChart3, RefreshCw, Clock, ListOrdered, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
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

  // ── 排班记录 log ──
  const [scheduleLogOpen, setScheduleLogOpen] = useState(false)
  const [scheduleLogs, setScheduleLogs] = useState<any[]>([])
  const [logLoading, setLogLoading] = useState(false)
  const [teacherNameMap, setTeacherNameMap] = useState<Record<string, string>>({})

  const loadScheduleLogs = useCallback(async (targetMonth: Date) => {
    setLogLoading(true)
    try {
      const filter = encodeURIComponent(
        `date>="${format(startOfMonth(targetMonth), "yyyy-MM-dd")}" && date<="${format(endOfMonth(targetMonth), "yyyy-MM-dd")}"`
      )
      const [schedRes, teacherRes] = await Promise.all([
        fetch(`/api/pocketbase-proxy/api/collections/schedules/records?filter=${filter}&sort=-date,start_time&perPage=300`),
        fetch("/api/teachers?limit=200"),
      ])
      const schedData = await schedRes.json()
      const tData = await teacherRes.json()
      const tlist = tData?.data || tData?.items || []
      const tmap: Record<string, string> = {}
      tlist.forEach((tc: any) => { if (tc.id) tmap[tc.id] = (tc.name || tc.teacher_name || "").trim() })
      setTeacherNameMap(tmap)
      setScheduleLogs(schedData?.items || [])
    } finally {
      setLogLoading(false)
    }
  }, [])

  const logTeacherName = (rec: any) =>
    (rec?.teacher_name || "").trim() || teacherNameMap[rec?.teacher_id] || ""
  const logCourseName = (rec: any) =>
    (rec?.course_title || "").trim() || (rec?.notes === "从时间表自动生成" ? "（时间表展开）" : "") || ""
  const logSource = (rec: any) => {
    if (rec?.notes) return rec.notes
    if (rec?.schedule_type === "course_schedule") return "排课管理"
    if (rec?.schedule_type === "regular") return "常规"
    return "—"
  }

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
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => {
            setScheduleLogOpen(true)
            loadScheduleLogs(month)
          }}
        >
          <ListOrdered className="h-4 w-4" />
          排班记录
        </Button>
      </div>

      {/* 月视图（月份状态提升，工时面板跟随切换） */}
      <CalendarScheduleView month={month} onMonthChange={setMonth} />

      {/* 教师当月工时（独立面板，与月视图有间距分隔，不连着；随月视图切换月份） */}
      <div className="mt-10">
        <TeacherMonthHours month={month} />
      </div>

      {/* 排班记录 Dialog */}
      <Dialog open={scheduleLogOpen} onOpenChange={setScheduleLogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              排班记录（{format(month, "yyyy 年 M 月")}）
            </DialogTitle>
            <DialogDescription>
              当月全部排班记录。标红的 = 没有课程的排班（来源见「来源」列）
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto border rounded-lg divide-y">
            {logLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />加载中...
              </div>
            ) : scheduleLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">当月暂无排班</p>
            ) : (
              scheduleLogs.map((rec) => {
                const tName = logTeacherName(rec)
                const cName = logCourseName(rec)
                const hasCourse = !!cName
                return (
                  <div key={rec.id} className={`flex items-center gap-3 px-3 py-2 text-sm ${hasCourse ? "" : "bg-red-50"}`}>
                    <div className="w-24 shrink-0">
                      <div className="font-medium">{(rec.date || "").split(" ")[0].slice(5)}</div>
                      <div className="text-xs text-gray-500">{rec.start_time}-{rec.end_time}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {tName || <span className="text-red-600">未排老师</span>}
                      </div>
                      <div className="text-xs truncate">
                        {hasCourse ? cName : <span className="text-red-600 font-medium">无课程</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] max-w-[130px] truncate" title={logSource(rec)}>
                      {logSource(rec)}
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}