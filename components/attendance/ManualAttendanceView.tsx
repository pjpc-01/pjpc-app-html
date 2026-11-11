"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, RefreshCw, Search, UserCheck, CalendarDays, Nfc } from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { useLanguage } from "@/contexts/language-context"
import { gradeLabel, gradeRank } from "@/lib/grades"

/**
 * 手动点名 —— 跟刷卡打卡是两套记录，互不改写。
 *
 *  · 打卡 = 学生自己刷 NFC（student_attendance），刷不刷看学生愿不愿意
 *  · 点名 = 老师实际看到谁来了（roll_call），没来的按缺勤扣分
 *
 * 页面按纸质点名表排：一人一行，横着一整月，绿=点名出席 红=点名缺勤 蓝=请假。
 */

/** 分行只按学生资料里实际出现的 center 取，写死会让新分行看不到 */
const PU1_FIRST = (a: string, b: string) => (a === "PU1" ? -1 : b === "PU1" ? 1 : a.localeCompare(b))

const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const pad2 = (n: number) => String(n).padStart(2, "0")

interface RollRow {
  id: string
  student_id: string
  student_name: string
  date: string
  status: string
}

export default function ManualAttendanceView() {
  const { t } = useLanguage()
  const { students, loading: studentsLoading } = useStudents()
  const [month, setMonth] = useState(() => localDay().slice(0, 7))
  const [center, setCenter] = useState("") // 空 = 还没选，加载后自动选第一个分行
  const [keyword, setKeyword] = useState("")
  const [rows, setRows] = useState<RollRow[]>([])
  const [nfcToday, setNfcToday] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null) // 手机上展开某人的整月格子

  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [markAbsentRest, setMarkAbsentRest] = useState(false)
  const [q, setQ] = useState("")
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState("")

  const centers = useMemo(() => {
    const set = new Set<string>()
    for (const s of students as any[]) {
      const c = String(s?.center || "").trim()
      if (c) set.add(c)
    }
    const arr = Array.from(set).sort(PU1_FIRST)
    return arr.length > 0 ? arr : ["PU1"]
  }, [students])

  useEffect(() => {
    if (!center && centers.length > 0) setCenter(centers[0])
  }, [center, centers])

  const today = localDay()
  const todayDay = Number(today.slice(8, 10))
  const [y, m] = month.split("-").map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // ── 当月点名记录 ────────────────────────────
  const loadMonth = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/attendance/roll-call?startDate=${month}-01&endDate=${month}-${pad2(daysInMonth)}`,
        { cache: "no-store" },
      )
      const json = await res.json()
      setRows(Array.isArray(json?.records) ? json.records : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [month, daysInMonth])

  // 今天谁刷了卡 —— 只做对照用，不参与点名判断
  const loadNfcToday = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendance/logs?type=student&date=${today}&pageSize=2000`, { cache: "no-store" })
      const json = await res.json()
      const s = new Set<string>()
      for (const r of json?.records || []) if (r.person_id) s.add(r.person_id)
      setNfcToday(s)
    } catch {
      setNfcToday(new Set())
    }
  }, [today])

  useEffect(() => { loadMonth() }, [loadMonth])
  useEffect(() => { loadNfcToday() }, [loadNfcToday])

  const grid = useMemo(() => {
    const g: Record<string, Record<number, string>> = {}
    for (const r of rows) {
      const d = new Date(r.date)
      if (Number.isNaN(d.getTime()) || !r.student_id) continue
      g[r.student_id] = g[r.student_id] || {}
      g[r.student_id][d.getDate()] = r.status || "present"
    }
    return g
  }, [rows])

  // 今天已经点过名的人（出席/缺勤分开），重新点名时不许把他们翻面
  const { todayDone, todayPresent } = useMemo(() => {
    const done = new Set<string>()
    const present = new Set<string>()
    for (const r of rows) {
      const d = new Date(r.date)
      if (Number.isNaN(d.getTime())) continue
      if (localDay(d) !== today) continue
      done.add(r.student_id)
      if ((r.status || "present") === "present") present.add(r.student_id)
    }
    return { todayDone: done, todayPresent: present }
  }, [rows, today])

  const roster = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const list = students.filter((s: any) => {
      // 只点名在读学生：已停课(withdrawn) / 已毕业(graduated) / 已删(deleted) 都不该出现
      if ((s.status || "active") !== "active") return false
      if (center && (s.center || "") !== center) return false
      if (kw) {
        const hay = `${s.name || ""} ${s.student_id || ""} ${gradeLabel(s.grade, s.is_peralihan)}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
    const groups: Record<string, any[]> = {}
    for (const s of list) {
      const g = gradeLabel(s.grade, s.is_peralihan) || t("未分年级")
      ;(groups[g] = groups[g] || []).push(s)
    }
    return Object.entries(groups)
      .sort((a, b) => gradeRank(a[0]) - gradeRank(b[0]))
      .map(([g, items]) => ({
        grade: g,
        items: items.sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || ""))),
      }))
  }, [students, center, keyword, t])

  const totalStudents = roster.reduce((n, g) => n + g.items.length, 0)

  // 点名范围 = 当前中心的所有在职学生。不受搜索框影响，否则被搜掉的人会被误记缺勤。
  const scope = useMemo(
    () => students.filter((s: any) => (s.status || "active") === "active" && (!center || (s.center || "") === center)),
    [students, center],
  )

  const pickList = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return scope
      .filter((s: any) => {
        if (!kw) return true
        const hay = `${s.name || ""} ${s.student_id || ""} ${gradeLabel(s.grade, s.is_peralihan)}`.toLowerCase()
        return hay.includes(kw)
      })
      .sort((a: any, b: any) => {
        const d = gradeRank(gradeLabel(a.grade, a.is_peralihan)) - gradeRank(gradeLabel(b.grade, b.is_peralihan))
        return d !== 0 ? d : String(a.name || "").localeCompare(String(b.name || ""))
      })
  }, [scope, q])

  const openDialog = () => {
    // 今天已经点过「出席」的人先勾好，否则第二次点名会把他们算成缺勤
    setPicked(new Set(todayPresent))
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

  // 缺勤范围固定按「本中心全部在职学生」算，不受搜索框影响 ——
  // 以前用搜索结果算，搜了 Wong 再点名，其他人就被漏掉，且范围随搜索变，容易误操作
  const absentScope = useMemo(
    () => scope.filter((s: any) => !picked.has(s.id) && !todayDone.has(s.id)),
    [scope, picked, todayDone],
  )

  const submit = async () => {
    const present = scope.filter((s: any) => picked.has(s.id)).map((s: any) => s.id)
    const absent = markAbsentRest ? absentScope.map((s: any) => s.id) : []
    if (!present.length && !absent.length) return
    if (absent.length) {
      const ok = window.confirm(`这次会把 ${absent.length} 人记为缺勤并按规则扣分，确定吗？`)
      if (!ok) return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/attendance/roll-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, center: center || "", present, absent }),
      })
      const json = await res.json()
      if (json?.success) {
        setResult(
          `${t("点名完成：出席")} ${json.present} ${t("人，缺勤")} ${json.absent} ${t("人")}` +
            (json.deducted ? t("，扣分") + ` ${json.deducted} ` + t("人") : "") +
            (json.deduct_skipped ? t("，已扣过跳过") + ` ${json.deduct_skipped} ` + t("人") : "") +
            (json.errors?.length ? t("，失败") + ` ${json.errors.length} ` + t("人") : ""),
        )
        setPicked(new Set())
        await loadMonth()
      } else {
        setResult(`${t("点名失败：")}${json?.error || t("未知错误")}`)
      }
    } catch (e: any) {
      setResult(`${t("点名失败：")}${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const todayLabel = `${m} 月 ${Number(today.slice(8, 10))} 日`

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-3 md:gap-3 md:p-4">
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
            {centers.map((c) => (
              <button
                key={c}
                onClick={() => setCenter(c)}
                className={`rounded px-2.5 py-1 text-xs ${center === c ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {t(c)}
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

          <Button variant="outline" size="sm" onClick={() => { loadMonth(); loadNfcToday() }} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
            {t("刷新")}
          </Button>

          <div className="flex w-full items-center gap-3 md:ml-auto md:w-auto">
            <span className="text-xs text-slate-500">
              {t("共")} {totalStudents} {t("人")} · {t("本月已点名")} {rows.length} {t("条")}
            </span>
            <Button onClick={openDialog} className="ml-auto h-10 gap-1 px-4 md:ml-0 md:h-9">
              <UserCheck className="h-4 w-4" />
              {t("点名")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden overflow-hidden md:block">
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
                    {t("正在读取点名记录…")}
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
                      const count = Object.values(row).filter((v) => v === "present").length
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
                              <td key={d} className={`border-b px-0 py-1 text-center ${isToday ? "bg-amber-50" : ""}`}>
                                {st === "present" ? (
                                  <span className="mx-auto block h-3.5 w-3.5 rounded-sm bg-emerald-500" />
                                ) : st === "absent" ? (
                                  <span className="mx-auto block h-3.5 w-3.5 rounded-sm bg-rose-400" />
                                ) : st === "leave" ? (
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

      {/* ── 手机：一人一张卡，点一下展开整月格子 ── */}
      <div className="space-y-3 md:hidden">
        {loading || studentsLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            {t("正在读取点名记录…")}
          </div>
        ) : totalStudents === 0 ? (
          <div className="py-16 text-center text-slate-400">{t("没有符合条件的学生")}</div>
        ) : (
          roster.map((group) => (
            <div key={group.grade}>
              <div className="px-1 pb-1 text-[11px] font-semibold text-slate-500">
                {t(group.grade)} · {group.items.length} {t("人")}
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {group.items.map((s: any) => {
                  const row = grid[s.id] || {}
                  const st = row[todayDay]
                  const count = Object.values(row).filter((v) => v === "present").length
                  const isOpen = expanded === s.id
                  const dot = st === "present" ? "bg-emerald-500" : st === "absent" ? "bg-rose-400" : st === "leave" ? "bg-sky-400" : "bg-slate-200"
                  return (
                    <div key={s.id} className="border-b border-slate-100 last:border-b-0">
                      <button
                        onClick={() => setExpanded(isOpen ? null : s.id)}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50"
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800" title={s.name}>{s.name}</span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {s.student_id ? s.student_id + " · " : ""}{s.center || ""} · {t("出勤")} {count}
                          </span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          st === "present" ? "bg-emerald-50 text-emerald-700"
                            : st === "absent" ? "bg-rose-50 text-rose-600"
                            : st === "leave" ? "bg-sky-50 text-sky-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {st === "present" ? t("出席") : st === "absent" ? t("缺勤") : st === "leave" ? t("请假 / 其他") : t("未点名")}
                        </span>
                      </button>
                      {isOpen ? (
                        <div className="grid gap-1 border-t border-slate-100 bg-slate-50/70 p-2" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                          {days.map((d) => {
                            const v = row[d]
                            const isToday = d === todayDay
                            return (
                              <div key={d} className={`flex flex-col items-center rounded ${isToday ? "bg-amber-100" : ""}`}>
                                <span className="text-[9px] text-slate-400">{d}</span>
                                <span className={`mt-0.5 h-3.5 w-3.5 rounded-sm ${
                                  v === "present" ? "bg-emerald-500" : v === "absent" ? "bg-rose-400" : v === "leave" ? "bg-sky-400" : "bg-slate-200"
                                }`} />
                              </div>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" />{t("点名出席")}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-rose-400" />{t("点名缺勤")}</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-sky-400" />{t("请假 / 其他")}</span>
        <span>{t("橙色的那一列 = 今天")}</span>
        <span className="text-slate-400">{t("点名和刷卡打卡是两套记录，互不改写")}</span>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex w-full max-w-2xl flex-col" style={{ maxHeight: "92vh" }}>
          <DialogHeader>
            <DialogTitle>{t("点名 ·")} {todayLabel}</DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("搜名字 / 学号")} className="h-9 pl-8" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPicked(new Set(pickList.filter((s: any) => nfcToday.has(s.id)).map((s: any) => s.id)))}
                title={t("把今天已经刷卡的人先勾上，再补勾没刷卡的")}
              >
                {t("勾上已刷卡的人")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPicked(new Set())}>{t("清空")}</Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
              {pickList.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">{t("没有学生")}</div>
              ) : (
                pickList.map((s: any) => {
                  const done = todayDone.has(s.id)
                  return (
                    <label key={s.id} className={`flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 ${done ? "bg-slate-50" : "hover:bg-slate-50"}`}>
                      <input type="checkbox" className="h-4 w-4" checked={picked.has(s.id)} onChange={() => toggle(s.id)} />
                      <span className="flex-1 truncate text-sm text-slate-800">{s.name}</span>
                      <span className="text-[11px] text-slate-400">{s.student_id}</span>
                      <span className="w-20 text-[11px] text-slate-500">{gradeLabel(s.grade, s.is_peralihan)}</span>
                      <span className="w-14 text-[11px] text-slate-400">{s.center || ""}</span>
                      {nfcToday.has(s.id) ? (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Nfc className="h-3 w-3" />
                          {t("已刷卡")}
                        </Badge>
                      ) : null}
                      {done ? <Badge variant="outline" className="text-[10px]">{t("已点名")}</Badge> : null}
                    </label>
                  )
                })
              )}
            </div>

            <label className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <input type="checkbox" className="h-4 w-4" checked={markAbsentRest} onChange={(e) => setMarkAbsentRest(e.target.checked)} />
              {t("没勾的人记为缺勤，并按规则扣分")}
              {t("（")}{t("本次范围")} {scope.length} {t("人")}
              {todayDone.size ? `，${t("今天已点过名")} ${todayDone.size} ${t("人不重复算")}` : ""}{t("）")}
            </label>

            {result ? (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{result}</div>
            ) : null}
          </div>

          <DialogFooter className="items-center gap-2">
            <span className="mr-auto text-xs text-slate-500">
              {t("已勾")} {picked.size} {t("人")} · {t("缺勤")} {markAbsentRest ? absentScope.length : 0} {t("人")}
            </span>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("关掉")}</Button>
            <Button onClick={submit} disabled={saving || picked.size === 0}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {t("确认点名")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
