"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { RefreshCw, Search, AlertTriangle, Copy, FileWarning } from "lucide-react"

// 财务核对：只读。数据全部来自 /api/finance-check，页面本身不写任何东西。

type Summary = {
  periods: { period: string; invoices: number; face: number; paid: number; unpaid: number }[]
  scoped: { period: string; invoices: number; face: number; paid: number; duplicateGroups: number; faceVsDetailCount: number; faceVsPaidCount: number }
}

type DuplicateRow = {
  student: string
  studentId: string
  grade: string
  period: string
  count: number
  total: number
  ids: string[]
  amounts: number[]
  paid: number
}

type InvoiceRow = {
  number: string
  student: string
  grade: string
  period: string
  status: string
  issueDate: string
  face: number
  detail: number
  discount: number
  discountType: string
  paid: number
  faceVsDetail: number
  faceVsPaid: number
}

const money = (n: number) => `RM ${(Number(n) || 0).toFixed(2)}`

export default function FinanceCheckPage() {
  const { t } = useLanguage()
  const [period, setPeriod] = useState("")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [dups, setDups] = useState<DuplicateRow[]>([])
  const [detailDiff, setDetailDiff] = useState<InvoiceRow[]>([])
  const [paidDiff, setPaidDiff] = useState<InvoiceRow[]>([])
  const [detailCount, setDetailCount] = useState(0)
  const [paidCount, setPaidCount] = useState(0)
  const [query, setQuery] = useState("")
  const [studentRows, setStudentRows] = useState<InvoiceRow[]>([])
  const [studentMsg, setStudentMsg] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = period ? `&period=${encodeURIComponent(period)}` : ""
      const [s, d, m] = await Promise.all([
        fetch(`/api/finance-check?view=summary${qs}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/finance-check?view=duplicates${qs}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/finance-check?view=mismatch${qs}`, { cache: "no-store" }).then((r) => r.json()),
      ])
      if (s?.success) setSummary(s)
      setDups(d?.rows || [])
      setDetailDiff(m?.faceVsDetail || [])
      setPaidDiff(m?.faceVsPaid || [])
      setDetailCount(m?.faceVsDetailCount || 0)
      setPaidCount(m?.faceVsPaidCount || 0)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  const searchStudent = async () => {
    const kw = query.trim()
    if (!kw) return
    setStudentMsg("")
    const res = await fetch(`/api/finance-check?view=student&name=${encodeURIComponent(kw)}`, { cache: "no-store" }).then((r) => r.json())
    if (res?.success) {
      setStudentRows(res.rows || [])
      setStudentMsg(res.count ? t("共 {n} 张，票面合计 {a}，已收 {b}").replace("{n}", String(res.count)).replace("{a}", money(res.totalFace)).replace("{b}", money(res.totalPaid)) : t("没找到这个学生的发票"))
    } else {
      setStudentMsg(res?.error || t("查询失败"))
    }
  }

  const periods = useMemo(() => summary?.periods || [], [summary])
  const scoped = summary?.scoped

  return (
    <PageLayout
      title={t("财务核对")}
      description={t("查重复发票、票面对不上、单张发票明细（只读，不改数据）")}
      userRole="admin"
      status={t("系统正常")}
      background="bg-gray-50"
      actions={
        <div className="flex items-center gap-2">
          <Input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder={t("账期，例如 2026-11（留空=全部）")}
            className="w-56"
          />
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {t("重新检查")}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("有效发票")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{scoped?.invoices ?? 0}</div>
              <p className="text-xs text-gray-500 mt-1">{scoped?.period || t("全部")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("票面合计 / 已收")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{money(scoped?.face || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">{t("已收")} {money(scoped?.paid || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("重复发票（同学生同账期）")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold ${dups.length ? "text-amber-600" : "text-green-600"}`}>{scoped?.duplicateGroups ?? 0}</div>
              <p className="text-xs text-gray-500 mt-1">{t("组")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("票面 vs 明细 / 票面 vs 实收")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {scoped?.faceVsDetailCount ?? 0} / {scoped?.faceVsPaidCount ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t("条对不上")}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="duplicates">
          <TabsList>
            <TabsTrigger value="duplicates">
              <Copy className="h-4 w-4 mr-1" />
              {t("重复发票")} ({dups.length})
            </TabsTrigger>
            <TabsTrigger value="detail">
              <FileWarning className="h-4 w-4 mr-1" />
              {t("票面 vs 明细")} ({detailCount})
            </TabsTrigger>
            <TabsTrigger value="paid">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {t("票面 vs 实收")} ({paidCount})
            </TabsTrigger>
            <TabsTrigger value="student">{t("按学生查")}</TabsTrigger>
            <TabsTrigger value="periods">{t("按账期汇总")}</TabsTrigger>
          </TabsList>

          <TabsContent value="duplicates" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("同一学生、同一账期开出多于一张有效发票")}</CardTitle>
                <CardDescription>{t("作废和已删的不算；这类票要人工确认留哪张")}</CardDescription>
              </CardHeader>
              <CardContent>
                {!dups.length ? (
                  <p className="text-sm text-gray-500">{t("没有重复发票")}</p>
                ) : (
                  <div className="space-y-3">
                    {dups.map((d) => (
                      <div key={`${d.studentId}-${d.period}`} className="border rounded-lg p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{d.student}</span>
                          <Badge variant="outline">{d.period}</Badge>
                          <Badge className="bg-amber-100 text-amber-800">{d.count} {t("张")}</Badge>
                          <span className="text-sm text-gray-600">{t("合计")} {money(d.total)}</span>
                          <span className="text-sm text-gray-600">{t("已收")} {money(d.paid)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {d.ids.map((no, idx) => (
                            <span key={no} className="text-xs bg-gray-100 rounded px-2 py-1">
                              {no} · {money(d.amounts[idx])}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detail" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("票面金额 ≠ 明细金额合计")}</CardTitle>
                <CardDescription>{t("常见于折扣口径改过、或手工改过票面")}</CardDescription>
              </CardHeader>
              <CardContent>
                {!detailDiff.length ? (
                  <p className="text-sm text-gray-500">{t("全部对得上")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-gray-500 border-b">
                        <tr>
                          <th className="py-2">{t("发票号")}</th>
                          <th>{t("学生")}</th>
                          <th>{t("账期")}</th>
                          <th className="text-right">{t("票面")}</th>
                          <th className="text-right">{t("明细")}</th>
                          <th className="text-right">{t("差额")}</th>
                          <th>{t("折扣")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailDiff.map((r) => (
                          <tr key={r.number} className="border-b last:border-0">
                            <td className="py-2 font-mono text-xs">{r.number}</td>
                            <td>{r.student}</td>
                            <td>{r.period}</td>
                            <td className="text-right">{money(r.face)}</td>
                            <td className="text-right">{money(r.detail)}</td>
                            <td className={`text-right font-medium ${Math.abs(r.faceVsDetail) >= 1 ? "text-red-600" : "text-amber-600"}`}>
                              {money(r.faceVsDetail)}
                            </td>
                            <td>{r.discount ? `${r.discount}${r.discountType === "percent" ? "%" : ""}` : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("票面金额 ≠ 已收金额（只列已收过钱的）")}</CardTitle>
                <CardDescription>{t("多收、少收、部分付款都会出现在这里")}</CardDescription>
              </CardHeader>
              <CardContent>
                {!paidDiff.length ? (
                  <p className="text-sm text-gray-500">{t("全部对得上")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-gray-500 border-b">
                        <tr>
                          <th className="py-2">{t("发票号")}</th>
                          <th>{t("学生")}</th>
                          <th>{t("账期")}</th>
                          <th className="text-right">{t("票面")}</th>
                          <th className="text-right">{t("已收")}</th>
                          <th className="text-right">{t("差额")}</th>
                          <th>{t("状态")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paidDiff.map((r) => (
                          <tr key={r.number} className="border-b last:border-0">
                            <td className="py-2 font-mono text-xs">{r.number}</td>
                            <td>{r.student}</td>
                            <td>{r.period}</td>
                            <td className="text-right">{money(r.face)}</td>
                            <td className="text-right">{money(r.paid)}</td>
                            <td className={`text-right font-medium ${Math.abs(r.faceVsPaid) >= 1 ? "text-red-600" : "text-amber-600"}`}>
                              {money(r.faceVsPaid)}
                            </td>
                            <td>{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="student" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("按学生查发票")}</CardTitle>
                <CardDescription>{t("输名字的一部分就行，比如 Rizwan")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("学生姓名")} className="max-w-xs" />
                  <Button onClick={searchStudent}>
                    <Search className="h-4 w-4 mr-2" />
                    {t("查询")}
                  </Button>
                </div>
                {studentMsg && <p className="text-sm text-gray-600">{studentMsg}</p>}
                {!!studentRows.length && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-gray-500 border-b">
                        <tr>
                          <th className="py-2">{t("发票号")}</th>
                          <th>{t("账期")}</th>
                          <th className="text-right">{t("票面")}</th>
                          <th className="text-right">{t("已收")}</th>
                          <th>{t("开票日")}</th>
                          <th>{t("状态")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentRows.map((r) => (
                          <tr key={r.number} className="border-b last:border-0">
                            <td className="py-2 font-mono text-xs">{r.number}</td>
                            <td>{r.period}</td>
                            <td className="text-right">{money(r.face)}</td>
                            <td className="text-right">{money(r.paid)}</td>
                            <td>{r.issueDate}</td>
                            <td>{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="periods" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("按账期汇总")}</CardTitle>
                <CardDescription>{t("按账期归月，不是按开票日")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500 border-b">
                      <tr>
                        <th className="py-2">{t("账期")}</th>
                        <th className="text-right">{t("张数")}</th>
                        <th className="text-right">{t("票面")}</th>
                        <th className="text-right">{t("已收")}</th>
                        <th className="text-right">{t("未收")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((p) => (
                        <tr key={p.period} className="border-b last:border-0">
                          <td className="py-2">{p.period}</td>
                          <td className="text-right">{p.invoices}</td>
                          <td className="text-right">{money(p.face)}</td>
                          <td className="text-right">{money(p.paid)}</td>
                          <td className={`text-right ${p.unpaid > 0 ? "text-red-600 font-medium" : ""}`}>{money(p.unpaid)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
