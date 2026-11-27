"use client"
import { isInvoiceOverdue } from '@/lib/invoice-status'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RowActions } from "@/components/ui/row-actions"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Printer, Send, CheckCircle, AlertCircle, Loader2, Eye, Trash2, XCircle, CheckSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatGrade } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

/**
 * 旧批次的票号用的是「开票月」，跟账期差一个月（例：8 月开票、账期 9 月 → INV-202608-xxx）。
 * 票已经发给家长，不能改号，所以在列表里补一个灰标说明，免得出纳和家长对不上账。
 * 返回 0 表示票号月份 = 账期，不用标。
 */
function invoiceNumberMismatchMonth(inv: any): number {
  const no = String(inv?.invoiceNumber || '')
  const period = String(inv?.period || '')
  if (!/^INV-\d{6}-/.test(no) || !/^\d{4}-\d{2}$/.test(period)) return 0
  const noYM = no.slice(4, 10)
  if (noYM === period.replace('-', '')) return 0
  return parseInt(noYM.slice(4, 6), 10) || 0
}

interface InvoiceListProps {
  invoices: any[]
  filters: any
  setFilters: (filters: any) => void
  onDownload: (invoice: any) => void
  onPrint: (invoice: any) => void
  onSend: (invoice: any) => void
  onView: (invoice: any) => void
  onDelete: (invoice: any) => void
  payments?: any[] // Add payments to show payment status
}

