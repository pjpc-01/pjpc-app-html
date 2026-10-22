"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { CalendarCheck, AlertCircle } from "lucide-react"

/**
 * 教师请假：提交 + 我的记录。
 *
 * 以前老师请假只能找办公室口头说，系统里有 teacher_leave_record 表却没有入口。
 * 走 /api/teacher-leave（已带登录校验），teacher_id 由服务端拿登录账号的绑定。
 */
export default function TeacherLeavePanel({ teacherId }: { teacherId: string }) {
  const { t } = useLanguage()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [leaveType, setLeaveType] = useState("sick")
  const [period, setPeriod] = useState("full_day")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState("")

  const load = async () => {
    try {
      const r = await fetch(`/api/teacher-leave?teacher_id=${encodeURIComponent(teacherId)}&limit=20`)
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setRows(d?.data || d?.items || [])
      setError("")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [teacherId])

  const submit = async () => {
    if (!start || !end) { setMsg(t("请选择开始和结束日期")); return }
    setSubmitting(true); setMsg("")
    try {
      const r = await fetch("/api/teacher-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId, leave_type: leaveType, start_date: start, end_date: end, reason, period, status: "pending" }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d?.success === false) throw new Error(d?.error || `提交失败（HTTP ${r.status}）`)
      setMsg(t("已提交，等院长审批"))
      setReason(""); setStart(""); setEnd("")
      await load()
    } catch (e: any) {
      setMsg(String(e?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><CalendarCheck className="h-4 w-4" />{t("申请请假")}</CardTitle>
          <CardDescription>{t("提交后由院长审批")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("类型")}</Label>
              <select className="h-9 rounded-md border px-2 text-sm" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                <option value="sick">{t("病假")}</option>
                <option value="personal">{t("事假")}</option>
                <option value="annual">{t("年假")}</option>
                <option value="other">{t("其他")}</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("时段")}</Label>
              <select className="h-9 rounded-md border px-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="full_day">{t("全天")}</option>
                <option value="morning">{t("上午")}</option>
                <option value="afternoon">{t("下午")}</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("开始日期")}</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("结束日期")}</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("原因")}</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("简单说明一下")} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={submitting}>{submitting ? t("提交中…") : t("提交")}</Button>
            {msg && <span className="text-sm text-gray-600">{msg}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("我的请假记录")}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500 py-2">{t("加载中...")}</p>
          ) : error ? (
            <p className="text-sm text-red-600 py-2 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">{t("还没有请假记录")}</p>
          ) : (
            <ul className="divide-y">
              {rows.map((l: any) => (
                <li key={l.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p>
                      {t(l.leave_type === "sick" ? "病假" : l.leave_type === "personal" ? "事假" : l.leave_type === "annual" ? "年假" : "其他")}
                      {" · "}{String(l.start_date || "").slice(0, 10)} → {String(l.end_date || "").slice(0, 10)}
                      {l.total_days ? ` · ${l.total_days} ${t("天")}` : ""}
                    </p>
                    {l.reason && <p className="text-xs text-gray-500">{l.reason}</p>}
                  </div>
                  <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                    {t(l.status === "approved" ? "已批准" : l.status === "rejected" ? "被拒绝" : "待审批")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
