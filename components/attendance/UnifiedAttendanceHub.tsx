"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  SmartphoneNfc, Users, Clock, RefreshCw, Search, X,
  Loader2, GraduationCap, User, LogIn, LogOut, BarChart3, ChevronLeft, ChevronRight, CalendarDays,
} from "lucide-react"
import NfcTapReader from "./NfcTapReader"

// ─── Types ─────────────────────────────────────────────

interface ScanRecord {
  id: string; person_id: string; person_name: string; person_type: "student" | "teacher"
  center: string; action: string; action_key: string; timestamp: string; date: string; method: string; notes: string
}

interface ReportItem {
  person_id: string; person_name: string; person_type: string; center: string
  check_in: string | null; check_out: string | null; total_scans: number
}

interface ReportStats { total: number; checkedIn: number; checkedOut: number; notCheckedIn: number }

// ─── Main ──────────────────────────────────────────────

export default function UnifiedAttendanceHub() {
  const [records, setRecords] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showNfc, setShowNfc] = useState(false)
  const [dateFilter, setDateFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [report, setReport] = useState<ReportItem[]>([])
  const [reportStats, setReportStats] = useState<ReportStats>({ total: 0, checkedIn: 0, checkedOut: 0, notCheckedIn: 0 })
  const [reportLoading, setReportLoading] = useState(true)
  const [reportTab, setReportTab] = useState<"today" | "calendar">("today")

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type: typeFilter, pageSize: "50" })
      if (dateFilter) params.set("date", dateFilter)
      const res = await fetch(`/api/attendance/logs?${params}`)
      const data = await res.json()
      if (data.success) setRecords(data.records || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [dateFilter, typeFilter])

  const fetchReport = useCallback(async () => {
    setReportLoading(true)
    try {
      const params = new URLSearchParams({ date: dateFilter, type: typeFilter })
      const res = await fetch(`/api/attendance/report?${params}`)
      const data = await res.json()
      if (data.success) { setReport(data.report || []); setReportStats(data.stats || { total: 0, checkedIn: 0, checkedOut: 0, notCheckedIn: 0 }) }
    } catch (err) { console.error(err) }
    finally { setReportLoading(false) }
  }, [dateFilter, typeFilter])

  useEffect(() => { fetchRecords(); fetchReport() }, [fetchRecords, fetchReport])

  useEffect(() => {
    const interval = setInterval(() => { fetchRecords(); fetchReport() }, 30000)
    return () => clearInterval(interval)
  }, [fetchRecords, fetchReport])

  const fmtTime = (iso: string | null) => {
    if (!iso) return "—"
    try { return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) }
    catch { return iso.slice(11, 16) }
  }

  const fmtTimeSec = (iso: string) => {
    if (!iso) return "—"
    try { return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }
    catch { return iso.slice(11, 19) }
  }

  const calcDuration = (ci: string | null, co: string | null) => {
    if (!ci || !co) return "—"
    const diff = new Date(co).getTime() - new Date(ci).getTime()
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const checkIns = records.filter(r => r.action_key === "check_in").length
  const checkOuts = records.filter(r => r.action_key === "check_out").length
  const uniquePeople = new Set(records.map(r => r.person_id)).size

  return (
    <div className="space-y-4">
      {/* Live stats — always shown */}
      <div className="grid grid-cols-3 gap-3">
        {[{ icon: Users, color: "text-blue-500", label: "打卡人数", val: uniquePeople, vc: "" },
          { icon: LogIn, color: "text-green-500", label: "签到", val: checkIns, vc: "text-green-600" },
          { icon: LogOut, color: "text-amber-500", label: "签退", val: checkOuts, vc: "text-amber-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border px-3 py-2 flex items-center gap-2">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div><p className="text-[10px] text-gray-400">{s.label}</p><p className={`text-lg font-bold ${s.vc}`}>{s.val}</p></div>
          </div>
        ))}
      </div>

      {/* NFC + Live Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-full">
          <div className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 border bg-green-50 border-green-200 text-green-700 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium text-xs">💳 USB 读卡器全局启动 — 任何页面刷卡自动打卡</span>
          </div>
          {showNfc ? <NfcTapReader /> : (
            <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-white h-[calc(100%-2.5rem)]">
              <CardContent className="p-4 text-center h-full flex flex-col items-center justify-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <SmartphoneNfc className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-base font-bold text-gray-700 mb-2">手机 NFC 打卡</h3>
                <p className="text-sm text-gray-400 mb-4">Android Chrome 可用</p>
                <Button onClick={() => setShowNfc(true)} size="sm" variant="outline" className="text-blue-600 border-blue-300">
                  <SmartphoneNfc className="h-4 w-4 mr-1" /> 打开
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" /> 实时打卡
                <Badge variant="secondary" className="text-[10px]">{records.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-1">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-xs border rounded px-2 py-1 h-7 bg-white">
                  <option value="all">全部</option><option value="student">学生</option><option value="teacher">教师</option>
                </select>
                <Button variant="ghost" size="sm" onClick={() => { fetchRecords(); fetchReport() }} className="h-7 w-7 p-0"><RefreshCw className="h-3.5 w-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="text-center py-12"><Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-500" /></div>
              : records.length === 0 ? <div className="text-center py-12 text-gray-400"><Clock className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">刷卡后自动出现</p></div>
              : <div className="max-h-[320px] overflow-y-auto">
                  {records.map(rec => (
                    <div key={rec.id} className="flex items-center gap-3 px-4 py-2 border-b border-gray-50 hover:bg-gray-50">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${rec.person_type === "teacher" ? "bg-purple-100" : "bg-blue-100"}`}>
                        {rec.person_type === "teacher" ? <User className="h-3.5 w-3.5 text-purple-500" /> : <GraduationCap className="h-3.5 w-3.5 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{rec.person_name}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{rec.person_type === "teacher" ? "教师" : "学生"}</Badge>
                      </div></div>
                      <Badge className={`text-[10px] ${rec.action_key === "check_in" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{rec.action}</Badge>
                      <span className="text-xs text-gray-400 w-14 text-right tabular-nums">{fmtTimeSec(rec.timestamp)}</span>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== 考勤报告 (tabs: 今日 | 日历) ===== */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setReportTab("today")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    reportTab === "today" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >今日考勤</button>
                <button
                  onClick={() => setReportTab("calendar")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    reportTab === "calendar" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >考勤日历</button>
              </div>
              {reportTab === "today" && (
                <input
                  type="date" value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="text-xs border rounded px-2 py-1 h-7 bg-white"
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reportTab === "today" ? (
              <TodayReport report={report} reportStats={reportStats} reportLoading={reportLoading} fmtTime={fmtTime} calcDuration={calcDuration} />
            ) : (
              <CalendarReport />
            )}
          </CardContent>
        </Card>
    </div>
  )
}

// ─── 今日考勤 ──────────────────────────────────────────

function TodayReport({ report, reportStats, reportLoading, fmtTime, calcDuration }: {
  report: ReportItem[]; reportStats: ReportStats; reportLoading: boolean
  fmtTime: (iso: string | null) => string; calcDuration: (ci: string | null, co: string | null) => string
}) {
  return (
    <>
      <div className="grid grid-cols-4 gap-px bg-gray-100">
        {[{ l: "总人数", v: reportStats.total, c: "text-blue-600" },
          { l: "已签到", v: reportStats.checkedIn, c: "text-green-600" },
          { l: "已签退", v: reportStats.checkedOut, c: "text-amber-600" },
          { l: "未签到", v: reportStats.notCheckedIn, c: "text-red-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white px-3 py-2 text-center">
            <p className="text-[10px] text-gray-400">{s.l}</p>
            <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>
      {reportLoading ? <div className="text-center py-8"><Loader2 className="h-5 w-5 mx-auto animate-spin text-blue-500" /></div>
      : report.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">当日暂无考勤数据</div>
      : <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b sticky top-0">
              {["姓名","身份","中心","签到","签退","时长","次数"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {report.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2"><div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.person_type === "teacher" ? "bg-purple-100" : "bg-blue-100"}`}>
                      {item.person_type === "teacher" ? <User className="h-3 w-3 text-purple-500" /> : <GraduationCap className="h-3 w-3 text-blue-500" />}
                    </div>
                    <span className="font-medium text-gray-900 text-xs">{item.person_name}</span>
                  </div></td>
                  <td className="px-4 py-2"><Badge variant="outline" className="text-[10px]">{item.person_type === "teacher" ? "教师" : "学生"}</Badge></td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{item.center || "—"}</td>
                  <td className="px-4 py-2"><span className={`font-mono text-xs ${item.check_in ? "text-green-600" : "text-red-400"}`}>{fmtTime(item.check_in)}</span></td>
                  <td className="px-4 py-2"><span className={`font-mono text-xs ${item.check_out ? "text-amber-600" : "text-gray-400"}`}>{fmtTime(item.check_out)}</span></td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{calcDuration(item.check_in, item.check_out)}</td>
                  <td className="px-4 py-2 text-center"><Badge variant="secondary" className="text-[10px]">{item.total_scans}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </>
  )
}

// ─── 考勤日历 ──────────────────────────────────────────

function CalendarReport() {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [selected, setSelected] = useState<{ id: string; name: string; type: string } | null>(null)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [calendar, setCalendar] = useState<Record<string, { check_ins: string[]; check_outs: string[] }>>({})
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return }
    try {
      const res = await fetch(`/api/search-persons?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.success) setResults([...data.students, ...data.teachers].slice(0, 8))
    } catch { setResults([]) }
  }, [])

  const loadCalendar = useCallback(async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance/person-calendar?person_id=${selected.id}&person_type=${selected.type}&month=${month}`)
      const data = await res.json()
      if (data.success) setCalendar(data.calendar || {})
    } catch { setCalendar({}) }
    finally { setLoading(false) }
  }, [selected, month])

  useEffect(() => { loadCalendar() }, [loadCalendar])

  const [y, mn] = month.split("-").map(Number)
  const daysInMonth = new Date(y, mn, 0).getDate()
  const firstDow = new Date(y, mn - 1, 1).getDay() // 0=Sun
  const todayStr = new Date().toISOString().slice(0, 10)

  const prevMonth = () => { const d = new Date(y, mn - 2, 1); setMonth(d.toISOString().slice(0, 7)) }
  const nextMonth = () => { const d = new Date(y, mn, 1); setMonth(d.toISOString().slice(0, 7)) }

  const fmtDayTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) }
    catch { return iso.slice(11, 16) }
  }

  const monthLabel = `${y}年${mn}月`
  const summaryDays = Object.keys(calendar).length
  const totalIn = Object.values(calendar).reduce((s, d) => s + d.check_ins.length, 0)
  const totalOut = Object.values(calendar).reduce((s, d) => s + d.check_outs.length, 0)

  return (
    <div>
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text" placeholder="搜索学生或教师姓名..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value) }}
            className="w-full text-sm border rounded-lg pl-8 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {results.length > 0 && !selected && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border rounded-lg shadow-xl z-20 max-h-56 overflow-y-auto">
              {results.map((r, i) => (
                <button key={i} className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                  onClick={() => { setSelected(r); setSearch(""); setResults([]); setSelectedDay(null) }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${r.type === "teacher" ? "bg-purple-100" : "bg-blue-100"}`}>
                    {r.type === "teacher" ? <User className="h-4 w-4 text-purple-500" /> : <GraduationCap className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div className="flex-1"><p className="font-medium text-gray-900">{r.name}</p></div>
                  <Badge variant="outline" className="text-[10px]">{r.type === "teacher" ? "教师" : "学生"}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setCalendar({}); setSelectedDay(null) }}
            className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></Button>
        )}
      </div>

      {!selected ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">搜索并选择一位学生或教师查看考勤日历</p>
        </div>
      ) : loading ? (
        <div className="text-center py-16"><Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-500" /></div>
      ) : (
        <div className="p-4">
          {/* Person header + month nav */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selected.type === "teacher" ? "bg-purple-100" : "bg-blue-100"}`}>
                {selected.type === "teacher" ? <User className="h-5 w-5 text-purple-500" /> : <GraduationCap className="h-5 w-5 text-blue-500" />}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{selected.name}</p>
                <p className="text-[11px] text-gray-400">
                  {selected.type === "teacher" ? "教师" : "学生"} · {summaryDays}天记录 · 签到{totalIn}次 签退{totalOut}次
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium w-24 text-center">{monthLabel}</span>
              <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {["日","一","二","三","四","五","六"].map((d, i) => (
                <div key={d} className={`py-2 text-center text-xs font-semibold ${i === 0 || i === 6 ? "text-red-400" : "text-gray-500"}`}>{d}</div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} className="bg-gray-50/50 border-r border-b border-gray-100" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${month}-${String(day).padStart(2, "0")}`
                const data = calendar[dateStr]
                const hasIn = data?.check_ins?.length > 0
                const hasOut = data?.check_outs?.length > 0
                const isToday = dateStr === todayStr
                const isWeekend = (firstDow + i) % 7 === 0 || (firstDow + i) % 7 === 6
                const isActive = selectedDay === dateStr

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isActive ? null : dateStr)}
                    className={`relative border-r border-b border-gray-100 p-1.5 min-h-[60px] text-left hover:bg-blue-50/50 transition-colors ${
                      isWeekend ? "bg-gray-50/30" : "bg-white"
                    } ${isToday ? "ring-2 ring-blue-400 ring-inset" : ""} ${
                      isActive ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className={`text-xs font-semibold ${
                      isToday ? "bg-blue-500 text-white w-5 h-5 rounded-full inline-flex items-center justify-center" :
                      isWeekend ? "text-red-400" : "text-gray-600"
                    }`}>{day}</span>

                    {(hasIn || hasOut) && (
                      <div className="mt-1 space-y-0.5">
                        {hasIn && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-[10px] text-green-600 font-medium leading-none">
                              {data.check_ins.map(t => fmtDayTime(t)).join(", ")}
                            </span>
                          </div>
                        )}
                        {hasOut && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            <span className="text-[10px] text-amber-600 font-medium leading-none">
                              {data.check_outs.map(t => fmtDayTime(t)).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> 签到</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 签退</span>
          </div>

          {/* Selected day detail */}
          {selectedDay && calendar[selectedDay] && (
            <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
              <p className="font-bold text-sm text-gray-800 mb-2">{selectedDay}</p>
              <div className="space-y-1 text-xs">
                {calendar[selectedDay].check_ins.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 text-[10px]">签到</Badge>
                    <span className="font-mono text-green-700">
                      {calendar[selectedDay].check_ins.map(t => fmtDayTime(t)).join(", ")}
                    </span>
                  </div>
                )}
                {calendar[selectedDay].check_outs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">签退</Badge>
                    <span className="font-mono text-amber-700">
                      {calendar[selectedDay].check_outs.map(t => fmtDayTime(t)).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
