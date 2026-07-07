"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Star, Trophy, RefreshCw, Plus, Minus, Check, GraduationCap, History, LogIn, Table2, BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import PointsNfcScanner from "@/components/attendance/PointsNfcScanner"

interface PointLog {
  id: string
  amount: number
  reason: string
  points_before: number
  points_after: number
  teacher_name: string
  created: string
}

export default function PointsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdParam = searchParams.get("studentId")
  const studentNameParam = searchParams.get("name")

  // PJPC app auth
  const { user } = useAuth()
  const { teacher } = useCurrentTeacher()
  const isAuthenticated = !!user

  // Student being adjusted
  const [currentStudent, setCurrentStudent] = useState<{
    id: string; name: string; points: number; grade: string; center: string
  } | null>(null)

  const [amount, setAmount] = useState(1)
  const [reason, setReason] = useState("")
  const [mode, setMode] = useState<"add" | "subtract">("add")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Points history
  const [logs, setLogs] = useState<PointLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // ─── Load student from URL param ──────────────────

  const loadStudent = useCallback(async (studentId: string, name?: string) => {
    setResult(null)
    try {
      const res = await fetch(`/api/points/adjust?student_id=${studentId}`)
      const data = await res.json()
      if (data.id) {
        setCurrentStudent({
          id: data.id,
          name: data.name || name || "未知",
          points: data.points || 0,
          grade: data.grade || "",
          center: data.center || "",
        })
        fetchLogs(studentId)
      }
    } catch (err) {
      console.error("加载学生失败:", err)
    }
  }, [])

  const fetchLogs = async (studentId: string) => {
    setLogsLoading(true)
    try {
      const res = await fetch(`/api/points/log?student_id=${studentId}`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch { /* ignore */ }
    finally { setLogsLoading(false) }
  }

  // Load student when URL param changes
  useEffect(() => {
    if (studentIdParam) {
      loadStudent(studentIdParam, studentNameParam || undefined)
    }
  }, [studentIdParam, studentNameParam, loadStudent])

  // Listen for student-scanned event from NFC scanner
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

  // ─── Adjust points ────────────────────────────────

  const handleConfirm = async () => {
    if (!currentStudent || amount <= 0 || !isAuthenticated) return
    setSubmitting(true)
    const delta = mode === "add" ? amount : -amount

    try {
      const res = await fetch("/api/points/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: currentStudent.id,
          amount: delta,
          reason: reason || undefined,
          teacher_id: teacher?.id || undefined,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setResult({ ok: true, msg: `${delta > 0 ? "+" : ""}${delta} 分 (${data.points_before} → ${data.points_after})` })
        setCurrentStudent(prev => prev ? { ...prev, points: data.points_after } : null)
        fetchLogs(currentStudent.id)
      } else {
        setResult({ ok: false, msg: data.error || "操作失败" })
      }
    } catch (err: any) {
      setResult({ ok: false, msg: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ───────────────────────────────────────

  return (
    <PageLayout
      title="积分操作"
      description={isAuthenticated && teacher ? `当前: ${teacher.teacher_name || teacher.name} 老师` : "请先登入 PJPC App"}
      backUrl="/"
      userRole="admin"
      background="from-amber-50 to-yellow-50"
    >
      <div className="space-y-4">
        {/* Quick links to sub-pages */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/points/records")}
            className="h-9 text-xs bg-white"
          >
            <Table2 className="h-3.5 w-3.5 mr-1" />
            积分记录
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/points/leaderboard")}
            className="h-9 text-xs bg-white"
          >
            <Trophy className="h-3.5 w-3.5 mr-1" />
            排行榜
          </Button>
        </div>

        {/* ===== Auth Status Bar ===== */}
        <div className={`flex items-center justify-between px-4 py-2 rounded-lg border ${
          isAuthenticated ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-center gap-2">
            {isAuthenticated && teacher ? (
              <>
                <GraduationCap className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {teacher.teacher_name || teacher.name} 老师 · {teacher.position || "Teacher"}
                </span>
                <Badge variant="outline" className="text-[10px] bg-green-100 text-green-600 border-green-300">
                  已登入
                </Badge>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700">请先登入 PJPC App（NFC 刷卡或账号登入）</span>
              </>
            )}
          </div>
        </div>

        {/* ===== Main: NFC Adjustment (full width) ===== */}
        <div>
          <Card className={`border-2 transition-colors min-h-[400px] ${
            currentStudent ? "border-green-400 bg-gradient-to-b from-green-50" :
            "border-gray-200 bg-white"
          }`}>
            <CardContent className="p-6 text-center">
              {!isAuthenticated ? (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4">
                    <LogIn className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">请先登入</h3>
                  <p className="text-sm text-gray-500 mb-4">使用 NFC 教师卡或账号密码登入 PJPC App</p>
                  <Button onClick={() => router.push("/login")} className="bg-amber-600 hover:bg-amber-700">
                    <LogIn className="h-4 w-4 mr-1" /> 前往登入
                  </Button>
                </>
              ) : !currentStudent ? (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4">
                    <Star className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">等待刷学生卡</h3>
                  <PointsNfcScanner />
                </>
              ) : (
                <>
                  {/* Student Info */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                    <GraduationCap className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{currentStudent.name}</h3>
                  <p className="text-sm text-gray-500">{currentStudent.grade} · {currentStudent.center}</p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-amber-100 rounded-full px-3 py-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-amber-700">{currentStudent.points} 分</span>
                  </div>

                  {/* Result */}
                  {result && (
                    <Badge className={`mt-3 text-sm px-3 py-1 ${
                      result.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {result.msg}
                    </Badge>
                  )}

                  {/* Controls */}
                  <div className="mt-4 max-w-sm mx-auto space-y-3">
                    {/* Mode toggle */}
                    <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setMode("add")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          mode === "add" ? "bg-white shadow text-green-700" : "text-gray-500"
                        }`}>➕ 加分</button>
                      <button
                        onClick={() => setMode("subtract")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          mode === "subtract" ? "bg-white shadow text-red-700" : "text-gray-500"
                        }`}>➖ 减分</button>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0"
                        onClick={() => setAmount(Math.max(1, amount - 1))}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-3xl font-bold w-12 text-center tabular-nums">{amount}</span>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0"
                        onClick={() => setAmount(amount + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quick select */}
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 5].map(n => (
                        <button key={n} onClick={() => setAmount(n)}
                          className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                            amount === n ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white text-gray-500 hover:bg-gray-50"
                          }`}>{n}</button>
                      ))}
                    </div>

                    {/* Reason */}
                    <Input
                      placeholder="原因（如：课堂表现好）"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="text-sm h-9 text-center"
                    />

                    {/* Confirm */}
                    <Button
                      onClick={handleConfirm}
                      disabled={submitting || amount <= 0}
                      className={`w-full ${mode === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      {mode === "add" ? `确认 +${amount} 分` : `确认 -${amount} 分`}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Points History */}
          {currentStudent && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" /> 积分历史 — {currentStudent.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="text-center py-6"><Loader2 className="h-4 w-4 mx-auto animate-spin" /></div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs">暂无记录</div>
                ) : (
                  <div className="max-h-[250px] overflow-y-auto">
                    {logs.map(log => (
                      <div key={log.id} className={`flex items-center gap-2 px-4 py-2 border-b border-gray-50 text-xs ${
                        log.amount > 0 ? "bg-green-50/30" : "bg-red-50/30"
                      }`}>
                        <span className={`font-bold w-12 text-right ${log.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                          {log.amount > 0 ? "+" : ""}{log.amount}
                        </span>
                        <span className="flex-1 text-gray-600 truncate">{log.reason || "—"}</span>
                        <span className="text-gray-400 text-[10px]">{log.teacher_name}</span>
                        <span className="text-gray-300 text-[10px] w-16 text-right">
                          {new Date(log.created).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
