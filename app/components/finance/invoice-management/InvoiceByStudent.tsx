"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Check, X, Loader2 } from "lucide-react"
import { formatGrade } from "@/lib/utils"

// ── 按学生看发票：一行一个学生，右栏只显示【选定账期】的已开具/已发送状态 ──
// 点「查看」→ 该学生所有发票按账期分类，每行可标记已发送/取消

const today = new Date()
const CURRENT_PERIOD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`

const periodLabel = (p: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(p || "")
  return m ? `${parseInt(m[2], 10)}月` : p || "-"
}

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿", issued: "已开具", sent: "已发送", pending: "待处理",
  partially_paid: "部分付款", paid: "已付款", overdue: "逾期", cancelled: "已取消",
  carried_forward: "结转",
}

export function InvoiceByStudent({
  invoices,
  students,
  onMarkSent,
  onViewInvoice,
}: {
  invoices: any[]
  students: any[]
  onMarkSent: (invoiceId: string, sent: boolean) => Promise<void>
  onViewInvoice: (invoice: any) => void
}) {
  const [search, setSearch] = useState("")
  const [period, setPeriod] = useState<string>(CURRENT_PERIOD)
  const [detailStudent, setDetailStudent] = useState<any>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // 可选账期：数据里出现过的 + 当前月
  const periods = useMemo(() => {
    const s = new Set<string>()
    invoices.forEach(inv => { if (inv?.period) s.add(inv.period) })
    s.add(CURRENT_PERIOD)
    return Array.from(s).sort().reverse()
  }, [invoices])

  // 学生 → 该账期的发票
  const byStudent = useMemo(() => {
    const m = new Map<string, any[]>()
    invoices.forEach(inv => {
      if (inv?.deleted) return
      if (inv?.period !== period) return
      const k = inv.studentId || inv.studentName || "-"
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(inv)
    })
    return m
  }, [invoices, period])

  // 学生列表：在读优先，按名字排序
  const rows = useMemo(() => {
    const list = (students || []).filter((s: any) => s.status !== "graduated" && s.status !== "withdrawn")
    const q = search.trim().toLowerCase()
    const filtered = q
      ? list.filter((s: any) => `${s.name || ""} ${s.student_id || ""} ${s.code || ""}`.toLowerCase().includes(q))
      : list
    return [...filtered].sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || ""), "zh-Hans-CN"))
  }, [students, search])

  const summarize = (student: any) => {
    const invs = byStudent.get(student.id) || []
    if (invs.length === 0) return { issued: false, sent: false, invoice: null as any, count: 0 }
    const sent = invs.some(i => i.sent === true)
    return { issued: true, sent, invoice: invs[0], count: invs.length }
  }

  const studentInvoices = useMemo(() => {
    if (!detailStudent) return []
    return invoices
      .filter(inv => !inv.deleted && (inv.studentId === detailStudent.id || inv.studentName === detailStudent.name))
      .sort((a, b) => String(b.period || "").localeCompare(String(a.period || "")) || String(b.invoiceNumber || "").localeCompare(String(a.invoiceNumber || "")))
  }, [invoices, detailStudent])

  const handleToggleSent = async (invoice: any, next: boolean) => {
    setBusyId(invoice.id)
    try {
      await onMarkSent(invoice.id, next)
    } finally {
      setBusyId(null)
    }
  }

  const stat = useMemo(() => {
    let issued = 0, sent = 0
    rows.forEach((s: any) => {
      const r = summarize(s)
      if (r.issued) issued++
      if (r.sent) sent++
    })
    return { issued, sent, notIssued: rows.length - issued }
  }, [rows, byStudent])

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索学生姓名 / 学号..."
                className="pl-8 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">账期</span>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
              >
                {periods.map(p => (
                  <option key={p} value={p}>{p}（{periodLabel(p)}）</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 ml-auto">
              {period} · 已开具 <b className="text-gray-800">{stat.issued}</b> · 已发送 <b className="text-gray-800">{stat.sent}</b> · 未开具 <b className="text-amber-600">{stat.notIssued}</b>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">学号</TableHead>
                  <TableHead>学生</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead className="text-center">{period} 开具</TableHead>
                  <TableHead className="text-center">{period} 发送</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 300).map((s: any) => {
                  const r = summarize(s)
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs text-gray-500">{s.student_id || s.code || "-"}</TableCell>
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell className="text-xs text-gray-500">{formatGrade(s.grade, s.is_peralihan) || s.grade || "-"}</TableCell>
                      <TableCell className="text-center">
                        {r.issued
                          ? <span className="text-xs font-medium text-green-600">已开具</span>
                          : <span className="text-xs font-medium text-amber-600">未开具</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {!r.issued
                          ? <span className="text-xs text-gray-400">—</span>
                          : r.sent
                            ? <span className="text-xs font-medium text-green-600">已发送</span>
                            : <span className="text-xs font-medium text-red-500">未发送</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setDetailStudent(s)}>
                          <Eye className="h-4 w-4 mr-1" />查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-400 text-sm">没有符合的学生</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {rows.length > 300 && (
            <div className="mt-2 text-xs text-gray-400">只显示前 300 位，请用搜索缩小范围</div>
          )}
        </CardContent>
      </Card>

      {/* 学生发票明细：按账期分类 */}
      <Dialog open={!!detailStudent} onOpenChange={o => { if (!o) setDetailStudent(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailStudent?.name}
              {detailStudent?.student_id ? <span className="text-sm font-normal text-gray-500 ml-2">({detailStudent.student_id})</span> : null}
              <span className="text-sm font-normal text-gray-500 ml-2">— 所有发票（按账期）</span>
            </DialogTitle>
          </DialogHeader>
          {studentInvoices.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">这位学生还没有任何发票</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>账期</TableHead>
                    <TableHead>发票号</TableHead>
                    <TableHead className="text-right">金额 (RM)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-center">发送</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentInvoices.map(inv => (
                    <TableRow key={inv.id} className={inv.period === period ? "bg-blue-50/40" : ""}>
                      <TableCell className="text-sm font-medium">{inv.period || "-"}<span className="text-xs text-gray-500 ml-1">({periodLabel(inv.period)})</span></TableCell>
                      <TableCell className="text-sm">
                        <button className="text-blue-600 hover:underline" onClick={() => onViewInvoice(inv)}>{inv.invoiceNumber}</button>
                      </TableCell>
                      <TableCell className="text-right text-sm">{Number(inv.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "paid" ? "default" : "secondary"} className="text-xs">
                          {STATUS_LABEL[inv.status] || inv.status || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {inv.sent
                          ? <span className="text-xs font-medium text-green-600">已发送{inv.sent_at ? <span className="text-gray-400 ml-1">{String(inv.sent_at).slice(0, 10)}</span> : null}</span>
                          : <span className="text-xs font-medium text-red-500">未发送</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={inv.sent ? "outline" : "default"}
                          disabled={busyId === inv.id}
                          onClick={() => handleToggleSent(inv, !inv.sent)}
                        >
                          {busyId === inv.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : inv.sent
                              ? <><X className="h-3.5 w-3.5 mr-1" />取消标记</>
                              : <><Check className="h-3.5 w-3.5 mr-1" />标记已发送</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
