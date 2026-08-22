"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from "@/contexts/language-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  Trash2,
  Loader2,
  AlertCircle,
  Plus,
  X,
  UserCheck,
  GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ============================================================
// 类型定义
// ============================================================

interface Course {
  id: string
  title: string
  subject: string
  grade_level?: string
  duration?: number // 分钟
  status?: string
}

interface Teacher {
  id: string
  name: string
}

/** 课程排课记录 — 映射到 PB schedules 集合 */
interface CourseScheduleEntry {
  id: string
  course_id: string
  teacher_id: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  course_title?: string
  teacher_name?: string
  course_subject?: string
  course_grade?: string
}

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: '周一',
  Tue: '周二',
  Wed: '周三',
  Thu: '周四',
  Fri: '周五',
}

interface TimeSlot {
  id: string
  start: string
  end: string
}

// ============================================================
// PB Proxy 工具函数
// ============================================================

const PROXY_BASE = '/api/pocketbase-proxy/api/collections/schedules/records'

async function pbRequest(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PB API Error (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ============================================================
// 时间工具
// ============================================================

/** 时间字符串 + 分钟数 → 新时间字符串 (HH:mm) */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60)
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function getTimeOptions() {
  const options: string[] = []
  for (let h = 7; h <= 19; h++) {
    for (const m of ['00', '15', '30', '45']) {
      const t = `${String(h).padStart(2, '0')}:${m}`
      options.push(t)
    }
  }
  return options
}

// ============================================================
// 排课管理主组件
// ============================================================

export default function CourseScheduling() {
  const { t } = useLanguage()
  // 数据状态
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [scheduleEntries, setScheduleEntries] = useState<CourseScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 自定义时间段集合 (可增删)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: 's1', start: '08:00', end: '09:30' },
    { id: 's2', start: '09:30', end: '11:00' },
    { id: 's3', start: '11:00', end: '12:30' },
    { id: 's4', start: '14:00', end: '15:30' },
    { id: 's5', start: '15:30', end: '17:00' },
  ])

  // 新增时间段输入
  const [newSlotStart, setNewSlotStart] = useState('08:00')
  const [newSlotEnd, setNewSlotEnd] = useState('08:45')

  // 年级筛选
  const [gradeFilter, setGradeFilter] = useState('all')

  // 弹窗状态
  const [assignCourseDialog, setAssignCourseDialog] = useState(false)
  const [targetDay, setTargetDay] = useState<DayOfWeek>('Mon')
  const [targetSlot, setTargetSlot] = useState<TimeSlot | null>(null)
  const [assignCourseId, setAssignCourseId] = useState('')
  const [assignStartTime, setAssignStartTime] = useState('08:00')
  const assignEndTime = (() => {
    const course = courses.find(c => c.id === assignCourseId)
    const dur = course?.duration || 60
    return addMinutes(assignStartTime, dur)
  })()

  // 选老师弹窗
  const [assignTeacherDialog, setAssignTeacherDialog] = useState(false)
  const [targetEntry, setTargetEntry] = useState<CourseScheduleEntry | null>(null)
  const [assignTeacherId, setAssignTeacherId] = useState('')

  // ============================================================
  // 数据加载
  // ============================================================

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [coursesRes, teachersRes, schedulesRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/teachers?limit=200'),
        pbRequest(`${PROXY_BASE}?filter=(schedule_type="course_schedule")&sort=start_time&perPage=200`),
      ])

      const coursesData = await coursesRes.json()
      let courseList: Course[] = []
      if (coursesData.success && Array.isArray(coursesData.data?.items)) {
        courseList = coursesData.data.items
      } else if (Array.isArray(coursesData.items)) {
        courseList = coursesData.items
      } else if (Array.isArray(coursesData)) {
        courseList = coursesData
      }
      setCourses(courseList.filter((c: Course) => c.status !== 'archived') || [])

      const teachersData = await teachersRes.json()
      let teacherList: Teacher[] = []
      if (teachersData.success && Array.isArray(teachersData.data)) {
        teacherList = teachersData.data.map((tt: any) => ({
          id: tt.id,
          name: tt.name || tt.teacher_name || '',
        }))
      } else if (Array.isArray(teachersData)) {
        teacherList = teachersData.map((tt: any) => ({
          id: tt.id,
          name: tt.name || '',
        }))
      }
      setTeachers(teacherList.filter((tt: Teacher) => tt.name) || [])

      const pbsItems = schedulesRes?.items || []
      const entries: CourseScheduleEntry[] = pbsItems.map((item: any) => ({
        id: item.id,
        course_id: item.course_id || item.class_id || '',
        teacher_id: item.teacher_id || '',
        day_of_week: (item.day_of_week || getDayFromDate(item.date) || 'Mon') as DayOfWeek,
        start_time: item.start_time || '',
        end_time: item.end_time || '',
        course_title: item.course_title || '',
        teacher_name: item.teacher_name || '',
        course_subject: item.course_subject || '',
        course_grade: item.course_grade || '',
      }))
      setScheduleEntries(entries)
    } catch (err) {
      console.error('加载排课数据失败:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function getDayFromDate(dateStr: string): DayOfWeek | null {
    if (!dateStr) return null
    try {
      const d = new Date(dateStr)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const day = days[d.getDay()]
      return DAYS.includes(day as DayOfWeek) ? (day as DayOfWeek) : null
    } catch {
      return null
    }
  }

  // ============================================================
  // 查找名称
  // ============================================================

  const courseMap = new Map(courses.map(c => [c.id, c]))
  const teacherMap = new Map(teachers.map(tt => [tt.id, tt]))

  // 年级选项（从课程提取）
  const gradeOptions = Array.from(
    new Set(courses.map(c => c.grade_level).filter(Boolean))
  ) as string[]

  // 数据加载后若无有效年级（或仍在 all），自动选中第一个年级
  useEffect(() => {
    if (gradeFilter === 'all' && gradeOptions.length > 0) {
      setGradeFilter(gradeOptions[0])
    }
  }, [gradeOptions, gradeFilter])

  // 按年级过滤的课程
  const filteredCourses = gradeFilter === 'all'
    ? courses
    : courses.filter(c => c.grade_level === gradeFilter)

  // 按年级过滤的排课条目（网格 + 统计 + 列表共用）
  // 用 courseMap 的 grade_level 做源头归一化（不依赖 POST 写入的 course_grade 快照）
  const filteredEntries = gradeFilter === 'all'
    ? scheduleEntries
    : scheduleEntries.filter(e => (courseMap.get(e.course_id)?.grade_level || e.course_grade) === gradeFilter)

  function getCourseTitle(courseId: string): string {
    return courseMap.get(courseId)?.title || courseId.slice(0, 8)
  }
  function getCourseSubject(courseId: string): string {
    return courseMap.get(courseId)?.subject || ''
  }
  function getCourseGrade(courseId: string): string {
    return courseMap.get(courseId)?.grade_level || ''
  }
  function getTeacherName(teacherId: string): string {
    return teacherMap.get(teacherId)?.name || teacherId.slice(0, 8)
  }

  // ============================================================
  // 时间段增删
  // ============================================================

  function handleAddTimeSlot() {
    if (!newSlotStart || !newSlotEnd) {
      toast.error('请填写开始和结束时间')
      return
    }
    if (newSlotStart >= newSlotEnd) {
      toast.error('结束时间必须晚于开始时间')
      return
    }
    setTimeSlots(prev => [...prev, {
      id: `s-${Date.now()}`,
      start: newSlotStart,
      end: newSlotEnd,
    }])
  }

  function handleRemoveTimeSlot(id: string) {
    // 检查该时间段是否已有排课
    const slot = timeSlots.find(s => s.id === id)
    if (slot) {
      const used = scheduleEntries.some(e => e.start_time === slot.start && e.end_time === slot.end)
      if (used) {
        toast.error('该时间段已有排课，无法删除')
        return
      }
    }
    setTimeSlots(prev => prev.filter(s => s.id !== id))
  }

  // ============================================================
  // 排课 CRUD
  // ============================================================

  /** 第一步：点空格 → 选课程 + 开始时间 → 自动算结束 */
  function openAssignCourse(day: DayOfWeek, slot: TimeSlot) {
    setTargetDay(day)
    setTargetSlot(slot)
    setAssignCourseId('')
    setAssignStartTime(slot.start)
    setAssignCourseDialog(true)
  }

  async function handleAssignCourse() {
    if (!targetDay || !targetSlot) return
    if (!assignCourseId) {
      toast.error('请选择课程')
      return
    }
    // 冲突检查：同一天同一时间（时间段重叠）——仅限当前筛选年级内判断
    // 不同年级的课表相互独立，同时间可并存
    const start = assignStartTime
    const end = assignEndTime
    const conflict = filteredEntries.find(e => {
      if (e.day_of_week !== targetDay) return false
      // 时间段重叠判断
      return start < e.end_time && e.start_time < end
    })
    if (conflict) {
      toast.error('该时间段已被占用')
      return
    }

    try {
      const course = courseMap.get(assignCourseId)
      await pbRequest(PROXY_BASE, {
        method: 'POST',
        body: JSON.stringify({
          course_id: assignCourseId,
          teacher_id: '', // 课程先行，老师后面再排
          day_of_week: targetDay,
          date: '2026-01-05',
          start_time: start,
          end_time: end,
          schedule_type: 'course_schedule',
          status: 'scheduled',
          center: '',
          course_title: course?.title || '',
          teacher_name: '',
          course_subject: course?.subject || '',
          course_grade: course?.grade_level || '',
          class_id: assignCourseId,
          notes: targetDay,
        }),
      })
      toast.success('课程已放入时间表')
      setAssignCourseDialog(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建排课失败')
    }
  }

  /** 第二步：点已放课程的格子 → 选老师 */
  function openAssignTeacher(entry: CourseScheduleEntry) {
    setTargetEntry(entry)
    setAssignTeacherId(entry.teacher_id || '')
    setAssignTeacherDialog(true)
  }

  async function handleAssignTeacher() {
    if (!targetEntry) return
    if (!assignTeacherId) {
      toast.error('请选择教师')
      return
    }
    try {
      const teacher = teacherMap.get(assignTeacherId)
      await pbRequest(`${PROXY_BASE}/${targetEntry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          teacher_id: assignTeacherId,
          teacher_name: teacher?.name || '',
        }),
      })
      toast.success('已指定教师')
      setAssignTeacherDialog(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '指定教师失败')
    }
  }

  async function handleDelete(entry: CourseScheduleEntry) {
    try {
      await pbRequest(`${PROXY_BASE}/${entry.id}`, { method: 'DELETE' })
      toast.success('排课已删除')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除排课失败')
    }
  }

  // ============================================================
  // 网格构建
  // ============================================================

  function getEntry(day: DayOfWeek, start: string, end: string): CourseScheduleEntry | undefined {
    return filteredEntries.find(
      e => e.day_of_week === day && e.start_time === start && e.end_time === end
    )
  }

  function hasCourseInSlot(day: DayOfWeek, start: string, end: string): boolean {
    return filteredEntries.some(e =>
      e.day_of_week === day &&
      start < e.end_time && e.start_time < end
    )
  }

  // ============================================================
  // 颜色
  // ============================================================

  const SUBJECT_COLORS: Record<string, string> = {
    '华文': 'bg-red-50 border-red-200 text-red-700',
    '国文': 'bg-orange-50 border-orange-200 text-orange-700',
    '英文': 'bg-blue-50 border-blue-200 text-blue-700',
    '数学': 'bg-green-50 border-green-200 text-green-700',
    '科学': 'bg-cyan-50 border-cyan-200 text-cyan-700',
    '历史': 'bg-amber-50 border-amber-200 text-amber-700',
    '地理': 'bg-emerald-50 border-emerald-200 text-emerald-700',
    '道德': 'bg-purple-50 border-purple-200 text-purple-700',
    '美术': 'bg-pink-50 border-pink-200 text-pink-700',
    '音乐': 'bg-indigo-50 border-indigo-200 text-indigo-700',
    '体育': 'bg-lime-50 border-lime-200 text-lime-700',
  }

  function getSubjectColor(subject: string): string {
    return SUBJECT_COLORS[subject] || 'bg-gray-50 border-gray-200 text-gray-700'
  }

  // ============================================================
  // 渲染
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-gray-500 text-sm">加载排课数据...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
          <p className="text-red-700 font-medium mb-1">{t('course.load_failed')}</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={loadData}>{t('course.retry')}</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          排课管理
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          先把课程放入时间表（选课程 + 开始时间，自动算结束），再为每个时段指定教师
        </p>
      </div>

      {/* 统计 + 年级筛选 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 gap-1">
            <BookOpen className="h-3 w-3" />
            {filteredCourses.length} 课程
          </Badge>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 gap-1">
            <Users className="h-3 w-3" />
            {teachers.length} 教师
          </Badge>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 gap-1">
            <Clock className="h-3 w-3" />
            {filteredEntries.length} 排课
          </Badge>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 gap-1">
            {DAYS.filter(d => filteredEntries.some(e => e.day_of_week === d)).length}/5 天
          </Badge>
        </div>

        {/* 年级筛选（排课表按当前年级编辑，无"全部"选项） */}
        <div className="flex items-center gap-2 ml-auto">
          <GraduationCap className="h-4 w-4 text-gray-400" />
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="选择年级" />
            </SelectTrigger>
            <SelectContent>
              {gradeOptions.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
              {gradeOptions.length === 0 && (
                <SelectItem value="all" disabled>暂无年级</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 时间段管理（可增删） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            时间段管理
          </CardTitle>
          <CardDescription>添加或删除时间表上的时间段（网格行）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div>
                <Label className="text-[10px] text-gray-500 block mb-1">开始</Label>
                <select
                  value={newSlotStart}
                  onChange={e => setNewSlotStart(e.target.value)}
                  className="h-8 text-xs border rounded px-2"
                >
                  {getTimeOptions().map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <span className="text-gray-400 text-xs mt-4">—</span>
              <div>
                <Label className="text-[10px] text-gray-500 block mb-1">结束</Label>
                <select
                  value={newSlotEnd}
                  onChange={e => setNewSlotEnd(e.target.value)}
                  className="h-8 text-xs border rounded px-2"
                >
                  {getTimeOptions().map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleAddTimeSlot}
            >
              <Plus className="h-3 w-3 mr-1" />
              添加时间段
            </Button>
          </div>

          {/* 现有时段 */}
          <div className="flex flex-wrap gap-2">
            {timeSlots.map(slot => (
              <div
                key={slot.id}
                className="flex items-center gap-1.5 bg-slate-50 border rounded-full px-3 py-1 text-xs"
              >
                <Clock className="h-3 w-3 text-indigo-500" />
                <span className="font-medium">{slot.start} - {slot.end}</span>
                <button
                  className="text-red-400 hover:text-red-600 ml-1"
                  onClick={() => handleRemoveTimeSlot(slot.id)}
                  title="删除时间段"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 每周课程表网格 — 行=时间段（左竖排），列=星期（顶横排） */}
      <div className="grid gap-px bg-gray-200 rounded-lg overflow-hidden min-w-[680px]">
        {/* 表头行：左列标题 + 星期横排 */}
        <div
          className="grid items-stretch"
          style={{ gridTemplateColumns: `110px repeat(${DAYS.length}, minmax(140px, 1fr))`, minWidth: 680 }}
        >
          <div className="bg-gray-100 p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            时间段
          </div>
          {DAYS.map(day => (
            <div key={`h-${day}`} className="bg-gray-100 p-3 text-center font-semibold text-gray-700">
              <div>{DAY_LABELS[day]}</div>
              <div className="text-xs text-gray-400 font-normal mt-0.5">
                {filteredEntries.filter(e => e.day_of_week === day).length} 节
              </div>
            </div>
          ))}
        </div>

        {/* 每行一个时间段 */}
        {timeSlots.map(slot => (
          <div
            key={`row-${slot.id}`}
            className="grid items-stretch"
            style={{ gridTemplateColumns: `110px repeat(${DAYS.length}, minmax(140px, 1fr))`, minWidth: 680 }}
          >
            {/* 时间段列（左竖排） */}
            <div className="bg-white p-2 text-xs text-gray-500 font-medium flex items-center justify-center border-r border-gray-100">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {slot.start}-{slot.end}
              </span>
            </div>

            {/* 该时段各星期格子 */}
            {DAYS.map(day => {
              const entry = getEntry(day, slot.start, slot.end)
              const hasCourse = hasCourseInSlot(day, slot.start, slot.end)
              const cellKey = `${day}-${slot.id}`

              if (entry) {
                const course = courseMap.get(entry.course_id)
                const subject = course?.subject || entry.course_subject || ''
                const colorClass = getSubjectColor(subject)
                const noTeacher = !entry.teacher_id

                return (
                  <div
                    key={cellKey}
                    className={`bg-white p-1.5 min-h-[72px] cursor-pointer border-2 rounded-sm transition-colors relative group ${colorClass} ${
                      noTeacher ? 'ring-1 ring-amber-300' : ''
                    }`}
                    onClick={() => openAssignTeacher(entry)}
                    title={noTeacher ? '点击指定教师' : '点击更换教师'}
                  >
                    <div className="font-semibold text-xs leading-tight mb-0.5 truncate">
                      {getCourseTitle(entry.course_id)}
                    </div>

                    <div className="text-[10px] text-gray-400">
                      {course?.duration ? `${course.duration}分` : ''}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                      {noTeacher ? (
                        <span className="text-amber-600 font-medium italic truncate">待排教师</span>
                      ) : (
                        <>
                          <UserCheck className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{getTeacherName(entry.teacher_id)}</span>
                        </>
                      )}
                    </div>

                    {subject && (
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {subject}{course?.grade_level ? ` · ${course.grade_level}` : ''}
                      </div>
                    )}

                    <button
                      className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full p-0.5 text-red-400 hover:text-red-600 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(entry)
                      }}
                      title="删除排课"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              }

              // 空格子 — 点击放入课程
              return (
                <div
                  key={cellKey}
                  className="bg-white p-1.5 min-h-[72px] cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all border border-dashed border-gray-200 group relative"
                  onClick={() => openAssignCourse(day, slot)}
                  title="点击放入课程"
                >
                  <div className="text-[10px] text-gray-300 text-center pt-4">
                    {hasCourse ? '时段已占用' : '+'}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 排课列表（底部） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            所有排课 ({filteredEntries.length})
            {gradeFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700">
                {gradeFilter}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>当前学期课程安排总览</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">暂无排课数据</p>
              <p className="text-xs mt-1">点击时间表格子，选课程放入时间表</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries
                .sort((a, b) => DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week) || a.start_time.localeCompare(b.start_time))
                .map(entry => {
                  const subject = getCourseSubject(entry.course_id)
                  const colorClass = getSubjectColor(subject)
                  const noTeacher = !entry.teacher_id
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${colorClass} hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* 时间 */}
                        <div className="text-center shrink-0 w-14">
                          <div className="text-xs font-bold text-gray-700">{entry.start_time}</div>
                          <div className="text-[10px] text-gray-400">{entry.end_time}</div>
                        </div>

                        {/* 分隔 */}
                        <div className="w-px h-8 bg-gray-200 shrink-0" />

                        {/* 信息 */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">
                              {getCourseTitle(entry.course_id)}
                            </span>
                            {subject && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {subject}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              {noTeacher
                                ? <span className="text-amber-600 italic">待排教师</span>
                                : getTeacherName(entry.teacher_id)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {DAY_LABELS[entry.day_of_week]}
                            </span>
                            {getCourseGrade(entry.course_id) && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {getCourseGrade(entry.course_id)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 操作 */}
                      <div className="flex items-center gap-1 shrink-0">
                        {noTeacher && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => openAssignTeacher(entry)}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            排教师
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600 h-8 w-8 p-0"
                          onClick={() => handleDelete(entry)}
                          title="删除排课"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* 弹窗：给空格子放课程（第一步） */}
      {/* ================================================================ */}
      <Dialog open={assignCourseDialog} onOpenChange={setAssignCourseDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>放入课程</DialogTitle>
            <DialogDescription>
              {targetDay ? `${DAY_LABELS[targetDay]} · ${targetSlot?.start}-${targetSlot?.end}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                选择课程 <span className="text-red-500">*</span>
              </Label>
              <Select value={assignCourseId} onValueChange={setAssignCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要排课的课程" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}{course.grade_level ? ` (${course.grade_level})` : ''}
                      {course.duration ? ` · ${course.duration}分` : ''}
                    </SelectItem>
                  ))}
                  {filteredCourses.length === 0 && (
                    <SelectItem value="__none__" disabled>该年级暂无课程</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                开始时间 <span className="text-red-500">*</span>
              </Label>
              <select
                value={assignStartTime}
                onChange={e => setAssignStartTime(e.target.value)}
                className="h-10 w-full text-sm border rounded px-3"
              >
                {getTimeOptions().map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* 自动算出的结束时间 */}
            {assignCourseId && (
              <div className="bg-indigo-50 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">结束时间（自动）</span>
                <span className="font-bold text-indigo-700">
                  {assignEndTime}
                  <span className="text-xs text-gray-500 ml-2">
                    ({courseMap.get(assignCourseId)?.duration || 60}分)
                  </span>
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignCourseDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAssignCourse}>
              <Plus className="h-4 w-4 mr-1" />
              放入时间表
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* 弹窗：给已排课程指定教师（第二步） */}
      {/* ================================================================ */}
      <Dialog open={assignTeacherDialog} onOpenChange={setAssignTeacherDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>指定教师</DialogTitle>
            <DialogDescription>
              {targetEntry ? (
                <>为「{getCourseTitle(targetEntry.course_id)}」选择授课教师</>
              ) : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                选择教师 <span className="text-red-500">*</span>
              </Label>
              <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择授课教师" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignTeacherDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAssignTeacher}>
              <UserCheck className="h-4 w-4 mr-1" />
              确认指定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
