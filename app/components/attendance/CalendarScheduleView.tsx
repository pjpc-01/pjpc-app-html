"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns"
import { useLanguage } from "@/contexts/language-context"
import { gradeLabel } from "@/lib/grades"
import { zhCN } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, CalendarDays, Trash2, Plus, CalendarX2, Pencil } from "lucide-react"

interface ScheduleEvent {
  id: string
  teacher_name: string
  teacher_id: string
  date: string
  start_time: string
  end_time: string
  status: string
  center?: string
  room?: string
  schedule_type?: string
  course_name?: string
  day_of_week?: string
}

interface Course {
  id: string
  title: string
  teacher_id?: string
  teacher_name?: string
  subject?: string
  grade_level?: string
}

interface Teacher {
  id: string
  name: string
  teacher_name?: string
  center?: string
}

interface Holiday {
  id: string
  date: string
  name: string
  name_zh?: string
  region?: string
}

interface LeaveRecord {
  id: string
  teacher_id: string
  leave_type: string
  start_date: string
  end_date: string
  status: string
  teacher_name?: string
  expand?: { teacher_id?: { name?: string } }
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

const LEAVE_TYPE_ZH: Record<string, string> = {
  annual: "年假",
  sick: "病假",
  emergency: "事假",
  maternity: "产假",
  paternity: "陪产假",
  unpaid: "无薪假",
}

export default function CalendarScheduleView({
  month,
  onMonthChange,
}: {
  month?: Date
  onMonthChange?: (m: Date) => void
}) {
  const { t } = useLanguage()
  const [currentMonth, setCurrentMonth] = useState(month || new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [holidayOpen, setHolidayOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [form, setForm] = useState({ courseId: '', teacherId: '', start: '', end: '' })
  const [holidayForm, setHolidayForm] = useState({ date: '', name_zh: '', region: 'selangor' })

  useEffect(() => {
    fetchSchedules()
    fetchHolidaysAndLeaves()
  }, [currentMonth])

  // Load available courses + teachers for the add dialog
  useEffect(() => {
    ;(async () => {
      try {
        const cres = await fetch('/api/courses')
        const cdata = await cres.json()
        const items = cdata?.data?.items || cdata?.items || []
        setCourses(items)
      } catch {}
      try {
        const tres = await fetch('/api/teachers?limit=200')
        const tdata = await tres.json()
        const tlist = tdata?.data || tdata?.items || []
        setTeachers(tlist)
      } catch {}
    })()
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      const filterStart = format(monthStart, "yyyy-MM-dd")
      const filterEnd = format(monthEnd, "yyyy-MM-dd")

      const res = await fetch(
        `/api/pocketbase-proxy/api/collections/schedules/records?filter=(date>%3D'${filterStart}'%26%26date<%3D'${filterEnd}')&sort=date,start_time&perPage=200`
      )
      const data = await res.json()

      // Build course_id -> title map (course_id is plain TEXT field, expand won't work)
      let courseMap: Record<string, string> = {}
      try {
        const cres = await fetch('/api/courses')
        const cdata = await cres.json()
        const items = cdata?.data?.items || cdata?.items || []
        items.forEach((c: any) => { if (c.id && c.title) courseMap[c.id] = c.title })
      } catch {}

      const mapped = (data?.items || []).map((evt: any) => ({
        ...evt,
        course_name: courseMap[evt.course_id] || evt.course_name || '',
      }))
      setEvents(mapped)
    } catch (err) {
      console.error("Failed to fetch schedules", err)
    } finally {
      setLoading(false)
    }
  }

  // 拉取本月公假 + 已批准教师请假
  const fetchHolidaysAndLeaves = async () => {
    const filterStart = format(startOfMonth(currentMonth), "yyyy-MM-dd")
    const filterEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd")

    // 公假
    try {
      const filter = encodeURIComponent(`date>="${filterStart}" && date<="${filterEnd}"`)
      const res = await fetch(
        `/api/pocketbase-proxy/api/collections/public_holidays/records?filter=${filter}&sort=date&perPage=200`
      )
      const data = await res.json()
      setHolidays(data?.items || [])
    } catch (err) {
      console.error("Failed to fetch holidays", err)
      setHolidays([])
    }

    // 已批准请假（拉全部 approved，再按与本月重叠过滤）
    try {
      const res = await fetch('/api/teacher-leave?status=approved&limit=500')
      const data = await res.json()
      const items: LeaveRecord[] = data?.data || []
      const ms = filterStart
      const me = filterEnd
      const inRange = items.filter((l) => {
        const s = (l.start_date || '').split(' ')[0]
        const e = (l.end_date || '').split(' ')[0]
        return s && e && s <= me && e >= ms
      })
      setLeaves(inRange)
    } catch (err) {
      console.error("Failed to fetch leaves", err)
      setLeaves([])
    }
  }

  // 删除单条排班
  const handleDelete = async (evt: ScheduleEvent) => {
    if (!window.confirm(`确定删除这条排班吗？\n${evt.date?.split(' ')[0]} ${evt.start_time}-${evt.end_time} ${evt.teacher_name || evt.course_name || ''}`)) return
    setDeletingId(evt.id)
    try {
      const res = await fetch(`/api/pocketbase-proxy/api/collections/schedules/records/${evt.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        window.alert(d?.error || '删除失败，请重试')
        return
      }
      setEvents((prev) => prev.filter((e) => e.id !== evt.id))
    } catch (err) {
      console.error('删除排班失败', err)
      window.alert('删除失败，请重试')
    } finally {
      setDeletingId(null)
    }
  }

  // 添加排班（指定日期 + 课程管理里的课程 + 老师 + 时间段）;编辑时复用
  const handleAddSchedule = async () => {
    if (!selectedDate || !form.courseId || !form.teacherId || !form.start || !form.end) {
      window.alert('请选择课程、老师并填写时间')
      return
    }
    setSaving(true)
    try {
      const isEdit = !!editingEvent
      const course = courses.find(c => c.id === form.courseId)
      const teacher = teachers.find(t => t.id === form.teacherId)
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const body = {
        teacher_id: form.teacherId,
        teacher_name: (teacher?.name || teacher?.teacher_name || '').trim(),
        course_id: course?.id || '',
        class_id: course?.id || '',
        date: dateStr,
        start_time: form.start,
        end_time: form.end,
        schedule_type: editingEvent?.schedule_type || 'course_schedule',
        status: editingEvent?.status || 'scheduled',
        course_title: course?.title || editingEvent?.course_name || '',
        course_subject: course?.subject || '',
        course_grade: course?.grade_level || '',
        center: teacher?.center || editingEvent?.center || '',
        day_of_week: editingEvent?.day_of_week || '', // 具体日期排班，非时间表模板
      }
      const url = isEdit
        ? `/api/pocketbase-proxy/api/collections/schedules/records/${editingEvent!.id}`
        : '/api/pocketbase-proxy/api/collections/schedules/records'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => ({}))
      if (!d?.id) {
        window.alert(d?.message || (isEdit ? '保存失败，请重试' : '添加失败，请重试'))
        return
      }
      setAddOpen(false)
      setEditingEvent(null)
      setForm({ courseId: '', teacherId: '', start: '', end: '' })
      await fetchSchedules()
      await fetchHolidaysAndLeaves()
    } catch (err) {
      console.error('保存排班失败', err)
      window.alert('保存排班失败: ' + ((err as Error).message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  // 打开编辑对话框（预填当前排班）
  const openEdit = (evt: ScheduleEvent) => {
    setEditingEvent(evt)
    setForm({
      courseId: (evt as any).course_id || '',
      teacherId: evt.teacher_id || '',
      start: evt.start_time || '',
      end: evt.end_time || '',
    })
  }

  // 选课程时自动带出该课程的老师（若课程有指定老师）
  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    setForm((f) => ({ ...f, courseId, teacherId: course?.teacher_id || f.teacherId }))
  }

  // 新增公假
  const handleAddHoliday = async () => {
    if (!holidayForm.date || !holidayForm.name_zh) {
      window.alert('请填写日期和名称')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/pocketbase-proxy/api/collections/public_holidays/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: holidayForm.date, name: holidayForm.name_zh, name_zh: holidayForm.name_zh, region: holidayForm.region }),
      })
      const d = await res.json().catch(() => ({}))
      if (!d?.id) {
        window.alert(d?.message || '添加失败')
        return
      }
      setHolidayForm({ date: '', name_zh: '', region: 'selangor' })
      await fetchHolidaysAndLeaves()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    if (!window.confirm('删除这条公假？')) return
    try {
      await fetch(`/api/pocketbase-proxy/api/collections/public_holidays/records/${id}`, { method: 'DELETE' })
      await fetchHolidaysAndLeaves()
    } catch (err) {
      console.error('删除公假失败', err)
    }
  }

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days: Date[] = []
    let day = calStart
    while (day <= calEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    events.forEach((evt) => {
      const key = (evt.date || '').split(' ')[0]  // 切成 yyyy-MM-dd，与日历格 format 匹配
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(evt)
    })
    return map
  }, [events])

  // 公假：date -> holiday
  const holidayByDate = useMemo(() => {
    const map = new Map<string, Holiday>()
    holidays.forEach((h) => {
      const key = (h.date || '').split(' ')[0]
      if (key) map.set(key, h)
    })
    return map
  }, [holidays])

  // 已批准请假：date -> leave[]（按日期范围展开，并裁到当月）
  const leavesByDate = useMemo(() => {
    const map = new Map<string, LeaveRecord[]>()
    const clampStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const clampEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    leaves.forEach((l) => {
      let s = (l.start_date || '').split(' ')[0]
      let e = (l.end_date || '').split(' ')[0]
      if (!s || !e) return
      if (s < clampStart) s = clampStart
      if (e > clampEnd) e = clampEnd
      let cur = s
      let guard = 0
      while (cur <= e && guard < 400) {
        if (!map.has(cur)) map.set(cur, [])
        const arr = map.get(cur)!
        // 同一天同一老师只显示一条（避免同老师重叠请假记录重复展示）
        if (!arr.some((ex) => ex.teacher_id === l.teacher_id && ex.leave_type === l.leave_type)) {
          arr.push(l)
        }
        const d = new Date(cur + 'T00:00:00')
        d.setDate(d.getDate() + 1)
        cur = format(d, 'yyyy-MM-dd')
        guard++
      }
    })
    return map
  }, [leaves, currentMonth])

  const leaveTeacherName = (l: LeaveRecord) => {
    const exp = l.expand?.teacher_id
    const name = Array.isArray(exp) ? (exp[0]?.name || '') : (exp?.name || '')
    return (name || l.teacher_name || '').trim() || '未知教师'
  }

  // teacher_id -> 名字反查(排班记录 teacher_name 为空时用)
  const teacherById = useMemo(() => {
    const map = new Map<string, string>()
    teachers.forEach((t) => {
      if (t.id) map.set(t.id, (t.name || t.teacher_name || '').trim())
    })
    return map
  }, [teachers])

  const displayEventName = (evt: ScheduleEvent) =>
    (evt.teacher_name || '').trim() ||
    teacherById.get(evt.teacher_id) ||
    (evt.course_name || '').trim() ||
    '未填'

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  const selectedDateEvents = selectedDate ? eventsByDate.get(selectedDateKey) || [] : []
  const selectedHoliday = selectedDate ? holidayByDate.get(selectedDateKey) : undefined
  const selectedLeaves = selectedDate ? leavesByDate.get(selectedDateKey) || [] : []

  const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

  return (
    <div className="flex flex-col lg:flex-row items-start gap-4">
      {/* Month Calendar (left) */}
      <div className="flex-1 min-w-0">
        <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => {
              const nm = subMonths(currentMonth, 1)
              setCurrentMonth(nm)
              onMonthChange?.(nm)
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {format(currentMonth, "yyyy 年 M 月", { locale: zhCN })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setHolidayOpen(true)} className="gap-1">
                <CalendarX2 className="h-3.5 w-3.5" />公假管理
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const nm = addMonths(currentMonth, 1)
                setCurrentMonth(nm)
                onMonthChange?.(nm)
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden mb-px">
            {weekDays.map((dayName) => (
              <div key={dayName} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const dayEvents = eventsByDate.get(dateKey) || []
              const holiday = holidayByDate.get(dateKey)
              const dayLeaves = leavesByDate.get(dateKey) || []
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] p-1 text-left align-top transition-colors ${
                    holiday
                      ? (isCurrentMonth ? "bg-rose-50" : "bg-rose-50/50")
                      : (isCurrentMonth ? "bg-white" : "bg-gray-50")
                  } ${
                    isSelected
                      ? "ring-2 ring-indigo-500 z-10"
                      : ""
                  } hover:bg-blue-50 cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-xs font-medium p-0.5 ${
                      isToday(day) ? "bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""
                    } ${!isCurrentMonth ? "text-gray-400" : ""}`}>
                      {format(day, "d")}
                    </div>
                  </div>

                  {/* 公假 */}
                  {holiday && (
                    <div className="mt-0.5 text-[10px] leading-tight px-1 py-0.5 rounded bg-rose-500 text-white font-medium truncate"
                      title={`公假：${holiday.name_zh || holiday.name}`}>
                      🎌 {holiday.name_zh || holiday.name}
                    </div>
                  )}

                  {/* 已批请假：谁休 */}
                  {dayLeaves.slice(0, 2).map((l) => (
                    <div key={l.id} className="text-[10px] leading-tight px-1 py-0.5 rounded mt-0.5 border bg-purple-100 text-purple-800 border-purple-200 truncate"
                      title={`${leaveTeacherName(l)} 请假(${LEAVE_TYPE_ZH[l.leave_type] || l.leave_type})`}>
                      🏖 {leaveTeacherName(l)}
                    </div>
                  ))}
                  {dayLeaves.length > 2 && (
                    <div className="text-[10px] text-purple-700 font-medium px-1">
                      +{dayLeaves.length - 2} 人请假
                    </div>
                  )}

                  {dayEvents.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate mt-0.5 border ${
                        statusColors[evt.status] || "bg-gray-50"
                      }`}
                      title={`${displayEventName(evt)} ${evt.start_time}-${evt.end_time}${evt.course_name ? ' · ' + evt.course_name : ''}`}
                    >
                      {evt.start_time} {displayEventName(evt)}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-indigo-600 font-medium px-1">
                      +{dayEvents.length - 3} 更多
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500 inline-block" />公假（不排课）</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-300 inline-block" />已批请假</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 inline-block" />已排班</span>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Selected date events (right panel) */}
      {selectedDate && (
        <div className="lg:w-80 shrink-0 lg:border-l lg:border-gray-200 lg:pl-4 mt-4 lg:mt-0">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-base">
                {format(selectedDate, "M 月 d 日 EEEE", { locale: zhCN })}
                {isToday(selectedDate) && <Badge className="ml-2">{t('attendance.today')}</Badge>}
              </CardTitle>
              <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1 h-8">
                <Plus className="h-3.5 w-3.5" />添加排班
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* 公假提示 */}
            {selectedHoliday && (
              <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                🎌 公假：{selectedHoliday.name_zh || selectedHoliday.name}
                <div className="text-xs text-rose-500 mt-0.5">当天不排课</div>
              </div>
            )}

            {/* 已批请假 */}
            {selectedLeaves.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-purple-700 mb-1">请假教师（已批准）</div>
                <div className="space-y-1">
                  {selectedLeaves.map((l) => (
                    <div key={l.id} className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      🏖 {leaveTeacherName(l)} · {LEAVE_TYPE_ZH[l.leave_type] || l.leave_type}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {selectedHoliday ? '公假无排课' : '当天无排课'}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-center">
                        <div className="text-sm font-medium">{evt.start_time}</div>
                        <div className="text-xs text-muted-foreground">{evt.end_time}</div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{evt.course_name || displayEventName(evt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {evt.teacher_name && evt.course_name && `${displayEventName(evt)} · `}
                          {evt.room && `${evt.room}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => openEdit(evt)}
                      title="编辑排班"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(evt)}
                      disabled={deletingId === evt.id}
                      title="删除排班"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {/* Add / Edit schedule dialog */}
      <Dialog open={addOpen || !!editingEvent} onOpenChange={(o) => {
        setAddOpen(o)
        if (!o) setEditingEvent(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> {editingEvent ? "编辑排班" : "添加排班"}
              {selectedDate && <span className="text-sm font-normal text-gray-500">· {format(selectedDate, "yyyy-MM-dd")}</span>}
            </DialogTitle>
            <DialogDescription>{editingEvent ? "修改课程、老师或时间段" : "从课程管理选择课程，添加到选中日期"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">课程</Label>
              <Select value={form.courseId} onValueChange={handleCourseChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="选择课程" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}{c.grade_level ? ` · ${gradeLabel(c.grade_level)}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">老师</Label>
              <Select value={form.teacherId} onValueChange={(v) => setForm((f) => ({ ...f, teacherId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="选择老师" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{(t.name || t.teacher_name || '').trim()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">开始时间</Label>
                <Input type="time" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">结束时间</Label>
                <Input type="time" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditingEvent(null) }} disabled={saving}>取消</Button>
            <Button onClick={handleAddSchedule} disabled={saving || !form.courseId || !form.teacherId || !form.start || !form.end}>
              {saving ? '保存中...' : (editingEvent ? '保存' : '添加')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Holiday management dialog */}
      <Dialog open={holidayOpen} onOpenChange={setHolidayOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarX2 className="h-4 w-4" /> 公假管理
            </DialogTitle>
            <DialogDescription>
              {format(currentMonth, "yyyy 年 M 月", { locale: zhCN })} 的公假（公假当天自动不排课）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* 本月公假列表 */}
            <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
              {holidays.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">本月暂无公假</p>
              ) : (
                holidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{(h.date || '').split(' ')[0]}</span>
                      <span className="ml-2">{h.name_zh || h.name}</span>
                      {h.region && <Badge variant="outline" className="ml-2 text-[10px]">{h.region === 'federal' ? '联邦' : '雪州'}</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600"
                      onClick={() => handleDeleteHoliday(h.id)} title="删除">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* 新增公假 */}
            <div className="grid grid-cols-12 gap-2 items-end border-t pt-3">
              <div className="col-span-4">
                <Label className="text-xs">日期</Label>
                <Input type="date" value={holidayForm.date} onChange={(e) => setHolidayForm((f) => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
              <div className="col-span-5">
                <Label className="text-xs">名称</Label>
                <Input value={holidayForm.name_zh} placeholder="如：学校假期 / 雪州苏丹诞辰"
                  onChange={(e) => setHolidayForm((f) => ({ ...f, name_zh: e.target.value }))} className="mt-1" />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">类别</Label>
                <Select value={holidayForm.region} onValueChange={(v) => setHolidayForm((f) => ({ ...f, region: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">联邦</SelectItem>
                    <SelectItem value="selangor">雪州</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 flex justify-end">
                <Button size="sm" onClick={handleAddHoliday} disabled={saving || !holidayForm.date || !holidayForm.name_zh} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />添加公假
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
