"use client"

/**
 * 学生中心（学生账号登录后看到的第一页，也是唯一一页）
 *
 * 数据来自 /api/student/home —— 服务端只给「自己」的数据；
 * 报告列表仍走代理（代理会自动加「只看自己」的条件，前端传了也没用）。
 */
import { useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatGrade } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import {
  Calendar, BookOpen, Trophy, Megaphone, CalendarCheck, Clock,
  CheckCircle2, AlertCircle, FileText,
} from "lucide-react"

const API = "/api/pocketbase-proxy/api/collections"

type Any_ = Record<string, any>
type Tab = "today" | "homework" | "points" | "notices" | "leave" | "reports"

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "today", label: "今日", icon: Clock },
  { id: "homework", label: "我的作业", icon: BookOpen },
  { id: "points", label: "我的积分", icon: Trophy },
  { id: "notices", label: "公告", icon: Megaphone },
  { id: "leave", label: "请假", icon: CalendarCheck },
  { id: "reports", label: "我的报告", icon: FileText },
]

export default function MyPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<Any_ | null>(null)
  const [reports, setReports] = useState<Any_[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("today")

  // 请假表单
  const [leaveType, setLeaveType] = useState("sick")
  const [leaveStart, setLeaveStart] = useState("")
  const [leaveEnd, setLeaveEnd] = useState("")
  const [leaveReason, setLeaveReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [leaveMsg, setLeaveMsg] = useState("")

  const load = async () => {
    try {
      const [rHome, rRep] = await Promise.all([
        fetch("/api/student/home"),
        fetch(`${API}/student_reports/records?perPage=20&sort=-created`),
      ])
      const d = await rHome.json().catch(() => ({} as Any_))
      if (!rHome.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${rHome.status}）`)
      setData(d)
      const dr = await rRep.json().catch(() => ({}))
      setReports(dr?.items || [])
      setError("")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submitLeave = async () => {
    if (!leaveStart || !leaveEnd) { setLeaveMsg(t("请选择开始和结束日期")); return }
    if (!data?.student?.id) { setLeaveMsg(t("找不到学生资料")); return }
    setSubmitting(true); setLeaveMsg("")
    try {
      const r = await fetch("/api/student-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: data.student.id,
          leave_type: leaveType,
          start_date: leaveStart,
          end_date: leaveEnd,
          reason: leaveReason,
          status: "pending",
          applied_date: new Date().toISOString().slice(0, 10),
        }),
      })
      if (!r.ok) {
        const b = await r.json().catch(() => ({}))
        throw new Error(b?.error || `提交失败（HTTP ${r.status}）`)
      }
      setLeaveMsg(t("已提交，等老师审批"))
      setLeaveReason(""); setLeaveStart(""); setLeaveEnd("")
      await load()
    } catch (e: any) {
      setLeaveMsg(String(e?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  // 注意：这里是普通函数，不是组件 —— 写成组件每次 setState 都会重挂载，输入框会失焦
  const shell = (children: React.ReactNode) => (
    <PageLayout title={t("我的")} description={t("我的资料、积分、报告与考勤")}>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl">{children}</div>
    </PageLayout>
  )

  if (loading) return shell(<p className="text-gray-500 py-10 text-center">{t("加载中...")}</p>)

  if (error || !data) {
    return shell(
      <>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-red-600 font-medium flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />{error || t("加载失败")}
            </p>
            <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={() => { setLoading(true); load() }}>
              {t("重新加载")}
            </button>
          </CardContent>
        </Card>
      </>
    )
  }

  const s = data.student
  const today = data.today || { classes: [] }
  const hw = data.homework || []
  const pending = hw.filter((h: Any_) => !h.submitted)
  const notices = data.notices || []
  const leaves = data.leaves || []
  const points = data.points || { total: 0, monthly: 0, recent: [] }

  return shell(
    <>
      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-500">
            {String(s?.name || "?").slice(0, 1)}
          </div>
          <div>
            <div className="text-xl font-semibold">{s?.name || "-"}</div>
            <div className="text-sm text-gray-500 mt-1">
              {s?.student_id || "-"} · {formatGrade(s?.grade, s?.is_peralihan) || "-"} · {s?.center || "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("总积分")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{points.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("本月积分")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{points.monthly}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("待交作业")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{data.pending_homework ?? 0}</div></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === x.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <x.icon className="h-4 w-4" />{t(x.label)}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4" />{t("今日课表")}</CardTitle>
              <CardDescription>{today.weekday_zh} · {today.date}</CardDescription>
            </CardHeader>
            <CardContent>
              {today.classes.length === 0 ? (
                <p className="text-sm text-gray-500 py-3">{t("今天没有课")}</p>
              ) : (
                <ul className="divide-y">
                  {today.classes.map((c: Any_) => {
                    const isNext = today.next && c.id === today.next.id
                    return (
                      <li key={c.id} className={`py-2.5 flex items-center justify-between ${isNext ? "bg-blue-50/60 -mx-3 px-3 rounded" : ""}`}>
                        <div>
                          <p className="text-sm font-medium">{c.course}</p>
                          <p className="text-xs text-gray-500">{c.teacher}{c.room ? ` · ${c.room}` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{String(c.start_time || "").slice(0, 5)} – {String(c.end_time || "").slice(0, 5)}</p>
                          {isNext && <Badge className="mt-1 text-[10px]">{t("下一节")}</Badge>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("本月出勤")}</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600">
                {t("到课")} {data.attendance?.present ?? 0} {t("天")} · {t("缺勤")} {data.attendance?.absent ?? 0} {t("天")}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("最近积分变动")}</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600">
                {(points.recent || []).slice(0, 3).map((p: Any_) => (
                  <div key={p.id} className="flex justify-between py-0.5">
                    <span className="truncate">{p.reason || "-"}</span>
                    <span className={Number(p.amount) >= 0 ? "text-green-600" : "text-red-600"}>
                      {Number(p.amount) > 0 ? "+" : ""}{p.amount}
                    </span>
                  </div>
                ))}
                {(points.recent || []).length === 0 && <span className="text-gray-400">{t("暂无记录")}</span>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "homework" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("我的作业")}</CardTitle>
            <CardDescription>{t("未交")} {pending.length} {t("项")}</CardDescription>
          </CardHeader>
          <CardContent>
            {hw.length === 0 ? <p className="text-sm text-gray-500 py-3">{t("暂时没有作业")}</p> : (
              <ul className="divide-y">
                {hw.map((h: Any_) => (
                  <li key={h.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{h.title}</p>
                      <p className="text-xs text-gray-500">{t(h.subject)} · {t("截止")} {String(h.dueDate || "").slice(0, 10)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {h.submitted ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {h.submissionStatus === "graded" ? `${t("已批")} ${h.score ?? ""}` : t("已交")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                          <AlertCircle className="h-3.5 w-3.5" />{t("未交")}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "points" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("我的积分")}</CardTitle>
            <CardDescription>{t("总分")} {points.total} · {t("本月")} {points.monthly}</CardDescription>
          </CardHeader>
          <CardContent>
            {(points.recent || []).length === 0 ? <p className="text-sm text-gray-500 py-3">{t("暂无记录")}</p> : (
              <ul className="divide-y">
                {(points.recent || []).map((p: Any_) => (
                  <li key={p.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <p>{p.reason || "-"}</p>
                      <p className="text-xs text-gray-400">{String(p.created || "").slice(0, 10)}</p>
                    </div>
                    <span className={Number(p.amount) >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {Number(p.amount) > 0 ? "+" : ""}{p.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "notices" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("公告")}</CardTitle></CardHeader>
          <CardContent>
            {notices.length === 0 ? <p className="text-sm text-gray-500 py-3">{t("暂时没有公告")}</p> : (
              <ul className="divide-y">
                {notices.map((n: Any_) => (
                  <li key={n.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{n.title}</p>
                      <span className="text-xs text-gray-400">{String(n.date || "").slice(0, 10)}</span>
                    </div>
                    {n.description && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "leave" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />{t("申请请假")}</CardTitle>
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
                  <Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>{t("结束日期")}</Label>
                  <Input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("原因")}</Label>
                <Input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder={t("简单说明一下")} />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={submitLeave} disabled={submitting}>{submitting ? t("提交中…") : t("提交")}</Button>
                {leaveMsg && <span className="text-sm text-gray-600">{leaveMsg}</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t("我的请假记录")}</CardTitle></CardHeader>
            <CardContent>
              {leaves.length === 0 ? <p className="text-sm text-gray-500 py-3">{t("还没有请假记录")}</p> : (
                <ul className="divide-y">
                  {leaves.map((l: Any_) => (
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
        </div>
      )}

      {tab === "reports" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("我的报告")}</CardTitle></CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">{t("还没有报告")}</p>
            ) : (
              <ul className="divide-y">
                {reports.map((r) => (
                  <li key={r.id} className="py-2 flex items-center justify-between">
                    <span className="text-sm">{r.term || "-"} · {r.year || "-"}</span>
                    <a className="text-sm text-blue-600 hover:underline" href={`/student-report/${r.id}`}>{t("查看")}</a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
