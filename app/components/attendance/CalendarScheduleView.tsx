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
import { zhCN } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, CalendarDays, Trash2, Plus } from "lucide-react"

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

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
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
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [form, setForm] = useState({ courseId: '', teacherId: '', start: '', end: '' })

  useEffect(() => {
    fetchSchedules()
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

  // 添加排班（指定日期 + 课程管理里的课程 + 老师 + 时间段）
  const handleAddSchedule = async () => {
    if (!selectedDate || !form.courseId || !form.teacherId || !form.start || !form.end) {
      window.alert('请选择课程、老师并填写时间')
      return
    }
    setSaving(true)
    try {
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
        schedule_type: 'course_schedule',
        status: 'scheduled',
        course_title: course?.title || '',
        course_subject: course?.subject || '',
        course_grade: course?.grade_level || '',
        center: teacher?.center || '',
        day_of_week: '', // 具体日期排班，非时间表模板
      }
      const res = await fetch('/api/pocketbase-proxy/api/collections/schedules/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => ({}))
      if (!d?.id) {
        window.alert(d?.message || '添加失败，请重试')
        return
      }
      setAddOpen(false)
      setForm({ courseId: '', teacherId: '', start: '', end: '' })
      await fetchSchedules()
    } catch (err) {
      console.error('添加排班失败', err)
      window.alert('添加排班失败: ' + ((err as Error).message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  // 选课程时自动带出该课程的老师（若课程有指定老师）
  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    setForm((f) => ({ ...f, courseId, teacherId: course?.teacher_id || f.teacherId }))
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

  const selectedDateEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) || []
    : []

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
            <Button variant="outline" size="sm" onClick={() => {
              const nm = addMonths(currentMonth, 1)
              setCurrentMonth(nm)
              onMonthChange?.(nm)
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
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
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] p-1 text-left transition-colors ${
                    isCurrentMonth ? "bg-white" : "bg-gray-50"
                  } ${
                    isSelected
                      ? "ring-2 ring-indigo-500 z-10"
                      : ""
                  } hover:bg-blue-50 cursor-pointer`}
                >
                  <div className={`text-xs font-medium p-0.5 ${
                    isToday(day) ? "bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""
                  } ${!isCurrentMonth ? "text-gray-400" : ""}`}>
                    {format(day, "d")}
                  </div>
                  {dayEvents.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate mt-0.5 border ${
                        statusColors[evt.status] || "bg-gray-50"
                      }`}
                      title={`${evt.teacher_name} ${evt.start_time}-${evt.end_time}${evt.course_name ? ' · ' + evt.course_name : ''}`}
                    >
                      {evt.start_time} {evt.teacher_name}
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
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">当天无排课</p>
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
                        <div className="font-medium text-sm">{evt.course_name || evt.teacher_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {evt.teacher_name && evt.course_name && `${evt.teacher_name} · `}
                          {evt.room && `${evt.room}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant={evt.status === "confirmed" ? "default" : "secondary"}>
                      {evt.status === "scheduled" ? "已排班" : evt.status === "confirmed" ? "已确认" : evt.status === "completed" ? "已完成" : evt.status}
                    </Badge>
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

      {/* Add schedule dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> 添加排班
              {selectedDate && <span className="text-sm font-normal text-gray-500">· {format(selectedDate, "yyyy-MM-dd")}</span>}
            </DialogTitle>
            <DialogDescription>从课程管理选择课程，添加到选中日期</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">课程</Label>
              <Select value={form.courseId} onValueChange={handleCourseChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="选择课程" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}{c.grade_level ? ` · ${c.grade_level}` : ''}
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
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>取消</Button>
            <Button onClick={handleAddSchedule} disabled={saving || !form.courseId || !form.teacherId || !form.start || !form.end}>
              {saving ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
