"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, BookOpen, Users, Loader2, AlertCircle, GraduationCap, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// ============================================================
// 类型
// ============================================================

interface GanttCourse {
  id: string
  title: string
  subject: string
  grade_level?: string
  duration?: number
}

interface GanttEntry {
  id: string
  course_id: string
  teacher_id: string
  day_of_week: string
  start_time: string
  end_time: string
  course_grade?: string
  course_title?: string
}

const PROXY_BASE = "/api/pocketbase-proxy/api/collections/schedules/records"

async function pbRequest(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PB API Error (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json()
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const DAY_LABELS: Record<string, string> = { Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四", Fri: "周五" }

// 甘特图时间轴范围
const START_HOUR = 7
const END_HOUR = 20

/** "HH:mm" → 分钟数（从 00:00 起） */
function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

/** 分钟数 → "HH:mm" */
function toTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** 计算 bar 在时间轴上的左侧偏移（px/百分比）和宽度 */
function computeBar(start: string, end: string, totalMinutes: number) {
  const s = Math.max(toMinutes(start), START_HOUR * 60)
  const e = Math.min(toMinutes(end), END_HOUR * 60)
  const left = ((s - START_HOUR * 60) / totalMinutes) * 100
  const width = ((e - s) / totalMinutes) * 100
  return { left, width }
}

const SUBJECT_COLORS: Record<string, string> = {
  "华文": "bg-red-400 border-red-500",
  "国文": "bg-orange-400 border-orange-500",
  "英文": "bg-blue-400 border-blue-500",
  "数学": "bg-green-400 border-green-500",
  "科学": "bg-cyan-400 border-cyan-500",
  "历史": "bg-amber-400 border-amber-500",
  "地理": "bg-emerald-400 border-emerald-500",
  "道德": "bg-purple-400 border-purple-500",
  "美术": "bg-pink-400 border-pink-500",
  "音乐": "bg-indigo-400 border-indigo-500",
  "体育": "bg-lime-400 border-lime-500",
}

function getSubjectColor(subject: string): { bg: string; text: string } {
  const c = SUBJECT_COLORS[subject] || "bg-gray-400 border-gray-500"
  return { bg: c, text: "text-white" }
}

// ============================================================
// 甘特图主组件
// ============================================================

export default function GradeGanttChart() {
  const [courses, setCourses] = useState<GanttCourse[]>([])
  const [entries, setEntries] = useState<GanttEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 年级多选 filter
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [coursesRes, schedulesRes] = await Promise.all([
        fetch("/api/courses"),
        pbRequest(`${PROXY_BASE}?filter=(schedule_type="course_schedule")&sort=start_time&perPage=200`),
      ])

      const coursesData = await coursesRes.json()
      let courseList: GanttCourse[] = []
      if (coursesData.success && Array.isArray(coursesData.data?.items)) courseList = coursesData.data.items
      else if (Array.isArray(coursesData.items)) courseList = coursesData.items
      else if (Array.isArray(coursesData)) courseList = coursesData
      setCourses(courseList.filter((c) => c.status !== "archived") || [])

      const pbsItems = schedulesRes?.items || []
      setEntries(pbsItems.map((item: any) => ({
        id: item.id,
        course_id: item.course_id || item.class_id || "",
        teacher_id: item.teacher_id || "",
        day_of_week: item.day_of_week || "",
        start_time: item.start_time || "",
        end_time: item.end_time || "",
        course_grade: item.course_grade || "",
        course_title: item.course_title || "",
      })))
    } catch (err) {
      console.error("加载甘特图数据失败:", err)
      setError(err instanceof Error ? err.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const courseMap = new Map(courses.map((c) => [c.id, c]))

  // 年级选项（用 courseMap 归一化，不依赖 course_grade 快照）
  const gradeOptions = Array.from(new Set(courses.map((c) => c.grade_level).filter(Boolean))) as string[]

  // 当前选中的年级（默认全选）
  const activeGrades = selectedGrades.size === 0 ? gradeOptions : gradeOptions.filter((g) => selectedGrades.has(g))

  // 过滤出该年级的排课
  const visibleEntries = entries.filter((e) => {
    const grade = courseMap.get(e.course_id)?.grade_level || e.course_grade
    return activeGrades.includes(grade as string)
  })

  // 按年级分组（用于行维度）
  const entriesByGrade = activeGrades.reduce((acc, grade) => {
    acc[grade] = visibleEntries.filter((e) => (courseMap.get(e.course_id)?.grade_level || e.course_grade) === grade)
    return acc
  }, {} as Record<string, GanttEntry[]>)

  const totalMinutes = (END_HOUR - START_HOUR) * 60

  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => {
      const next = new Set(prev)
      if (next.has(grade)) next.delete(grade)
      else next.add(grade)
      return next
    })
  }

  // 全选 = 清空集合（空集合表示全部显示）
  const selectAll = () => setSelectedGrades(new Set())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-gray-500 text-sm">加载甘特图数据...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <Button variant="outline" onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" />重试</Button>
        </CardContent>
      </Card>
    )
  }

  // 生成时间轴刻度（每小时）
  const hourTicks: string[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hourTicks.push(`${String(h).padStart(2, "0")}:00`)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-indigo-500" />
          年级时间表甘特图
        </CardTitle>
        <CardDescription>横轴为一天时间，每个年级一行，色块 = 课程的开始至结束时段（可点色块查看详情）</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 年级 filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-medium mr-1">年级：</span>
          <Badge
            variant="secondary"
            className="cursor-pointer select-none bg-slate-100 text-slate-700"
            onClick={selectAll}
          >
            全选
          </Badge>
          {gradeOptions.map((g) => {
            const on = activeGrades.includes(g)
            return (
              <Badge
                key={g}
                variant="secondary"
                className={`cursor-pointer select-none transition-colors ${on ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
                onClick={() => toggleGrade(g)}
              >
                {g}
              </Badge>
            )
          })}
          <div className="flex-1" />
          <Badge variant="outline" className="gap-1 text-xs">
            <BookOpen className="h-3 w-3" /> {visibleEntries.length} 排课
          </Badge>
        </div>

        {/* 空状态 */}
        {gradeOptions.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">暂无课程数据，请先在课程管理中创建课程</p>
          </div>
        )}

        {/* 甘特图主体 */}
        {gradeOptions.length > 0 && (
          <div className="space-y-6 overflow-x-auto">
            {activeGrades.map((grade) => {
              const gradeEntries = entriesByGrade[grade] || []
              return (
                <div key={grade} className="min-w-[900px]">
                  {/* 年级行标题 */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5">
                      {grade}
                    </Badge>
                    <span className="text-xs text-gray-400">{gradeEntries.length} 节</span>
                  </div>

                  {/* 时间刻度头 */}
                  <div
                    className="relative h-6 mb-1 border-b border-gray-200"
                    style={{ width: "100%" }}
                  >
                    {hourTicks.map((tick, i) => (
                      <div
                        key={tick}
                        className="absolute text-[9px] text-gray-400"
                        style={{ left: `${((toMinutes(tick) - START_HOUR * 60) / totalMinutes) * 100}%` }}
                      >
                        {tick}
                      </div>
                    ))}
                  </div>

                  {/* 按星期分区（周一~周五，每个星期一个子块） */}
                  {DAYS.map((day) => {
                    const dayEntries = gradeEntries.filter((e) => e.day_of_week === day)
                    return (
                      <div key={day}>
                        {/* 星期标签 + 轨道 */}
                        <div className="flex items-start gap-2">
                          <div className="w-12 shrink-0 pt-1 text-xs font-medium text-gray-500">
                            {DAY_LABELS[day]}
                          </div>
                          <div className="relative flex-1">
                            {/* 背景时间网格 */}
                            <div
                              className="absolute inset-0 grid pointer-events-none"
                              style={{ gridTemplateColumns: `repeat(${hourTicks.length - 1}, 1fr)` }}
                            >
                              {hourTicks.slice(0, -1).map((tick) => (
                                <div key={tick} className="border-l border-gray-100" />
                              ))}
                            </div>

                            {/* 该星期的课程 bar */}
                            <div
                              className="relative"
                              style={{ minHeight: Math.max(dayEntries.length * 28 + 4, 26) }}
                            >
                              {dayEntries.length === 0 ? (
                                <div className="h-[26px] border border-dashed border-gray-100 rounded" />
                              ) : (
                                dayEntries.map((entry, idx) => {
                                  const { left, width } = computeBar(entry.start_time, entry.end_time, totalMinutes)
                                  const course = courseMap.get(entry.course_id)
                                  const subject = course?.subject || ""
                                  const { bg } = getSubjectColor(subject)
                                  return (
                                    <div
                                      key={entry.id}
                                      className={`absolute h-[24px] rounded ${bg} text-white text-[10px] px-1.5 flex items-center overflow-hidden shadow-sm cursor-pointer`}
                                      style={{ left: `${left}%`, width: `${width}%`, top: idx * 28 }}
                                      title={`${course?.title || entry.course_title} · ${DAY_LABELS[day]} ${entry.start_time}-${entry.end_time}`}
                                    >
                                      <span className="truncate font-medium">
                                        {course?.title || entry.course_title || entry.course_id.slice(0, 8)}
                                      </span>
                                      <span className="ml-auto shrink-0 pl-1">
                                        {entry.start_time}-{entry.end_time}
                                      </span>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}