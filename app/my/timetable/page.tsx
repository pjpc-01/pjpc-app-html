"use client"

/**
 * 我的课表 —— 整周时间表（不是只显示今天）。
 *
 * 排课表的日期字段有两种存法：一种按真实日期（date），一种是每周固定（day_of_week）。
 * 这里把两种都归到「星期」，按 时间 × 星期 排成一张表。
 */
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { useStudentHome, DAYS, dayKey, weekdayOf } from "@/hooks/useStudentHome"
import { AlertCircle, Calendar } from "lucide-react"

export default function MyTimetablePage() {
  const { t } = useLanguage()
  const { data, loading, error, reload } = useStudentHome()

  const shell = (children: React.ReactNode) => (
    <PageLayout title={t("我的课表")} description={t("整周时间表")}>
      <div className="p-4 md:p-6 max-w-6xl">{children}</div>
    </PageLayout>
  )

  if (loading) return shell(<p className="text-gray-500 py-10 text-center">{t("加载中...")}</p>)
  if (error || !data) {
    return shell(
      <Card><CardContent className="py-10 text-center">
        <p className="text-red-600 flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" />{error || t("加载失败")}</p>
        <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={reload}>{t("重新加载")}</button>
      </CardContent></Card>
    )
  }

  const rows = (data.week_schedule || []).map((c: any) => {
    // 有 date 就按日期算星期；没 date 就看 day_of_week（Mon/星期一都可能）
    const fromDate = weekdayOf(c.date)
    const day = fromDate || dayKey(c.day_of_week)
    return { ...c, day }
  }).filter((c: any) => c.day)

  // 时间槽：把所有开始-结束时间收起来排序
  const slots = [...new Set(rows.map((c: any) => `${c.start_time}-${c.end_time}`))]
    .sort((a, b) => String(a).localeCompare(String(b)))

  const todayIdx = new Date().getDay()

  return shell(
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4" />{t("整周课表")}</CardTitle>
        <CardDescription>{t("周一至周日，按时间从上到下")} · {t("共")} {rows.length} {t("节")}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">{t("还没有排课")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-2 text-left text-xs text-gray-500 w-24">{t("时间")}</th>
                  {DAYS.map((d) => {
                    const idx = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(d.key)
                    const isToday = idx === todayIdx
                    return (
                      <th key={d.key} className={`border px-2 py-2 text-xs ${isToday ? "bg-blue-50 text-blue-700" : "text-gray-500"}`}>
                        {t(d.zh)}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => {
                  const [start, end] = slot.split("-")
                  return (
                    <tr key={slot}>
                      <td className="border px-2 py-2 text-xs text-gray-600 whitespace-nowrap">
                        {String(start).slice(0, 5)}<br />{String(end).slice(0, 5)}
                      </td>
                      {DAYS.map((d) => {
                        const cell = rows.filter((c: any) => c.day === d.key && `${c.start_time}-${c.end_time}` === slot)
                        return (
                          <td key={d.key} className="border px-2 py-2 align-top">
                            {cell.length === 0 ? <span className="text-gray-300 text-xs">—</span> : cell.map((c: any) => (
                              <div key={c.id} className="mb-1">
                                <div className="font-medium text-[13px]">{c.course}</div>
                                {c.teacher && <div className="text-[11px] text-gray-500">{c.teacher}</div>}
                                {c.room && <div className="text-[11px] text-gray-400">{c.room}</div>}
                              </div>
                            ))}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
