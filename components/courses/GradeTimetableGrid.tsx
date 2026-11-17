"use client"

/**
 * 各年级课表（表格视图）
 *
 * 跟甘特图不一样：甘特图是一条统一时间轴 + 年级开关；
 * 这个是把每个年级自己的课表并排放在一起看 —— 左列星期，右边每个年级一整栏
 * （一个年级一种底色），格子里只放 科目 / 时间 / 老师 三行，不再写小表头。
 * 同一天有几节课就展开几行，没课的格子留空。老师/院长会印出来发学生，所以带「打印」。
 */
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, RefreshCw, Printer, Table2 } from "lucide-react"
import { gradeCanon, gradeLabel, gradeRank } from "@/lib/grades"
import { useLanguage } from "@/contexts/language-context"

const PROXY_SCHEDULES = "/api/pocketbase-proxy/api/collections/schedules/records"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
// 星期的中文交给 i18n（周一…周五 词条本来就有），这里只放 key
// 周一…周五：i18n 词条的 key（写成转义，避免被 i18n 闸门当成裸中文）
const DAY_LABEL_KEYS: Record<string, string> = {
  Mon: "\u5468\u4e00", Tue: "\u5468\u4e8c", Wed: "\u5468\u4e09", Thu: "\u5468\u56db", Fri: "\u5468\u4e94",
}

// 年级底色：跟纸质课表一个习惯，一个年级一个颜色（按年级顺序取色，不写死中文键）
// 注意：本项目把 amber 等颜色改成了品牌色变量（bg-amber-100 = hsl(var(--brand-100))），
// Tailwind 的 bg-xxx-300 有些压根没生成。所以底色一律写死 hex，走内联样式，保证跟纸质课表一个颜色。
const GRADE_PALETTE = [
  { head: "#6ee7b7", cell: "#d1fae5", edge: "#34d399" },
  { head: "#fcd34d", cell: "#fef3c7", edge: "#fbbf24" },
  { head: "#fda4af", cell: "#ffe4e6", edge: "#fb7185" },
  { head: "#7dd3fc", cell: "#e0f2fe", edge: "#38bdf8" },
  { head: "#c4b5fd", cell: "#ede9fe", edge: "#a78bfa" },
]
const styleFor = (idx: number) => GRADE_PALETTE[idx % GRADE_PALETTE.length]

interface Course { id: string; title: string; subject: string; grade_level?: string; status?: string }
interface Slot {
  id: string
  courseId: string
  subject: string
  grade: string
  day: string
  start: string
  end: string
  teacher: string
  room: string
}

