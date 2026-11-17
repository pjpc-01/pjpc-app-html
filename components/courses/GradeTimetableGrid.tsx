"use client"

/**
 * 各年级课表（表格视图）
 *
 * 跟甘特图不一样：甘特图是一条统一时间轴 + 年级开关；
 * 这个是把每个年级自己的课表并排放在一起看 —— 左列星期，右边每个年级三列
 * （科目 / 时间 / 老师），同一天有几节课就展开几行。
 * 老师/院长拿这张表打印出来发学生，所以带一个「打印」。
 */
import { Fragment, useState, useEffect, useCallback } from "react"
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
const GRADE_PALETTE = [
  { head: "bg-emerald-100 text-emerald-900", cell: "bg-emerald-50/40" },
  { head: "bg-amber-100 text-amber-900", cell: "bg-amber-50/40" },
  { head: "bg-rose-100 text-rose-900", cell: "bg-rose-50/40" },
  { head: "bg-sky-100 text-sky-900", cell: "bg-sky-50/40" },
  { head: "bg-violet-100 text-violet-900", cell: "bg-violet-50/40" },
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
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr>
              <th rowSpan={2} className="w-16 border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-600">
                {t("星期")}
              </th>
              {grades.map((g, gi) => {
                const st = styleFor(gi)
                return (
                  <th key={g} colSpan={3} className={`border border-gray-200 px-2 py-2 text-sm font-bold ${st.head}`}>
                    {gradeLabel(g) || g}
                  </th>
                )
              })}
            </tr>
            <tr>
              {grades.map(g => (
                <Fragment key={g}>
                  <th className="border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500">{t("科目")}</th>
                  <th className="border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500">{t("时间")}</th>
                  <th className="border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500">{t("老师")}</th>
                </Fragment>
              ))}
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
                    if (!slot) {
                      return (
                        <Fragment key={`${g}-${day}-${i}-empty`}>
                          <td className={`border border-gray-100 ${st.cell} px-2 py-2 text-center text-gray-300`}>—</td>
                          <td className={`border border-gray-100 ${st.cell}`} />
                          <td className={`border border-gray-100 ${st.cell}`} />
                        </Fragment>
                      )
                    }
                    return (
                      <Fragment key={`${g}-${day}-${i}-slot`}>
                        <td className={`border border-gray-100 ${st.cell} px-2 py-2 font-semibold text-gray-800`}>{t(slot.subject)}</td>
                        <td className={`border border-gray-100 ${st.cell} whitespace-nowrap px-2 py-2 text-gray-600`}>
                          {slot.start}–{slot.end}
                          {slot.room ? <span className="ml-1 text-xs text-gray-400">@{slot.room}</span> : null}
                        </td>
                        <td className={`border border-gray-100 ${st.cell} px-2 py-2 text-gray-600`}>{slot.teacher || "—"}</td>
                      </Fragment>
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
