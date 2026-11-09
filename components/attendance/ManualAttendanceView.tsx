"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, RefreshCw, Search, UserCheck, CalendarDays } from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { gradeLabel, gradeRank } from "@/lib/grades"
import { useLanguage } from "@/contexts/language-context";

/**
 * 手动点名 —— 按纸质点名表的格式（一行一个学生，横着一整月的格子）显示出席情况。
 * 右上角「点名」按一下，弹窗勾今天到了哪几个，直接写考勤（等同签到，积分照规则发）。
 */

const CENTERS = ["全部", "PU1", "BATU14"]

const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const pad2 = (n: number) => String(n).padStart(2, "0")

interface AttRecord {
  id: string
  person_id: string
  person_name: string
  date: string
  status: string
  check_in: string | null
}

export default function ManualAttendanceView() {
  const { t } = useLanguage();
  const { students, loading: studentsLoading } = useStudents()
  const [month, setMonth] = useState(() => localDay().slice(0, 7)) // YYYY-MM
  const [center, setCenter] = useState("全部")
  const [keyword, setKeyword] = useState("")
  const [records, setRecords] = useState<AttRecord[]>([])
  const [loading, setLoading] = useState(true)

  // 点名弹窗
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [q, setQ] = useState("")
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string>("")

  const today = localDay()
  const [y, m] = month.split("-").map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // ── 当月考勤 ────────────────────────────────
  const loadMonth = useCallback(async () => {
    setLoading(true)
    try {
      const lo = `${month}-01`
      const hi = `${month}-${pad2(daysInMonth)}`
      const res = await fetch(
        `/api/attendance/logs?type=student&startDate=${lo}&endDate=${hi}&pageSize=5000`,
        { cache: "no-store" },
      )
      const json = await res.json()
      setRecords(Array.isArray(json?.records) ? json.records : Array.isArray(json?.data) ? json.data : [])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [month, daysInMonth])

  useEffect(() => { loadMonth() }, [loadMonth])

  // studentId → 当月每一天的出席
  const grid = useMemo(() => {
    const g: Record<string, Record<number, string>> = {}
    for (const r of records) {
      const d = new Date(r.date)
      if (Number.isNaN(d.getTime())) continue
      const day = d.getDate()
      const sid = r.person_id
      if (!sid) continue
      g[sid] = g[sid] || {}
      // 有记录就算出席；status 缺省也按出席（老数据全是 present）
      g[sid][day] = r.status || "present"
    }
    return g
  }, [records])

  const todayMarked = useMemo(() => {
    const s = new Set<string>()
    for (const r of records) {
      const d = new Date(r.date)
      if (Number.isNaN(d.getTime())) continue
      if (localDay(d) !== today) continue
      s.add(r.person_id)
    }
    return s
  }, [records, today])

  // ── 名单：分组 + 过滤 ──────────────────────
  const roster = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const list = students.filter((s: any) => {
      if ((s.status || "active") === "inactive") return false
      if (center !== "全部" && (s.center || "") !== center) return false
      if (kw) {
        const hay = `${s.name || ""} ${s.student_id || ""} ${gradeLabel(s.grade, s.is_peralihan)}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
    const groups: Record<string, any[]> = {}
    for (const s of list) {
      const g = gradeLabel(s.grade, s.is_peralihan) || "未分年级"
      ;(groups[g] = groups[g] || []).push(s)
    }
    return Object.entries(groups)
      .sort((a, b) => gradeRank(a[0]) - gradeRank(b[0]))
      .map(([g, items]) => ({
        grade: g,
        items: items.sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || ""))),
      }))
  }, [students, center, keyword])

  const totalStudents = roster.reduce((n, g) => n + g.items.length, 0)

  // 弹窗里的名单：跟主表一样的过滤，但搜索另用一个框
  const pickList = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return students
      .filter((s: any) => (s.status || "active") !== "inactive")
      .filter((s: any) => center === "全部" || (s.center || "") === center)
      .filter((s: any) => {
        if (!kw) return true
        const hay = `${s.name || ""} ${s.student_id || ""} ${gradeLabel(s.grade, s.is_peralihan)}`.toLowerCase()
        return hay.includes(kw)
      })
      .sort((a: any, b: any) => {
        const d = gradeRank(gradeLabel(a.grade, a.is_peralihan)) - gradeRank(gradeLabel(b.grade, b.is_peralihan))
        return d !== 0 ? d : String(a.name || "").localeCompare(String(b.name || ""))
      })
  }, [students, center, q])

  const openDialog = () => {
    setPicked(new Set())
    setQ("")
    setResult("")
    setOpen(true)
  }

  const toggle = (id: string) => {
    setPicked((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const submit = async () => {
    if (!picked.size) return
    setSaving(true)
    let ok = 0
    let skipped = 0
    let failed = 0
    for (const s of pickList.filter((x: any) => picked.has(x.id))) {
      try {
        const res = await fetch("/api/attendance/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            person_id: s.id,
            person_type: "student",
            person_name: s.name,
            center: s.center || (center === "全部" ? "BATU14" : center),
            method: "manual",
            notes: "手动点名",
          }),
        })
        const json = await res.json()
        if (json?.success) ok++
        else skipped++
      } catch {
        failed++
      }
    }
    setSaving(false)
    setResult(`点名完成：记录 ${ok} 人${skipped ? `，已有记录跳过 ${skipped} 人` : ""}${failed ? `，失败 ${failed} 人` : ""}`)
    setPicked(new Set())
    await loadMonth()
  }

  const todayLabel = `${m} 月 ${Number(today.slice(8, 10))} 日`

  return (
    <div className="space-y-4">
      {/* ── 工具条 ───────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 rounded-md border border-slate-300 px-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-1 rounded-md border border-slate-300 p-0.5">
            {CENTERS.map((c) => (
              <button
                key={c}
                onClick={() => setCenter(c)}
                className={`rounded px-2.5 py-1 text-xs ${center === c ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("搜学生姓名 / 学号")}
              className="h-9 w-56 pl-8"
            />
          </div>

          <Button variant="outline" size="sm" onClick={loadMonth} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
            {t("刷新")}
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {t("共")} {totalStudents} {t("人 · 本月已记录")} {records.length} {t("条")}
            </span>
            <Button onClick={openDialog} className="gap-1">
              <UserCheck className="h-4 w-4" />
              {t("点名")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 点名表 ───────────────────────── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-20 w-10 border-b border-r bg-slate-50 px-2 py-2 text-left font-medium text-slate-500">No</th>
                <th className="sticky left-10 z-20 min-w-[190px] border-b border-r bg-slate-50 px-2 py-2 text-left font-medium text-slate-500">{t("姓名")}</th>
                {days.map((d) => {
                  const dow = new Date(y, m - 1, d).getDay()
                  const isWeekend = dow === 0 || dow === 6
                  const isToday = `${month}-${pad2(d)}` === today
                  return (
                    <th
                      key={d}
                      className={`w-7 border-b px-0 py-2 text-center font-normal ${
                        isToday ? "bg-amber-100 text-amber-900" : isWeekend ? "bg-slate-100 text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {d}
                    </th>
                  )
                })}
                <th className="w-12 border-b border-l px-1 py-2 text-center font-medium text-slate-500">{t("出勤")}</th>
              </tr>
            </thead>
            <tbody>
              {loading || studentsLoading ? (
                <tr>
                  <td colSpan={daysInMonth + 3} className="py-16 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    {t("正在读取考勤…")}
                  </td>
                </tr>
              ) : totalStudents === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 3} className="py-16 text-center text-slate-400">
                    {t("没有符合条件的学生")}
                  </td>
                </tr>
              ) : (
                roster.map((group) => (
                  <Fragment key={group.grade}>
                    <tr className="bg-slate-100/80">
                      <td colSpan={daysInMonth + 3} className="sticky left-0 px-2 py-1.5 text-[11px] font-semibold tracking-wide text-slate-600">
                        {t(group.grade)} · {group.items.length} {t("人")}
                      </td>
                    </tr>
                    {group.items.map((s: any, idx: number) => {
                      const row = grid[s.id] || {}
                      const count = Object.keys(row).length
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="sticky left-0 z-10 border-b border-r bg-white px-2 py-1 text-slate-400">{idx + 1}</td>
                          <td className="sticky left-10 z-10 max-w-[190px] truncate border-b border-r bg-white px-2 py-1">
                            <span className="font-medium text-slate-800">{s.name}</span>
                            {s.student_id ? <span className="ml-1.5 text-[10px] text-slate-400">{s.student_id}</span> : null}
                          </td>
                          {days.map((d) => {
                            const st = row[d]
                            const isToday = `${month}-${pad2(d)}` === today
                            return (
                              <td
                                key={d}
                                className={`border-b px-0 py-1 text-center ${isToday ? "bg-amber-50" : ""}`}
                                title={st ? `${s.name} ${month}-${pad2(d)} 出席` : ""}
                              >
                                {st === "present" ? (
                                  <span className="mx-auto block h-3.5 w-3.5 rounded-sm bg-emerald-500" />
                                ) : st === "absent" ? (
                                  <span className="mx-auto block h-3.5 w-3.5 rounded-sm bg-rose-400" />
                                ) : st ? (
                                  <span className="mx-auto block h-3.5 w-3.5 rounded-sm bg-sky-400" />
                                ) : null}
                              </td>
                            )
                          })}
                          <td className="border-b border-l px-1 py-1 text-center font-medium text-slate-700">{count || ""}</td>
                        </tr>
                      )
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center gap-4 px-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" />{t("出席")}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-rose-400" />{t("缺勤")}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-sky-400" />{t("请假 / 其他")}</span>
        <span>{t("橙色的那一列 = 今天")}</span>
      </div>

      {/* ── 点名弹窗 ─────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("点名 ·")} {todayLabel} {t("早上")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("搜名字 / 学号")} className="h-9 pl-8" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPicked(new Set(pickList.filter((s: any) => !todayMarked.has(s.id)).map((s: any) => s.id)))
                }
              >
                {t("全选未点名")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPicked(new Set())}>{t("清空")}</Button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto rounded-md border">
              {pickList.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">{t("没有学生")}</div>
              ) : (
                pickList.map((s: any) => {
                  const done = todayMarked.has(s.id)
                  return (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 ${
                        done ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        disabled={done}
                        checked={done || picked.has(s.id)}
                        onChange={() => toggle(s.id)}
                      />
                      <span className="flex-1 truncate text-sm text-slate-800">{s.name}</span>
                      <span className="text-[11px] text-slate-400">{s.student_id}</span>
                      <span className="w-20 text-[11px] text-slate-500">{gradeLabel(s.grade, s.is_peralihan)}</span>
                      <span className="w-14 text-[11px] text-slate-400">{s.center || ""}</span>
                      {done ? <Badge variant="secondary" className="text-[10px]">{t("已点名")}</Badge> : null}
                    </label>
                  )
                })
              )}
            </div>

            {result ? (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{result}</div>
            ) : null}
          </div>

          <DialogFooter className="items-center gap-2">
            <span className="mr-auto text-xs text-slate-500">
              {t("已勾")} {picked.size} {t("人")}{picked.size ? "" : "（勾名字 = 今天有来）"}
            </span>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("关掉")}</Button>
            <Button onClick={submit} disabled={!picked.size || saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {t("确认点名")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
