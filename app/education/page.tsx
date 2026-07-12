"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar, Clock, Users, GraduationCap, BookOpen, Bell, School,
  ChevronLeft, ChevronRight, MapPin, X,
} from "lucide-react"

// ── Hooks ──
import { useSchedule, Schedule } from "@/hooks/useSchedule"
import { useClasses } from "@/hooks/useClasses"
import { useCourses } from "@/hooks/useCourses"
import { useStudents } from "@/hooks/useStudents"
import { useTeachers } from "@/hooks/useTeachers"
import { useAnnouncements } from "@/hooks/useAnnouncements"

// ── Constants ──
const WEEKDAYS_SHORT = ["日", "一", "二", "三", "四", "五", "六"]
const MONTH_NAMES = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]

const EVENT_COLORS: Record<string, string> = {
  scheduled:   "bg-blue-500",
  confirmed:   "bg-emerald-500",
  in_progress: "bg-amber-500",
  completed:   "bg-gray-400",
  cancelled:   "bg-red-400",
  activity:    "bg-purple-500",
}

// ── Helpers ──
function fmtDate(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, "0")
  const dd = String(d).padStart(2, "0")
  return `${y}-${mm}-${dd}`
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]
}

// ─────────────────────────────────────────────
//  Monthly Calendar Sub-Component
// ─────────────────────────────────────────────
function MonthCalendar({
  schedules,
  loading,
}: {
  schedules: Schedule[]
  loading: boolean
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = todayStr()

  // Navigate
  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }
  const goToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    setSelectedDate(null)
  }

  // Build calendar grid
  const grid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDow = firstDay.getDay() // 0=Sun
    const totalDays = lastDay.getDate()

    const cells: (number | null)[] = []
    for (let i = 0; i < startDow; i++) cells.push(null) // leading blanks
    for (let d = 1; d <= totalDays; d++) cells.push(d)

    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null)

    return cells
  }, [year, month])

  // Index schedules by date
  const scheduleMap = useMemo(() => {
    const map: Record<string, Schedule[]> = {}
    for (const s of schedules) {
      if (!s.date) continue
      const d = s.date.split("T")[0].split(" ")[0]
      if (!map[d]) map[d] = []
      map[d].push(s)
    }
    return map
  }, [schedules])

  // Selected day details
  const selectedSchedules = selectedDate ? (scheduleMap[selectedDate] || []) : []

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>
              {year}年{MONTH_NAMES[month - 1]}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-8">
              今天
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row">
            {/* ── Calendar Grid ── */}
            <div className="flex-1 p-2 sm:p-3">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS_SHORT.map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-medium text-gray-500 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
                {grid.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="bg-white min-h-[60px] sm:min-h-[80px]" />
                  }
                  const dateStr = fmtDate(year, month, day)
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  const dayEvents = scheduleMap[dateStr] || []
                  const uniqueClasses = [...new Set(dayEvents.map(s => s.class_name || s.teacher_name || "课"))]

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`bg-white text-left p-1 sm:p-1.5 min-h-[60px] sm:min-h-[80px] transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                        isSelected ? "ring-2 ring-inset ring-primary bg-primary/5" : ""
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-700"
                        }`}
                      >
                        {day}
                      </span>
                      {/* Event indicators */}
                      <div className="mt-0.5 space-y-0.5">
                        {uniqueClasses.slice(0, 3).map((name, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1"
                            title={name}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                EVENT_COLORS[dayEvents[i]?.status || "scheduled"] || EVENT_COLORS.scheduled
                              }`}
                            />
                            <span className="text-[10px] text-gray-600 truncate leading-tight">
                              {name.length > 8 ? name.slice(0, 8) + "…" : name}
                            </span>
                          </div>
                        ))}
                        {uniqueClasses.length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{uniqueClasses.length - 3} 更多
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Side Panel: Selected Day Details ── */}
            {selectedDate && (
              <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 p-3 sm:p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">
                    {selectedDate}
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      {new Date(selectedDate).toLocaleDateString("zh-CN", { weekday: "long" })}
                    </span>
                  </h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {selectedSchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="h-6 w-6 mx-auto mb-1 opacity-30" />
                    <p className="text-xs">当日无课程安排</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {selectedSchedules
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map(s => (
                        <div
                          key={s.id}
                          className="bg-white rounded-lg border p-2.5 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs truncate">
                              {s.class_name || s.teacher_name || "—"}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                s.status === "in_progress"
                                  ? "border-amber-300 bg-amber-50 text-amber-700"
                                  : s.status === "completed"
                                  ? "border-gray-300 bg-gray-50 text-gray-500"
                                  : s.status === "cancelled"
                                  ? "border-red-300 bg-red-50 text-red-500"
                                  : "border-blue-300 bg-blue-50 text-blue-700"
                              }`}
                            >
                              {s.status === "scheduled" ? "待定" :
                               s.status === "confirmed" ? "已确认" :
                               s.status === "in_progress" ? "进行中" :
                               s.status === "completed" ? "已完成" :
                               s.status === "cancelled" ? "已取消" : s.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{s.start_time?.slice(0, 5)} — {s.end_time?.slice(0, 5)}</span>
                          </div>
                          {(s.room || s.center) && (
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              <span>{s.room || s.center}</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────
export default function EducationOverviewPage() {
  const today = todayStr()

  const { schedules, loading: schedLoading } = useSchedule()
  const { classes, loading: classLoading } = useClasses()
  const { courses, loading: courseLoading } = useCourses()
  const { students, loading: studentLoading } = useStudents()
  const { teachers, loading: teacherLoading } = useTeachers()
  const { announcements, loading: announceLoading } = useAnnouncements()

  const loading = schedLoading || classLoading || courseLoading || studentLoading || teacherLoading

  // Stats
  const todayClasses = schedules.filter((s: Schedule) => s.date === today).length

  const stats = {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalClasses: classes.length,
    totalCourses: courses.length,
    todayClasses,
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">教育概览</h1>
        <p className="text-gray-500 mt-1">课程表 · 班级总览 · 公告动态</p>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: GraduationCap, label: "学生", value: stats.totalStudents, color: "text-blue-600 bg-blue-50" },
          { icon: Users, label: "教师", value: stats.totalTeachers, color: "text-green-600 bg-green-50" },
          { icon: BookOpen, label: "课程", value: stats.totalCourses, color: "text-purple-600 bg-purple-50" },
          { icon: School, label: "班级", value: stats.totalClasses, color: "text-orange-600 bg-orange-50" },
          { icon: Clock, label: "今日课节", value: stats.todayClasses, color: "text-cyan-600 bg-cyan-50" },
        ].map((item, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? <Skeleton className="h-5 w-8" /> : item.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══════════════════════════════ */}
      {/*  📅 月度课程日历               */}
      {/* ═══════════════════════════════ */}
      <MonthCalendar schedules={schedules} loading={schedLoading} />

      {/* ═══════════════════════════════ */}
      {/* 班级总览 + 公告               */}
      {/* ═══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 班级总览 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              <CardTitle>班级总览</CardTitle>
            </div>
            <CardDescription>所有班级及当前状态</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <School className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>暂无班级数据</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {classes.slice(0, 10).map((cls: any) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{cls.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {cls.expand?.teacher_id?.name || "未分配"}{cls.room ? ` · ${cls.room}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {cls.current_students}/{cls.max_capacity}
                      </Badge>
                      <Badge variant="secondary" className={`text-xs ${
                        cls.current_students >= cls.max_capacity ? "bg-red-100 text-red-700" :
                        cls.current_students > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {cls.current_students >= cls.max_capacity ? "满员" :
                         cls.current_students > 0 ? "进行中" : "空置"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最新公告 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>最新公告</CardTitle>
            </div>
            <CardDescription>通知与动态</CardDescription>
          </CardHeader>
          <CardContent>
            {announceLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>暂无公告</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {announcements.slice(0, 8).map((a: any) => (
                  <div key={a.id} className="flex gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 mt-1"><div className="w-2 h-2 rounded-full bg-primary" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{a.content || a.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {a.created ? new Date(a.created).toLocaleDateString("zh-CN") : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
