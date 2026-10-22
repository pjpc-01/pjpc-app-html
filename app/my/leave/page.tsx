"use client"

import { useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { useStudentHome } from "@/hooks/useStudentHome"
import { AlertCircle, FileText } from "lucide-react"

/** 请假：在线申请 + 我的记录 */
export default function MyLeavePage() {
  const { t } = useLanguage()
  const { data, loading, error, reload } = useStudentHome()

  const [leaveType, setLeaveType] = useState("sick")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState("")

  const submit = async () => {
    if (!start || !end) { setMsg(t("请选择开始和结束日期")); return }
    if (!data?.student?.id) { setMsg(t("找不到学生资料")); return }
    setSubmitting(true); setMsg("")
    try {
      const r = await fetch("/api/student-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: data.student.id,
          leave_type: leaveType,
          start_date: start,
          end_date: end,
          reason,
          status: "pending",
          applied_date: new Date().toISOString().slice(0, 10),
        }),
      })
      if (!r.ok) {
        const b = await r.json().catch(() => ({}))
        throw new Error(b?.error || `提交失败（HTTP ${r.status}）`)
      }
      setMsg(t("已提交，等老师审批"))
      setReason(""); setStart(""); setEnd("")
      await reload()
    } catch (e: any) {
      setMsg(String(e?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout title={t("请假")} description={t("在这里提交请假申请")}>
      <div className="p-4 md:p-6 max-w-4xl space-y-4">
        {loading ? <p className="text-gray-500 py-10 text-center">{t("加载中...")}</p> : error ? (
          <Card><CardContent className="py-10 text-center">
            <p className="text-red-600 flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" />{error}</p>
            <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={reload}>{t("重新加载")}</button>
          </CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />{t("申请请假")}</CardTitle>
                <CardDescription>{t("提交后由老师审批")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label>{t("类型")}</Label>
                    <select className="h-9 rounded-md border px-2 text-sm" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                      <option value="sick">{t("病假")}</option>
                      <option value="personal">{t("事假")}</option>
                      <option value="other">{t("其他")}</option>
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
                {(data?.leaves || []).length === 0 ? <p className="text-sm text-gray-500 py-3">{t("还没有请假记录")}</p> : (
                  <ul className="divide-y">
                    {(data?.leaves || []).map((l: any) => (
                      <li key={l.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <p>
                            {t(l.leave_type === "sick" ? "病假" : l.leave_type === "personal" ? "事假" : "其他")}
                            {" · "}{String(l.start_date || "").slice(0, 10)} → {String(l.end_date || "").slice(0, 10)}
                          </p>
                          {l.reason && <p className="text-xs text-gray-500">{l.reason}</p>}
                        </div>
                        <Badge variant={l.status === "approved" ? "default" : "secondary"} className="text-[10px]">
                          {t(l.status === "approved" ? "已批准" : l.status === "rejected" ? "被拒绝" : "待审批")}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  )
}
