"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Loader2, Star, Trophy, Plus, Minus, Check, GraduationCap,
  History, LogIn, Users, ChevronLeft, ChevronRight, User,
} from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import PointsNfcScanner from "@/components/attendance/PointsNfcScanner"

interface PointLog {
  id: string; amount: number; reason: string; points_before: number
  points_after: number; teacher_name: string; created: string
}

interface Transaction {
  id: string; amount: number; reason: string
  teacher_name: string; student_name: string; student_id: string; created: string
}

const TX_PAGE_SIZE = 30

export default function PointsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdParam = searchParams.get("studentId")
  const studentNameParam = searchParams.get("name")

  const { user } = useAuth()
  const { teacher } = useCurrentTeacher()
  const isAuthenticated = !!user

  // ─── 积分操作 ──────────────────────────────────────
  const [currentStudent, setCurrentStudent] = useState<{
    id: string; name: string; points: number; grade: string; center: string
  } | null>(null)
  const [amount, setAmount] = useState(1)
  const [reason, setReason] = useState("")
  const [mode, setMode] = useState<"add" | "subtract">("add")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [logs, setLogs] = useState<PointLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // ─── 交易记录 ──────────────────────────────────────
  const [txLogs, setTxLogs] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [txPage, setTxPage] = useState(1)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txTotal, setTxTotal] = useState(0)

  const loadStudent = useCallback(async (studentId: string, name?: string) => {
    setResult(null)
    try {
      const res = await fetch(`/api/points/adjust?student_id=${studentId}`)
      const data = await res.json()
      if (data.id) {
        setCurrentStudent({ id: data.id, name: data.name || name || "未知", points: data.points || 0, grade: data.grade || "", center: data.center || "" })
        fetchLogs(studentId)
      }
    } catch (err) { console.error(err) }
  }, [])

  const fetchLogs = async (studentId: string) => {
    setLogsLoading(true)
    try {
      const res = await fetch(`/api/points/log?student_id=${studentId}&limit=20`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch { /* ignore */ }
    finally { setLogsLoading(false) }
  }

  const fetchTransactions = useCallback(async (p: number) => {
    setTxLoading(true)
    try {
      const res = await fetch(`/api/points/log?limit=${TX_PAGE_SIZE}&page=${p}`)
      const data = await res.json()
      setTxLogs(data.logs || [])
      setTxTotalPages(data.totalPages || 1)
      setTxTotal(data.total || 0)
    } catch (err) { console.error(err) }
    finally { setTxLoading(false) }
  }, [])

  useEffect(() => {
    if (studentIdParam) loadStudent(studentIdParam, studentNameParam || undefined)
  }, [studentIdParam, studentNameParam, loadStudent])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { studentId, studentName } = e.detail
      if (studentId) {
        loadStudent(studentId, studentName)
        router.replace(`/points?studentId=${studentId}&name=${encodeURIComponent(studentName || "")}`, { scroll: false })
      }
    }
    window.addEventListener("pjpc:student-scanned", handler as EventListener)
    return () => window.removeEventListener("pjpc:student-scanned", handler as EventListener)
  }, [loadStudent, router])

  useEffect(() => { fetchTransactions(txPage) }, [txPage, fetchTransactions])

  const handleConfirm = async () => {
    if (!currentStudent || amount <= 0 || !isAuthenticated) return
    setSubmitting(true)
    const delta = mode === "add" ? amount : -amount
    try {
      const res = await fetch("/api/points/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: currentStudent.id, amount: delta, reason: reason || undefined, teacher_id: teacher?.id || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setResult({ ok: true, msg: `${delta > 0 ? "+" : ""}${delta} 分 (${data.points_before} → ${data.points_after})` })
        setCurrentStudent(prev => prev ? { ...prev, points: data.points_after } : null)
        fetchLogs(currentStudent.id)
        fetchTransactions(1) // refresh tx list
      } else {
        setResult({ ok: false, msg: data.error || "操作失败" })
      }
    } catch (err: any) { setResult({ ok: false, msg: err.message }) }
    finally { setSubmitting(false) }
  }

  const fmtTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    } catch { return iso?.slice(0, 16) || "" }
  }

  const todayTotal = txLogs
    .filter(l => l.created?.startsWith(new Date().toISOString().slice(0, 10)))
    .reduce((s, l) => s + l.amount, 0)

  return (
    <PageLayout
      title="积分操作"
      description={isAuthenticated && teacher ? `${teacher.teacher_name || teacher.name} 老师` : "请先登入"}
      backUrl="/"
      userRole="admin"
      background="from-amber-50 to-yellow-50"
    >
      <div className="space-y-4">
        {/* Quick links */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/points/leaderboard")} className="h-8 text-xs bg-white">
            <Trophy className="h-3 w-3 mr-1" />排行榜
          </Button>
        </div>

        {/* Auth bar */}
        <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${
          isAuthenticated ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-center gap-2">
            {isAuthenticated && teacher ? (
              <>
                <GraduationCap className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium text-green-700">{teacher.teacher_name || teacher.name} 老师</span>
                <Badge variant="outline" className="text-[10px] bg-green-100 text-green-600 border-green-300">已登入</Badge>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-700">请先登入 PJPC App</span>
              </>
            )}
          </div>
        </div>

        {/* NFC Adjustment */}
        <Card className={`border-2 min-h-[280px] transition-colors ${currentStudent ? "border-green-400 bg-gradient-to-b from-green-50" : "border-dashed border-gray-200 bg-white"}`}>
          <CardContent className="p-6 text-center">
            {!isAuthenticated ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-3">
                  <LogIn className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-gray-700 mb-1">请先登入</h3>
                <p className="text-xs text-gray-400 mb-3">使用 NFC 教师卡或账号密码登入</p>
                <Button onClick={() => router.push("/login")} size="sm" className="bg-amber-600 hover:bg-amber-700">
                  <LogIn className="h-3.5 w-3.5 mr-1" /> 前往登入
                </Button>
              </>
            ) : !currentStudent ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-3">
                  <Star className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-gray-700 mb-1">等待刷学生卡</h3>
                <PointsNfcScanner />
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-2">
                  <GraduationCap className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{currentStudent.name}</h3>
                <p className="text-xs text-gray-400">{currentStudent.grade} · {currentStudent.center}</p>
                <div className="mt-1 inline-flex items-center gap-1 bg-amber-100 rounded-full px-3 py-0.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-bold text-amber-700 text-sm">{currentStudent.points} 分</span>
                </div>

                {result && (
                  <Badge className={`mt-2 text-xs px-2 py-1 ${result.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {result.msg}
                  </Badge>
                )}

                <div className="mt-4 max-w-sm mx-auto space-y-2">
                  <div className="flex justify-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit mx-auto">
                    <button onClick={() => setMode("add")}
                      className={`px-3 py-1 rounded text-xs font-medium ${mode === "add" ? "bg-white shadow text-green-700" : "text-gray-500"}`}>➕ 加分</button>
                    <button onClick={() => setMode("subtract")}
                      className={`px-3 py-1 rounded text-xs font-medium ${mode === "subtract" ? "bg-white shadow text-red-700" : "text-gray-500"}`}>➖ 减分</button>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setAmount(Math.max(1, amount - 1))}><Minus className="h-3 w-3" /></Button>
                    <Input type="number" min={1} value={amount} onChange={e => setAmount(parseInt(e.target.value) || 1)} className="w-16 h-9 text-center text-lg font-bold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setAmount(amount + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex gap-1 justify-center">
                    {[1, 2, 3, 5, 10, 50, 100].map(n => (
                      <button key={n} onClick={() => setAmount(n)}
                        className={`px-2 py-0.5 rounded text-xs border ${amount === n ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white text-gray-400 hover:bg-gray-50"}`}>{n}</button>
                    ))}
                  </div>
                  <Input placeholder="原因" value={reason} onChange={e => setReason(e.target.value)} className="text-xs h-8 text-center" />
                  <Button onClick={handleConfirm} disabled={submitting || amount <= 0}
                    className={`w-full h-8 text-sm ${mode === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                    {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                    {mode === "add" ? `+${amount} 分` : `-${amount} 分`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Student History */}
        {currentStudent && logs.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" /> {currentStudent.name} — 最近记录
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[200px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className={`flex items-center gap-2 px-4 py-1.5 border-b border-gray-50 text-xs ${log.amount > 0 ? "bg-green-50/30" : "bg-red-50/30"}`}>
                    <span className={`font-bold w-10 text-right ${log.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {log.amount > 0 ? "+" : ""}{log.amount}
                    </span>
                    <span className="flex-1 text-gray-600 truncate">{log.reason || "—"}</span>
                    <span className="text-gray-400 text-[10px]">{log.teacher_name}</span>
                    <span className="text-gray-300 text-[10px] w-14 text-right">{fmtTime(log.created).split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== 交易记录 ===== */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" /> 全部交易记录
              </CardTitle>
              <span className="flex items-center gap-3 text-[11px] text-gray-400">
                <span>今日 <span className={`font-bold ${todayTotal > 0 ? "text-green-600" : todayTotal < 0 ? "text-red-500" : ""}`}>{todayTotal > 0 ? "+" : ""}{todayTotal}</span></span>
                <span>{txTotal} 条</span>
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="text-center py-10"><Loader2 className="h-5 w-5 mx-auto animate-spin text-amber-500" /></div>
            ) : txLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">暂无记录</div>
            ) : (
              <>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b sticky top-0 z-10">
                        {["时间", "学生", "变动", "原因", "教师"].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {txLogs.map(log => (
                        <tr key={log.id}
                          className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                          onClick={() => loadStudent(log.student_id, log.student_name)}
                        >
                          <td className="px-3 py-2 text-[11px] text-gray-400 whitespace-nowrap">{fmtTime(log.created)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="h-3 w-3 text-gray-300" />
                              <span className="text-xs font-medium text-gray-700">{log.student_name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                              log.amount > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            }`}>
                              {log.amount > 0 ? "+" : ""}{log.amount}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-gray-500 max-w-[140px] truncate">{log.reason || "—"}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <User className="h-2.5 w-2.5 text-gray-300" />
                              <span className="text-[11px] text-gray-400">{log.teacher_name}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {txTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setTxPage(Math.max(1, txPage - 1))} disabled={txPage <= 1} className="h-7 w-7 p-0">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[11px] text-gray-400">{txPage} / {txTotalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setTxPage(Math.min(txTotalPages, txPage + 1))} disabled={txPage >= txTotalPages} className="h-7 w-7 p-0">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