export function InvoiceList({
  invoices,
  filters,
  setFilters,
  onDownload,
  onPrint,
  onSend,
  onView,
  onDelete,
  payments = []
}: InvoiceListProps) {
  const { t } = useLanguage()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null)

  // ── Batch delete state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

  // ── Pagination ──
  const INVOICE_PER_PAGE = 15
  const [invoicePage, setInvoicePage] = useState(1)
  const activeInvoices = invoices.filter(i => i.status !== 'draft' && i.status !== 'cancelled')
  const totalInvoicePages = Math.max(1, Math.ceil(activeInvoices.length / INVOICE_PER_PAGE))
  useEffect(() => { setInvoicePage(1) }, [filters, invoices.length])
  const paginatedInvoices = activeInvoices.slice((invoicePage - 1) * INVOICE_PER_PAGE, invoicePage * INVOICE_PER_PAGE)

  // ── Recycle bin state ──
  const [binMode, setBinMode] = useState(false)
  const [deletedInvoices, setDeletedInvoices] = useState<any[]>([])
  const [binLoading, setBinLoading] = useState(false)

  const fetchDeletedInvoices = async () => {
    setBinLoading(true)
    try {
      const res = await fetch("/api/pocketbase-proxy/api/collections/invoices/records?filter=" + encodeURIComponent("deleted=true") + "&sort=-updated&perPage=200")
      const data = await res.json()
      setDeletedInvoices(data?.items || [])
    } catch { setDeletedInvoices([]) } finally { setBinLoading(false) }
  }

  const allIds = invoices.map(inv => inv.id)
  const allSelected = allIds.length > 0 && selectedIds.size === allIds.length
  const someSelected = selectedIds.size > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allIds))
    }
  }

  // 级联:恢复/永久删除发票时,连带它的收款(payment)与收据(receipt)
  // 与 useInvoices 的级联逻辑一致 —— 删一起删,恢复一起恢复
  const cascadeChildren = async (invoiceId: string, mode: "restore" | "purge") => {
    const P = "/api/pocketbase-proxy/api/collections"
    try {
      const pays = await (await fetch(`${P}/payments/records?perPage=200&filter=${encodeURIComponent(`invoiceId="${invoiceId}"`)}`)).json()
      for (const pay of pays?.items || []) {
        const recs = await (await fetch(`${P}/receipts/records?perPage=200&filter=${encodeURIComponent(`paymentId="${pay.id}"`)}`)).json()
        for (const rc of recs?.items || []) {
          if (mode === "purge") await fetch(`${P}/receipts/records/${rc.id}`, { method: "DELETE" })
          else await fetch(`${P}/receipts/records/${rc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleted: false }) })
        }
        if (mode === "purge") await fetch(`${P}/payments/records/${pay.id}`, { method: "DELETE" })
        else await fetch(`${P}/payments/records/${pay.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleted: false }) })
      }
    } catch (e) { console.error("级联处理关联收款/收据失败:", e) }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBatchDelete = async () => {
    setIsBatchDeleting(true)
    const ids = [...selectedIds]
    // Delete sequentially to avoid overwhelming the API
    for (const id of ids) {
      const invoice = invoices.find(inv => inv.id === id)
      if (invoice) {
        try {
          await onDelete(invoice)
        } catch {
          // continue on error for remaining items
        }
      }
    }
    setIsBatchDeleting(false)
    setIsBatchDeleteOpen(false)
    setSelectedIds(new Set())
  }

  const handleDeleteClick = (invoice: any) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      onDelete(invoiceToDelete)
      setIsDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setInvoiceToDelete(null)
  }

  const getPaymentStatusBadge = (invoiceId: string) => {
    const invoicePayments = payments.filter(payment => payment.invoiceId === invoiceId)
    const invoice = invoices.find(inv => inv.id === invoiceId)

    if (!invoice) {
      return <Badge variant="outline">{t('teacher.unknown')}</Badge>
    }

    if (invoicePayments.length === 0) {
      return isInvoiceOverdue(invoice)
        ? <Badge variant="destructive">{t("逾期")}</Badge>
        : <Badge variant="outline">{t("未缴费")}</Badge>
    }

    const completedPayments = invoicePayments.filter(p => p.status === 'completed')
    const totalPaid = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

    if (totalPaid >= invoice.totalAmount) {
      return <Badge variant="default">{t("已缴费")}</Badge>
    } else if (totalPaid > 0) {
      return <Badge variant="secondary">{t("半缴费")}</Badge>
    } else {
      return isInvoiceOverdue(invoice)
        ? <Badge variant="destructive">{t("逾期")}</Badge>
        : <Badge variant="outline">{t("未缴费")}</Badge>
    }
  }

  // ── Invoice status badge (Chinese labels per task spec) ──
  const getInvoiceStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; text: string }> = {
      draft: { variant: "outline", text: "草稿" },
      issued: { variant: "default", text: "已发出" },
      sent: { variant: "secondary", text: "已发送" },
      pending: { variant: "secondary", text: "待处理" },
      overdue: { variant: "destructive", text: "逾期" },
      paid: { variant: "default", text: "已缴费" },
      cancelled: { variant: "destructive", text: "已取消" }
    }
    const statusInfo = statusMap[status] || { variant: "outline" as const, text: status }
    return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount)
  }

    // ── Recycle bin view ──
    if (binMode) {
      return (
        <Card className="bg-gray-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <div>
                  <CardTitle>{t("回收站")}</CardTitle>
                  <CardDescription>{t("已删除的发票，可恢复或永久删除")}</CardDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBinMode(false)}
                className="px-3 py-1.5 text-xs font-medium border rounded-lg bg-white text-gray-600 hover:bg-gray-50"
              >
                {t("← 返回列表")}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {binLoading ? (
              <div className="py-16 text-center text-gray-400 text-sm">{t("加载中...")}</div>
            ) : deletedInvoices.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">{t("回收站为空")}</div>
            ) : (
              <div className="space-y-2">
                {deletedInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{inv.invoiceNumber} · {inv.studentName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {inv.studentGrade || ""} · {formatCurrency(inv.totalAmount)} {t("· 删除于")} {formatDate(inv.updated)}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={async () => {
                          const r = await fetch("/api/pocketbase-proxy/api/collections/invoices/records/" + inv.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleted: false }) })
                          if (!r.ok) { alert(t("恢复失败：") + r.status); return }
                          await cascadeChildren(inv.id, "restore")
                          await fetchDeletedInvoices()
                        }}>
                        {t("恢复")}
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={async () => {
                          if (!confirm(t("确定要永久删除这张发票吗？此操作不可恢复！(关联的收款与收据会一并删除)"))) return
                          await cascadeChildren(inv.id, "purge")
                          const r = await fetch("/api/pocketbase-proxy/api/collections/invoices/records/" + inv.id, { method: "DELETE" })
                          if (!r.ok) { alert(t("永久删除失败：") + r.status); return }
                          await fetchDeletedInvoices()
                        }}>
                        {t("永久删除")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <>`
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <div>
                <CardTitle>{t("发票列表")}</CardTitle>
                <CardDescription>{t("管理所有发票记录")}</CardDescription>
              </div>
            </div>
            <div className="flex gap-1 border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => { setBinMode(false); }}
                className={`px-3 py-1.5 text-xs font-medium ${!binMode ? "bg-primary text-primary-foreground" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {t("列表")}
              </button>
              <button
                type="button"
                onClick={() => { setBinMode(true); fetchDeletedInvoices(); }}
                className={`px-3 py-1.5 text-xs font-medium ${binMode ? "bg-primary text-primary-foreground" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {t("🗑️ 回收站")} {deletedInvoices.length > 0 ? `(${deletedInvoices.length})` : ""}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">{t('common.search')}</Label>
              <Input
                id="search"
                placeholder={t("搜索发票号码、学生姓名...")}
                value={filters.search || ""}
                onChange={(e) => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="w-48">
              <Label>{t("缴费状态")}</Label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => setFilters((prev: any) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("所有缴费状态")}</SelectItem>
                  <SelectItem value="unpaid">{t("未缴费")}</SelectItem>
                  <SelectItem value="paid">{t("已缴费")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Batch action bar ── */}
          {someSelected && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-red-700 font-medium">
                {t("已选择")} <span className="font-bold">{selectedIds.size}</span> {t("张发票")}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {t("取消选择")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBatchDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t("删除选中 (")}{selectedIds.size})
                </Button>
              </div>
            </div>
          )}

          {/* Invoice Table（桌面）；手机走下面的卡片，11 列在 390px 下要横拖三次 */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label={t('teacher.select_all')}
                    />
                  </TableHead>
                  <TableHead>{t("发票号码")}</TableHead>
                  <TableHead>{t("发票状态")}</TableHead>
                  <TableHead>{t('student.student_no')}</TableHead>
                  <TableHead>{t('student.student_name')}</TableHead>
                  <TableHead>{t('student.grade')}</TableHead>
                  <TableHead>{t('finance.amount')}</TableHead>
                  <TableHead>{t("缴费状态")}</TableHead>
                  <TableHead>{t("开票日期")}</TableHead>
                  <TableHead>{t("账期")}</TableHead>
                  <TableHead>{t("到期日期")}</TableHead>
                  <TableHead>{t('teacher.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className={selectedIds.has(invoice.id) ? "bg-red-50/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(invoice.id)}
                        onCheckedChange={() => toggleSelect(invoice.id)}
                        aria-label={`选择 ${invoice.invoiceNumber}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>{invoice.invoiceNumber}</span>
                        {invoiceNumberMismatchMonth(invoice) > 0 && (
                          <span
                            className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-normal text-slate-500"
                            title={t("票号用的是开票月，与账期不同")}
                          >
                            {t("开票月")} {invoiceNumberMismatchMonth(invoice)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getInvoiceStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>{invoice.studentNumber || '-'}</TableCell>
                    <TableCell>{invoice.studentName}</TableCell>
                    <TableCell>{formatGrade((invoice as any).studentGrade)}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(invoice.id)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">{
                      (() => {
                        const m = String((invoice as any).period || '').match(/^(\d{4})-(\d{2})/)
                        return m ? `${m[1]}年${Number(m[2])}月` : '—'
                      })()
                    }</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <RowActions
                        primary={{
                          label: t("查看"), icon: Eye,
                          onClick: () => onView(invoice),
                        }}
                        actions={[
                          { label: t("下载"), icon: Download, onClick: () => onDownload(invoice) },
                          { label: t("打印"), icon: Printer, onClick: () => onPrint(invoice) },
                          { label: t("发送"), icon: Send, onClick: () => onSend(invoice) },
                          { label: t("删除"), icon: Trash2, destructive: true, onClick: () => handleDeleteClick(invoice) },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 手机：一张票一张卡 */}
          <div className="md:hidden">
            {paginatedInvoices.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">{t("暂无")}</p>
            ) : (
              <div className="divide-y divide-gray-100 rounded-lg border">
                {paginatedInvoices.map((invoice) => (
                  <div key={invoice.id} className={`px-3 py-3 ${selectedIds.has(invoice.id) ? "bg-red-50/50" : ""}`}>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedIds.has(invoice.id)}
                        onCheckedChange={() => toggleSelect(invoice.id)}
                        aria-label={`${t("选择")} ${invoice.invoiceNumber}`}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[13px] font-semibold text-gray-800">{invoice.invoiceNumber}</p>
                          <p className="shrink-0 text-sm font-bold text-green-600">{formatCurrency(invoice.totalAmount)}</p>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-600">
                          {invoice.studentName}
                          <span className="ml-1 text-gray-400">{invoice.studentNumber || '-'}</span>
                          <span className="ml-1 text-gray-400">{formatGrade((invoice as any).studentGrade)}</span>
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {invoiceNumberMismatchMonth(invoice) > 0 && (
                            <span className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">
                              {t("开票月")} {invoiceNumberMismatchMonth(invoice)}
                            </span>
                          )}
                          {/* 草稿/已取消 才单独标；其余「已缴费/逾期」跟缴费徽章重复，手机上只留一个 */}
                          {(invoice.status === 'draft' || invoice.status === 'cancelled') && getInvoiceStatusBadge(invoice.status)}
                          {getPaymentStatusBadge(invoice.id)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                          <span>{t("账期")} {(() => {
                            const m = String((invoice as any).period || '').match(/^(\d{4})-(\d{2})/)
                            return m ? `${m[1]}年${Number(m[2])}月` : '—'
                          })()}</span>
                          <span>{t("到期日期")} {formatDate(invoice.dueDate)}</span>
                          <span>{t("开票日期")} {formatDate(invoice.issueDate)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-end">
                          <RowActions
                            primary={{
                              label: t("查看"), icon: Eye,
                              onClick: () => onView(invoice),
                            }}
                            actions={[
                              { label: t("下载"), icon: Download, onClick: () => onDownload(invoice) },
                              { label: t("打印"), icon: Printer, onClick: () => onPrint(invoice) },
                              { label: t("发送"), icon: Send, onClick: () => onSend(invoice) },
                              { label: t("删除"), icon: Trash2, destructive: true, onClick: () => handleDeleteClick(invoice) },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice Pagination */}
          {totalInvoicePages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
              <span className="text-sm text-gray-500">
                {t("共")} {activeInvoices.length} {t("条，每页")} {INVOICE_PER_PAGE} {t("条")}
              </span>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" disabled={invoicePage===1} onClick={() => setInvoicePage(p=>Math.max(1,p-1))}>{t("上一页")}</Button>
                {Array.from({length: totalInvoicePages}, (_,i)=>i+1).map(p=>(
                  <Button key={p} size="sm" variant={p===invoicePage?"default":"outline"} onClick={()=>setInvoicePage(p)} className="min-w-[32px] h-8">{p}</Button>
                ))}
                <Button size="sm" variant="outline" disabled={invoicePage===totalInvoicePages} onClick={() => setInvoicePage(p=>Math.min(totalInvoicePages,p+1))}>{t("下一页")}</Button>
              </div>
            </div>
          )}

          </CardContent>
      </Card>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('course.confirm_delete')}</DialogTitle>
            <DialogDescription>
              {t("确定要删除发票")} <span className="font-semibold">{invoiceToDelete?.invoiceNumber}</span> {t("吗？")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleCancelDelete}
            >
              {t("取消")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
            >
              {t("删除")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              {t("批量删除发票")}
            </DialogTitle>
            <DialogDescription />
            <div className="space-y-2 mt-2">
              <p className="text-sm">
                {t("确定要删除选中的")} <span className="font-bold text-red-600">{selectedIds.size}</span> {t("张发票吗？")}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-40 overflow-y-auto">
                <ul className="text-xs space-y-0.5">
                  {[...selectedIds].map(id => {
                    const inv = invoices.find(i => i.id === id)
                    return inv ? (
                      <li key={id} className="text-red-700">
                        • {inv.invoiceNumber} — {inv.studentName} ({inv.studentNumber || '无'}) — RM {inv.totalAmount?.toLocaleString()}
                      </li>
                    ) : null
                  })}
                </ul>
              </div>
              <p className="text-xs text-red-500 mt-2">{t("⚠️ 此操作不可撤销！")}</p>
            </div>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsBatchDeleteOpen(false)}
              disabled={isBatchDeleting}
            >
              {t("取消")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
            >
              {isBatchDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("删除中...")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("删除")} {selectedIds.size} {t("张发票")}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
