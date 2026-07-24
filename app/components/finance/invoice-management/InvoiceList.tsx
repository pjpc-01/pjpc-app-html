"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
    
    if (invoicePayments.length === 0) {
      return <Badge variant="outline">未缴费</Badge>
    }
    
    const completedPayments = invoicePayments.filter(p => p.status === 'completed')
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amountPaid, 0)
    const invoice = invoices.find(inv => inv.id === invoiceId)
    
    if (!invoice) {
      return <Badge variant="outline">{t('teacher.unknown')}</Badge>
    }
    
    if (totalPaid >= invoice.totalAmount) {
      return <Badge variant="default">已缴费</Badge>
    } else {
      return <Badge variant="secondary">待缴费</Badge>
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            发票列表
          </CardTitle>
          <CardDescription>管理所有发票记录</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">{t('common.search')}</Label>
              <Input
                id="search"
                placeholder="搜索发票号码、学生姓名..."
                value={filters.search || ""}
                onChange={(e) => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="w-48">
              <Label>缴费状态</Label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => setFilters((prev: any) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有缴费状态</SelectItem>
                  <SelectItem value="unpaid">未缴费</SelectItem>
                  <SelectItem value="paid">已缴费</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>{t('student.grade')}</Label>
              <Select 
                value={filters.grade || "all"} 
                onValueChange={(value) => setFilters((prev: any) => ({ ...prev, grade: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有年级</SelectItem>
                  <SelectItem value="一年级">{t('student.year_1')}</SelectItem>
                  <SelectItem value="二年级">{t('student.year_2')}</SelectItem>
                  <SelectItem value="三年级">{t('student.year_3')}</SelectItem>
                  <SelectItem value="四年级">{t('student.year_4')}</SelectItem>
                  <SelectItem value="五年级">{t('student.year_5')}</SelectItem>
                  <SelectItem value="六年级">{t('student.year_6')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Batch action bar ── */}
          {someSelected && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-red-700 font-medium">
                已选择 <span className="font-bold">{selectedIds.size}</span> 张发票
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  取消选择
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBatchDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除选中 ({selectedIds.size})
                </Button>
              </div>
            </div>
          )}

          {/* Invoice Table */}
          <div className="border rounded-lg">
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
                  <TableHead>发票号码</TableHead>
                  <TableHead>发票状态</TableHead>
                  <TableHead>{t('student.student_no')}</TableHead>
                  <TableHead>{t('student.student_name')}</TableHead>
                  <TableHead>{t('student.grade')}</TableHead>
                  <TableHead>{t('finance.amount')}</TableHead>
                  <TableHead>缴费状态</TableHead>
                  <TableHead>开具日期</TableHead>
                  <TableHead>到期日期</TableHead>
                  <TableHead>{t('teacher.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className={selectedIds.has(invoice.id) ? "bg-red-50/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(invoice.id)}
                        onCheckedChange={() => toggleSelect(invoice.id)}
                        aria-label={`选择 ${invoice.invoiceNumber}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      {getInvoiceStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>{invoice.studentNumber || '-'}</TableCell>
                    <TableCell>{invoice.studentName}</TableCell>
                    <TableCell>{formatGrade(invoice.grade)}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(invoice.id)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onView(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onDownload(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onPrint(invoice)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onSend(invoice)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClick(invoice)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总发票数</p>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">待缴费</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {invoices.filter(invoice => {
                        const invoicePayments = payments.filter(payment => payment.invoiceId === invoice.id)
                        const completedPayments = invoicePayments.filter(p => p.status === 'completed')
                        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amountPaid, 0)
                        return totalPaid === 0
                      }).length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">已缴费</p>
                    <p className="text-2xl font-bold text-green-600">
                      {invoices.filter(invoice => {
                        const invoicePayments = payments.filter(payment => payment.invoiceId === invoice.id)
                        const completedPayments = invoicePayments.filter(p => p.status === 'completed')
                        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amountPaid, 0)
                        return totalPaid >= invoice.totalAmount
                      }).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('student.overdue')}</p>
                    <p className="text-2xl font-bold text-red-600">
                      {invoices.filter(i => i.status === 'overdue').length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('course.confirm_delete')}</DialogTitle>
            <DialogDescription>
              确定要删除发票 <span className="font-semibold">{invoiceToDelete?.invoiceNumber}</span> 吗？
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleCancelDelete}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
            >
              删除
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
              批量删除发票
            </DialogTitle>
            <DialogDescription />
            <div className="space-y-2 mt-2">
              <p className="text-sm">
                确定要删除选中的 <span className="font-bold text-red-600">{selectedIds.size}</span> 张发票吗？
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
              <p className="text-xs text-red-500 mt-2">⚠️ 此操作不可撤销！</p>
            </div>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsBatchDeleteOpen(false)}
              disabled={isBatchDeleting}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
            >
              {isBatchDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除 {selectedIds.size} 张发票
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