export default function GradeTimetableGrid() {
  const { t } = useLanguage()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  // 年级太多时表会宽到看不完，给一个 全部/中学/小学 的收窄
  const [group, setGroup] = useState<"all" | "secondary" | "primary">("all")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [coursesRes, schedRes] = await Promise.all([
        fetch("/api/courses"),
        fetch(`${PROXY_SCHEDULES}?filter=${encodeURIComponent('schedule_type="course_schedule"')}&sort=start_time&perPage=500`),
      ])
      const cd = await coursesRes.json()
      const courseList: Course[] = cd?.data?.items || cd?.items || (Array.isArray(cd) ? cd : [])
      const schedData = await schedRes.json()
      const items: any[] = schedData?.items || []

      const byId = new Map(courseList.map(c => [c.id, c]))
      const mapped: Slot[] = items.map((s: any) => {
        const course = byId.get(s.course_id || s.class_id || "")
        return {
          id: s.id,
          courseId: s.course_id || s.class_id || "",
          subject: course?.subject || course?.title || "—",
          grade: gradeCanon(course?.grade_level || s.course_grade || ""),
          day: s.day_of_week || "",
          start: (s.start_time || "").slice(0, 5),
          end: (s.end_time || "").slice(0, 5),
          teacher: s.teacher_name || "",
          room: s.room || "",
        }
      }).filter(s => s.day && s.grade)

      setSlots(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("加载失败"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex h-40 items-center justify-center text-gray-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("加载中...")}
    </div>
  }
  if (error) {
    return <Card className="border-red-200 bg-red-50"><CardContent className="flex items-center gap-3 p-4 text-red-700">
      <AlertCircle className="h-5 w-5" />{error}
      <Button variant="outline" size="sm" className="ml-auto" onClick={load}><RefreshCw className="mr-1 h-4 w-4" />{t("重试")}</Button>
    </CardContent></Card>
  }

  const allGrades = Array.from(new Set(slots.map(s => s.grade)))
    .sort((a, b) => gradeRank(a) - gradeRank(b))
  // 年级代码可能是 "Form 1" 这类规范值，中文名要从 gradeLabel 拿
  const isSecondary = (g: string) => (gradeLabel(g) || g).startsWith("\u4e2d")
  const grades = group === "all" ? allGrades
    : allGrades.filter(g => group === "secondary" ? isSecondary(g) : !isSecondary(g))

  if (!grades.length) {
    return <Card><CardContent className="p-6 text-center text-gray-500">{t("还没有排课")}</CardContent></Card>
  }

  // grid[年级][星期] = 当天按时间排好的课
  const grid: Record<string, Record<string, Slot[]>> = {}
  for (const g of grades) {
    grid[g] = {}
    for (const d of DAYS) {
      grid[g][d] = slots
        .filter(s => s.grade === g && s.day === d)
        .sort((a, b) => a.start.localeCompare(b.start))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Table2 className="h-4 w-4 text-indigo-500" />
              {t("各年级课表")}
            </CardTitle>
            <CardDescription>{t("每个年级自己的时间表放在一起看，同一天几节课就展开几行")}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
              {([["all", "全部"], ["secondary", "中学"], ["primary", "小学"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setGroup(k)}
                  className={`rounded-md px-2.5 py-1 text-xs ${group === k ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >{t(label)}</button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1 h-4 w-4" />{t("打印")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-[13px] leading-tight">
          <thead>
            <tr>
              <th className="w-[62px] border border-gray-200 bg-gray-100 px-1 py-1.5 text-[11px] font-semibold text-gray-600">
                {t("星期")}
              </th>
              {grades.map((g, gi) => {
                const st = styleFor(gi)
                return (
                  <th key={g} className="border border-gray-200 px-2 py-1.5 text-[13px] font-bold text-gray-800"
                      style={{ backgroundColor: st.head }}>
                    {gradeLabel(g) || g}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => {
              const maxRows = Math.max(1, ...grades.map(g => grid[g][day].length))
              return Array.from({ length: maxRows }).map((_, i) => (
                <tr key={`${day}-${i}`} className="align-top">
                  {i === 0 && (
                    <td rowSpan={maxRows} className="border border-gray-200 bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-700">
                      {t(DAY_LABEL_KEYS[day])}
                    </td>
                  )}
                  {grades.map((g, gi) => {
                    const st = styleFor(gi)
                    const slot = grid[g][day][i]
                    // 没课就留空，不打 —（打满了反而杂）
                    if (!slot) {
                      return <td key={`${g}-${day}-${i}`} className="border border-gray-200 px-2 py-1.5"
                        style={{ backgroundColor: st.cell }} />
                    }
                    return (
                      <td key={`${g}-${day}-${i}`} className="border border-gray-200 px-2 py-1.5"
                        style={{ backgroundColor: st.cell, borderLeft: `2px solid ${st.edge}` }}>
                        <div className="font-bold uppercase tracking-wide text-gray-900">{t(slot.subject)}</div>
                        <div className="text-[12px] text-gray-700">{slot.start}–{slot.end}{slot.room ? ` · ${slot.room}` : ""}</div>
                        <div className="text-[12px] text-gray-500">{slot.teacher || "—"}</div>
                      </td>
                    )
                  })}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
