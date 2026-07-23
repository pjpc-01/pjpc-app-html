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
  /** 课程名称 (展开/缓存) */
  course_title?: string
  /** 教师名称 (展开/缓存) */
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

/** 默认时间段 */
const DEFAULT_TIME_SLOTS = [
  { start: '08:00', end: '08:45' },
  { start: '09:00', end: '09:45' },
  { start: '10:00', end: '10:45' },
  { start: '11:00', end: '11:45' },
  { start: '14:00', end: '14:45' },
  { start: '15:00', end: '15:45' },
  { start: '16:00', end: '16:45' },
]

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
// 时间段选项
// ============================================================

function getTimeOptions() {
  const options: string[] = []
  for (let h = 7; h <= 18; h++) {
    for (const m of ['00', '30']) {
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

  // 选择状态
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CourseScheduleEntry | null>(null)

  // 新建对话框
  const [newSlotDay, setNewSlotDay] = useState<DayOfWeek>('Mon')
  const [newSlotStart, setNewSlotStart] = useState('08:00')
  const [newSlotEnd, setNewSlotEnd] = useState('08:45')

  // ============================================================
  // 数据加载
  // ============================================================

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 并行加载课程、教师、已存在排课
      const [coursesRes, teachersRes, schedulesRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/teachers?limit=200'),
        pbRequest(`${PROXY_BASE}?filter=(schedule_type="course_schedule")&sort=start_time&perPage=200`),
      ])

      // 课程
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

      // 教师
      const teachersData = await teachersRes.json()
      let teacherList: Teacher[] = []
      if (teachersData.success && Array.isArray(teachersData.data)) {
        teacherList = teachersData.data.map((t: any) => ({
          id: t.id,
          name: t.name || t.teacher_name || '',
        }))
      } else if (Array.isArray(teachersData)) {
        teacherList = teachersData.map((t: any) => ({
          id: t.id,
          name: t.name || '',
        }))
      }
      setTeachers(teacherList.filter((t: Teacher) => t.name) || [])

      // 排课记录
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

  // 从 date 推导 day_of_week (向后兼容)
  function getDayFromDate(dateStr: string): DayOfWeek | null {
    if (!dateStr) return null
    try {
      const d = new Date(dateStr)
      const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return days[d.getDay()] as DayOfWeek || null
    } catch {
      return null
    }
  }

  // ============================================================
  // 查找名称
  // ============================================================

  const courseMap = new Map(courses.map(c => [c.id, c]))
  const teacherMap = new Map(teachers.map(t => [t.id, t]))

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
  // 排课 CRUD
  // ============================================================

  /** 创建排课记录 */
  async function handleCreate(day: DayOfWeek, start: string, end: string) {
    if (!selectedCourseId) {
      toast.error('请先选择课程')
      return
    }
    if (!selectedTeacherId) {
      toast.error('请先选择教师')
      return
    }

    // 检查该时间段是否已被占用
    const conflict = scheduleEntries.find(
      e => e.day_of_week === day && e.start_time === start && e.end_time === end
    )
    if (conflict) {
      toast.error('该时间段已被占用，请先删除或修改现有排课')
      return
    }

    try {
      const course = courseMap.get(selectedCourseId)
      const teacher = teacherMap.get(selectedTeacherId)

      await pbRequest(PROXY_BASE, {
        method: 'POST',
        body: JSON.stringify({
          course_id: selectedCourseId,
          teacher_id: selectedTeacherId,
          day_of_week: day,
          date: '2026-01-05', // placeholder — 对于课程排课不重要
          start_time: start,
          end_time: end,
          schedule_type: 'course_schedule',
          status: 'scheduled',
          center: '',
          course_title: course?.title || '',
          teacher_name: teacher?.name || '',
          course_subject: course?.subject || '',
          course_grade: course?.grade_level || '',
          class_id: selectedCourseId, // 同时存储到 class_id 向下兼容
          notes: day, // 向下兼容: notes 存 day_of_week
        }),
      })

      toast.success('排课已创建')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建排课失败')
    }
  }

  /** 删除排课记录 */
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

  /** 获取某天某时间段的排课 */
  function getEntry(day: DayOfWeek, start: string, end: string): CourseScheduleEntry | undefined {
    return scheduleEntries.find(
      e => e.day_of_week === day && e.start_time === start && e.end_time === end
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
          排课管理 (方案B)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          选择课程和教师，点击时间格子完成排课
        </p>
      </div>

      {/* 选择器 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 课程选择 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                选择课程 <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要排课的课程" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}{course.grade_level ? ` (${course.grade_level})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 教师选择 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                选择教师 <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
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

          {/* 选中预览 */}
          {selectedCourseId && selectedTeacherId && (
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-600 bg-indigo-50 rounded-lg p-3">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <span className="font-medium">{getCourseTitle(selectedCourseId)}</span>
              <span className="text-gray-300">→</span>
              <UserCheck className="h-4 w-4 text-indigo-500" />
              <span className="font-medium">{getTeacherName(selectedTeacherId)}</span>
              <span className="text-xs text-gray-400 ml-auto">
                点击下方时间格子完成排课
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计 */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 gap-1">
          <BookOpen className="h-3 w-3" />
          {courses.length} 课程
        </Badge>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 gap-1">
          <Users className="h-3 w-3" />
          {teachers.length} 教师
        </Badge>
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 gap-1">
          <Clock className="h-3 w-3" />
          {scheduleEntries.length} 排课
        </Badge>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 gap-1">
          {DAYS.filter(d => scheduleEntries.some(e => e.day_of_week === d)).length}/5 天
        </Badge>
      </div>

      {/* ================================================================ */}
      {/*         每周课程表网格                                          */}
      {/* ================================================================ */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-px bg-gray-200 rounded-lg overflow-hidden min-w-[640px]"
          style={{
            gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)`,
          }}
        >
          {/* 表头 */}
          <div className="bg-gray-100 p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            时间段
          </div>
          {DAYS.map(day => (
            <div
              key={day}
              className="bg-gray-100 p-3 text-center font-semibold text-gray-700"
            >
              {DAY_LABELS[day]}
              <div className="text-xs text-gray-400 font-normal mt-0.5">
                {scheduleEntries.filter(e => e.day_of_week === day).length} 节课
              </div>
            </div>
          ))}

          {/* 时间格子 */}
          {DEFAULT_TIME_SLOTS.map(slot => {
            const key = `${slot.start}-${slot.end}`
            return (
              <>
                {/* 时间列 */}
                <div
                  key={`time-${key}`}
                  className="bg-white p-2 text-xs text-gray-500 font-medium flex items-center justify-center border-r border-gray-100"
                >
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {slot.start}-{slot.end}
                  </span>
                </div>

                {/* 每天格子 */}
                {DAYS.map(day => {
                  const entry = getEntry(day, slot.start, slot.end)
                  const cellKey = `${day}-${key}`

                  if (entry) {
                    const course = courseMap.get(entry.course_id)
                    const subject = course?.subject || entry.course_subject || ''
                    const colorClass = getSubjectColor(subject)

                    return (
                      <div
                        key={cellKey}
                        className={`bg-white p-1.5 min-h-[72px] cursor-pointer border border-transparent hover:border-indigo-300 transition-colors group relative ${colorClass} border-2 rounded-sm`}
                        onClick={() => {
                          setEditingEntry(entry)
                          setDialogOpen(true)
                        }}
                        title={`${getCourseTitle(entry.course_id)} · ${getTeacherName(entry.teacher_id)}`}
                      >
                        {/* 课程名称 */}
                        <div className="font-semibold text-xs leading-tight mb-0.5 truncate">
                          {getCourseTitle(entry.course_id)}
                        </div>

                        {/* 教师 + 科目 */}
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <UserCheck className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{getTeacherName(entry.teacher_id)}</span>
                        </div>

                        {subject && (
                          <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                            {subject}{course?.grade_level ? ` · ${course.grade_level}` : ''}
                          </div>
                        )}

                        {/* 悬停删除 */}
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

                  // 空格子 — 可点击创建
                  return (
                    <div
                      key={cellKey}
                      className={`bg-white p-1.5 min-h-[72px] cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all border border-dashed border-gray-200 group relative ${
                        selectedCourseId && selectedTeacherId
                          ? 'hover:border-indigo-400 hover:bg-indigo-50/50'
                          : ''
                      }`}
                      onClick={() => {
                        if (selectedCourseId && selectedTeacherId) {
                          handleCreate(day, slot.start, slot.end)
                        } else {
                          toast.info('请先在上方选择课程和教师')
                        }
                      }}
                    >
                      {/* 空状态提示 */}
                      {selectedCourseId && selectedTeacherId && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-5 w-5 text-indigo-300" />
                        </div>
                      )}
                      {!selectedCourseId || !selectedTeacherId ? (
                        <div className="text-[10px] text-gray-300 text-center pt-4">
                          选择课程+教师后点击添加
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </>
            )
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/*         排课列表 (底部)                                         */}
      {/* ================================================================ */}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            所有排课 ({scheduleEntries.length})
          </CardTitle>
          <CardDescription>当前学期课程安排总览</CardDescription>
        </CardHeader>
        <CardContent>
          {scheduleEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">暂无排课数据</p>
              <p className="text-xs mt-1">选择课程和教师后点击时间格子添加排课</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scheduleEntries
                .sort((a, b) => DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week) || a.start_time.localeCompare(b.start_time))
                .map(entry => {
                  const subject = getCourseSubject(entry.course_id)
                  const colorClass = getSubjectColor(subject)
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
                              {getTeacherName(entry.teacher_id)}
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
      {/*         编辑/查看对话框                                         */}
      {/* ================================================================ */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>排课详情</DialogTitle>
            <DialogDescription>
              查看和删除当前排课记录
            </DialogDescription>
          </DialogHeader>

          {editingEntry && (
            <div className="space-y-3 py-2">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('course.course')}</span>
                  <span className="font-medium">{getCourseTitle(editingEntry.course_id)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('teacher.teacher')}</span>
                  <span className="font-medium">{getTeacherName(editingEntry.teacher_id)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('course.week')}</span>
                  <span className="font-medium">{DAY_LABELS[editingEntry.day_of_week]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('announcement.time')}</span>
                  <span className="font-medium">{editingEntry.start_time} - {editingEntry.end_time}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              关闭
            </Button>
            {editingEntry && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDelete(editingEntry)
                  setDialogOpen(false)
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除排课
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
