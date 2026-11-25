"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { formatGrade, isLatePickup } from "@/lib/utils"
import { fetchSecureData } from "@/lib/secure-api-client"
import { useLanguage } from "@/contexts/language-context"
import { CalendarDays, Truck, Clock, Users } from "lucide-react"

/**
 * 接送日历：按月看每天的接送记录。
 * 可以选年级、选月份（时间），点某一天看当天明细。
 */

type Rec = {
  id: string
  pickup_date: string
  pickup_time: string
  pickup_by: string
  relationship: string
  status: string
  parent_confirmed: boolean
  expand?: { studentId?: { id: string; name: string; grade: string } }
}

const WD = ["一", "二", "三", "四", "五", "六", "日"]

const ymOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`

export default function PickupCalendar() {
  const { t } = useLanguage()
  const [month, setMonth] = useState(() => ymOf(new Date()))
  const [grade, setGrade] = useState("all")
  const [rows, setRows] = useState<Rec[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [picked, setPicked] = useState("")

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("")
      const start = `${month}-01`
      // 单条件过滤（PB 多条件 && 容易 400），月份上限在 JS 里筛
      const data = await fetchSecureData<Rec[]>("pickup_records", {
        fullList: true,
        filter: `pickup_date >= "${start}"`,
        sort: "pickup_date",
        expand: "studentId",
      })
      setRows((data || []).filter(r => String(r.pickup_date || "").slice(0, 7) === month))
    } catch (e: any) {
      setError(String(e?.message || e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  const grades = useMemo(() => {
    const s = new Set<string>()
    rows.forEach(r => { const g = r.expand?.studentId?.grade; if (g) s.add(formatGrade(g)) })
    return Array.from(s).sort()
  }, [rows])

  const filtered = useMemo(
    () => (grade === "all" ? rows : rows.filter(r => formatGrade(r.expand?.studentId?.grade) === grade)),
    [rows, grade]
  )

  // 每天笔数
  const byDay = useMemo(() => {
    const m: Record<string, Rec[]> = {}
    filtered.forEach(r => {
      const d = String(r.pickup_date || "").slice(0, 10)
      if (!d) return
      ;(m[d] = m[d] || []).push(r)
    })
    return m
  }, [filtered])

  const [y, mo] = month.split("-").map(Number)
  const first = new Date(y, mo - 1, 1)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const offset = (first.getDay() + 6) % 7 // 周一起始

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const pad = (n: number) => String(n).padStart(2, "0")
  const dateKey = (day: number) => `${month}-${pad(day)}`

  const dayRows = picked ? (byDay[picked] || []) : []
  const lateCount = filtered.filter(r => isLatePickup(r.pickup_time)).length
  const people = new Set(filtered.map(r => r.expand?.studentId?.id || r.id)).size

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />{t("接送日历")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 筛选 */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <Label className="text-xs">{t("年级")}</Label>
            <select className="h-9 rounded-md border px-2 text-sm" value={grade} onChange={e => { setGrade(e.target.value); setPicked("") }}>
              <option value="all">{t("全部年级")}</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">{t("月份")}</Label>
            <Input type="month" className="h-9 w-[160px]" value={month} onChange={e => { setMonth(e.target.value || ymOf(new Date())); setPicked("") }} />
          </div>
          <div className="flex flex-wrap items-center gap-3 pb-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{t("本月接送")} <b className="text-foreground">{filtered.length}</b> {t("笔")}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t("涉及")} <b className="text-foreground">{people}</b> {t("人")}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t("迟到")} <b className="text-foreground">{lateCount}</b> {t("笔")}</span>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <div className="py-6 text-center text-sm text-red-600">{error}</div>
        ) : (
          <>
            {/* 月历 */}
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50 text-center text-xs text-muted-foreground">
                {WD.map(w => <div key={w} className="py-1.5">{t(w)}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} className="h-16 border-t border-r bg-gray-50/40" />
                  const key = dateKey(day)
                  const n = (byDay[key] || []).length
                  const active = picked === key
                  const late = (byDay[key] || []).some(r => isLatePickup(r.pickup_time))
                  const lateNames = (byDay[key] || [])
                    .filter(r => isLatePickup(r.pickup_time))
                    .map(r => r.expand?.studentId?.name || t("未知"))
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPicked(active ? "" : key)}
                      className={`min-h-20 border-t border-r p-1.5 text-left align-top transition ${active ? "bg-indigo-50 ring-1 ring-inset ring-indigo-400" : "hover:bg-gray-50"} ${n === 0 ? "text-muted-foreground" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium">{day}</span>
                        {n > 0 && (
                          <span className={`rounded px-1 text-[10px] font-semibold ${late ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                            {n}
                          </span>
                        )}
                      </div>
                      {lateNames.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {lateNames.slice(0, 3).map((nm, k) => (
                            <div key={k} className="truncate text-[10px] font-semibold leading-tight text-red-600" title={nm}>
                              {nm}
                            </div>
                          ))}
                          {lateNames.length > 3 && (
                            <div className="text-[10px] leading-tight text-red-500">+{lateNames.length - 3}</div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 某天明细 */}
            {picked && (
              <div className="rounded-lg border">
                <div className="border-b bg-gray-50 px-3 py-2 text-sm font-medium">{picked} · {dayRows.length} {t("笔")}</div>
                {dayRows.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">{t("当天没有接送记录")}</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2">{t("时间")}</th>
                        <th className="px-3 py-2">{t("学生")}</th>
                        <th className="px-3 py-2">{t("年级")}</th>
                        <th className="px-3 py-2">{t("接人者")}</th>
                        <th className="px-3 py-2">{t("状态")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayRows
                        .slice()
                        .sort((a, b) => String(a.pickup_time).localeCompare(String(b.pickup_time)))
                        .map(r => (
                          <tr key={r.id} className="border-b last:border-0">
                            <td className={`px-3 py-2 font-mono text-xs ${isLatePickup(r.pickup_time) ? "text-red-600 font-bold" : ""}`}>{r.pickup_time || "-"}</td>
                            <td className="px-3 py-2">{r.expand?.studentId?.name || "-"}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{formatGrade(r.expand?.studentId?.grade)}</td>
                            <td className="px-3 py-2">{r.pickup_by || "-"}</td>
                            <td className="px-3 py-2">
                              <Badge className={
                                r.status === "picked_up" && isLatePickup(r.pickup_time) ? "bg-red-100 text-red-700"
                                  : r.status === "picked_up" ? "bg-emerald-100 text-emerald-700"
                                  : r.status === "delayed" ? "bg-amber-100 text-amber-700"
                                  : r.status === "cancelled" ? "bg-slate-100 text-slate-500"
                                  : "bg-blue-100 text-blue-700"
                              }>
                                {t(r.status === "picked_up" ? "已接走" : r.status === "delayed" ? "延迟" : r.status === "cancelled" ? "取消" : "已安排")}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">{t("这个月还没有接送记录")}</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
