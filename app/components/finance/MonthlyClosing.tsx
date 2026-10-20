"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context";

type Kind = "invoice" | "salary"

interface Closing {
  id: string
  month: string
  kind: Kind
  status: "closed" | "reopened"
  summary: any
  details: any
  closed_at?: string
  reopened_at?: string
  reopen_reason?: string
}

const money = (n: any) =>
  `RM ${Number(n || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const thisMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function MonthlyClosing() {
  const { t } = useLanguage();
  const [kind, setKind] = useState<Kind>("invoice")
  const [month, setMonth] = useState<string>(thisMonth())
  const [preview, setPreview] = useState<any>(null)
  const [existing, setExisting] = useState<Closing | null>(null)
  const [closings, setClosings] = useState<Closing[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setMsg("")
    try {
      const r = await fetch(`/api/monthly-closings?month=${month}&kind=${kind}`, { cache: "no-store" })
      const d = await r.json()
      if (!d.success) throw new Error(d.error || "读取失败")
      setPreview(d.preview)
      setExisting(d.existing || null)
    } catch (e: any) {
      setMsg(`读取失败：${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [month, kind])

  const loadList = useCallback(async () => {
    try {
      const d = await (await fetch("/api/monthly-closings?list=1", { cache: "no-store" })).json()
      setClosings(d.closings || [])
    } catch { /* 忽略 */ }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadList() }, [loadList])

  const close = async () => {
    if (!confirm(`确定把 ${month} 的${kind === "invoice" ? "发票" : "薪资"}结账吗？\n结账后该月数据不能再改。`)) return
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/monthly-closings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, kind, action: "close" }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.error || "结账失败")
      setMsg(d.alreadyClosed ? "这个月已经结过账了" : "已结账并存档")
      await load(); await loadList()
    } catch (e: any) {
      setMsg(`结账失败：${e.message}`)
    } finally { setBusy(false) }
  }

  const reopen = async () => {
    const reason = prompt(t("反结账原因（会留痕，必填）：")) || ""
    if (!reason.trim()) { if (reason !== null) alert(t("原因不能为空")); return }
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/monthly-closings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, kind, action: "reopen", reason }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.error || "反结账失败")
      setMsg("已反结账，该月可以修改了")
      await load(); await loadList()
    } catch (e: any) {
      setMsg(`反结账失败：${e.message}`)
    } finally { setBusy(false) }
  }

  // 已结账 → 显示存档快照；未结账 → 显示实时预览
  const view = existing || preview
  const s = view?.summary || {}
  const isClosed = !!existing

  const box = (label: string, value: any, tone?: "good" | "bad") => (
    <div className="rounded-md border px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-base font-semibold ${tone === "bad" ? "text-red-600" : tone === "good" ? "text-emerald-600" : ""}`}>
        {value}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 打印/导出成 PDF 时:隐藏侧边栏和顶栏，只留报表本身 */}
      <style>{`@media print {
        aside, nav, header, [data-sidebar] { display: none !important; }
        main { margin: 0 !important; padding: 0 !important; }
        .no-print { display: none !important; }
      }`}</style>
      {/* 顶部:类型 + 月份 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("月度结账")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border overflow-hidden">
              <button
                onClick={() => setKind("invoice")}
                className={`px-3 py-1.5 text-sm ${kind === "invoice" ? "bg-slate-900 text-white" : "bg-white"}`}
              >{t("发票")}</button>
              <button
                onClick={() => setKind("salary")}
                className={`px-3 py-1.5 text-sm border-l ${kind === "salary" ? "bg-slate-900 text-white" : "bg-white"}`}
              >{t("薪资")}</button>
            </div>
            <input
              type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="h-9 rounded-md border px-2 text-sm"
            />
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? "读取中…" : "重新计算"}
            </Button>
            <div className="flex-1" />
            {isClosed ? (
              <>
                <Badge className="bg-emerald-600">{t("已结账")}</Badge>
                <Button variant="outline" size="sm" onClick={reopen} disabled={busy}>{t("反结账")}</Button>
              </>
            ) : (
              <Button size="sm" onClick={close} disabled={busy || loading}>
                {busy ? "处理中…" : "生成月结"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>{t("打印 / 导出")}</Button>
          </div>

          {isClosed && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
              {t("这个月已结账并存档（")}{String(existing?.closed_at || "").slice(0, 19).replace("T", " ")}）。
              下面显示的是<strong>{t("存档当时的数字")}</strong>{t("，不是现在的实时数据。")}
            </div>
          )}
          {msg && <div className="text-xs text-slate-700">{msg}</div>}
        </CardContent>
      </Card>

      {/* 汇总 */}
      {view && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{month} {kind === "invoice" ? "发票月结" : "薪资月结"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {kind === "invoice" ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {box("开票张数", `${s.invoiceCount ?? 0} 张`)}
                  {box("开票金额", money(s.invoiced))}
                  {box("已收（本月票据）", money(s.collected), "good")}
                  {box("未收（本月票据）", money(s.outstanding), s.outstanding > 0 ? "bad" : undefined)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {box("本月实收现金", money(s.cashIn))}
                  {box("未付清发票", `${s.unpaidCount ?? 0} 张`)}
                  {box("上月结转未收", money(s.carriedForward), s.carriedForward > 0 ? "bad" : undefined)}
                  {box("本月退款", money(s.refunded))}
                </div>

                {(view.details?.carriedInvoices || []).length > 0 && (
                  <details className="rounded-md border">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                      {t("上月结转未收明细（")}{view.details.carriedInvoices.length}{t(" 张 · 共 ")}{money(s.carriedForward)}{t("）")}
                    </summary>
                    <div className="overflow-x-auto border-t">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr className="text-left">
                            <th className="px-3 py-2">{t("账期")}</th>
                            <th className="px-3 py-2">{t("发票号")}</th>
                            <th className="px-3 py-2">{t("学生")}</th>
                            <th className="px-3 py-2 text-right">{t("金额")}</th>
                            <th className="px-3 py-2 text-right">{t("已收")}</th>
                            <th className="px-3 py-2 text-right">{t("未收")}</th>
                            <th className="px-3 py-2">{t("到期")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {view.details.carriedInvoices.map((r: any) => (
                            <tr key={r.id} className="border-t">
                              <td className="px-3 py-1.5">{r.period}</td>
                              <td className="px-3 py-1.5 font-mono">{r.invoiceNumber}</td>
                              <td className="px-3 py-1.5">{r.studentName}</td>
                              <td className="px-3 py-1.5 text-right">{money(r.total)}</td>
                              <td className="px-3 py-1.5 text-right">{money(r.paid)}</td>
                              <td className="px-3 py-1.5 text-right text-red-600">{money(r.outstanding)}</td>
                              <td className="px-3 py-1.5">{String(r.dueDate || "").slice(0, 10)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}

                <div>
                  <div className="text-sm font-medium mb-2">{t("本月发票明细（")}{month}{t("）")}</div>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr className="text-left">
                          <th className="px-3 py-2">{t("发票号")}</th>
                          <th className="px-3 py-2">{t("学生")}</th>
                          <th className="px-3 py-2 text-right">{t("金额")}</th>
                          <th className="px-3 py-2 text-right">{t("已收")}</th>
                          <th className="px-3 py-2 text-right">{t("未收")}</th>
                          <th className="px-3 py-2">{t("状态")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(view.details?.invoices || []).map((r: any) => (
                          <tr key={r.id} className="border-t">
                            <td className="px-3 py-1.5 font-mono">{r.invoiceNumber}</td>
                            <td className="px-3 py-1.5">{r.studentName}</td>
                            <td className="px-3 py-1.5 text-right">{money(r.total)}</td>
                            <td className="px-3 py-1.5 text-right">{money(r.paid)}</td>
                            <td className={`px-3 py-1.5 text-right ${r.outstanding > 0 ? "text-red-600" : ""}`}>
                              {r.outstanding > 0 ? money(r.outstanding) : "—"}
                            </td>
                            <td className="px-3 py-1.5">{r.status}</td>
                          </tr>
                        ))}
                        {!(view.details?.invoices || []).length && (
                          <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">{t("这个月没有发票")}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {box("人数", `${s.headcount ?? 0} 人`)}
                  {box("应发合计", money(s.gross))}
                  {box("扣款合计", money((s.epf || 0) + (s.socso || 0) + (s.eis || 0) + (s.pcb || 0) + (s.other || 0)))}
                  {box("实发合计", money(s.net), "good")}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {box("EPF", money(s.epf))}
                  {box("SOCSO", money(s.socso))}
                  {box("EIS", money(s.eis))}
                  {box("PCB", money(s.pcb))}
                  {box("实发", money(s.net), "good")}
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">{t("本月薪资明细（")}{month}{t("）")}</div>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr className="text-left">
                          <th className="px-3 py-2">{t("老师")}</th>
                          <th className="px-3 py-2 text-right">{t("应发")}</th>
                          <th className="px-3 py-2 text-right">EPF</th>
                          <th className="px-3 py-2 text-right">SOCSO</th>
                          <th className="px-3 py-2 text-right">EIS</th>
                          <th className="px-3 py-2 text-right">PCB</th>
                          <th className="px-3 py-2 text-right">{t("实发")}</th>
                          <th className="px-3 py-2">{t("状态")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(view.details?.records || []).map((r: any) => (
                          <tr key={r.id} className="border-t">
                            <td className="px-3 py-1.5">{r.teacherName}</td>
                            <td className="px-3 py-1.5 text-right">{money(r.gross)}</td>
                            <td className="px-3 py-1.5 text-right">{money(r.epf)}</td>
                            <td className="px-3 py-1.5 text-right">{money(r.socso)}</td>
                            <td className="px-3 py-1.5 text-right">{money(r.eis)}</td>
                            <td className="px-3 py-1.5 text-right">{money(r.pcb)}</td>
                            <td className="px-3 py-1.5 text-right font-medium">{money(r.net)}</td>
                            <td className="px-3 py-1.5">{r.status}</td>
                          </tr>
                        ))}
                        {!(view.details?.records || []).length && (
                          <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">{t("这个月没有薪资记录")}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 存档列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("存档记录")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-3 py-2">{t("月份")}</th>
                  <th className="px-3 py-2">{t("类型")}</th>
                  <th className="px-3 py-2">{t("状态")}</th>
                  <th className="px-3 py-2">{t("结账时间")}</th>
                  <th className="px-3 py-2">{t("关键金额")}</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {closings.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-1.5 font-medium">{c.month}</td>
                    <td className="px-3 py-1.5">{c.kind === "invoice" ? "发票" : "薪资"}</td>
                    <td className="px-3 py-1.5">
                      <span className={c.status === "closed" ? "text-emerald-600" : "text-amber-600"}>
                        {c.status === "closed" ? "已结账" : "已反结账"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">{String(c.closed_at || "").slice(0, 10)}</td>
                    <td className="px-3 py-1.5">
                      {c.kind === "invoice"
                        ? `开票 ${money(c.summary?.invoiced)} · 实收 ${money(c.summary?.cashIn)}`
                        : `实发 ${money(c.summary?.net)} · ${c.summary?.headcount ?? 0} 人`}
                    </td>
                    <td className="px-3 py-1.5">
                      <Button variant="ghost" size="sm" onClick={() => { setKind(c.kind); setMonth(c.month) }}>
                        {t("查看")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!closings.length && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">{t("还没有任何存档")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
