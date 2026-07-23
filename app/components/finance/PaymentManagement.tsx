"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { useLanguage } from "@/contexts/language-context"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Receipt, 
  CreditCard, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  DollarSign,
  Undo2,
  TrendingUp,
  Trash2,
  XCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useSearchParams } from "next/navigation"
import { usePayments } from "@/hooks/usePayments"
import { useInvoices } from "@/hooks/useInvoices"
import { useReceipts } from "@/hooks/useReceipts"
import { useRefunds } from "@/hooks/useRefunds"
import { useStudents } from "@/hooks/useStudents"
import type { Refund } from "@/hooks/useRefunds"
import type { Payment } from "@/hooks/usePayments"
import { toast } from "sonner"

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
  } catch {
    return dateStr
  }
}

export default function PaymentManagement() {
  const { t } = useLanguage()
  const { invoices, loading: invoicesLoading } = useInvoices()
  const { payments, loading: paymentsLoading, createPayment, deletePayment, refetch } = usePayments()
  const { createReceipt } = useReceipts()
  const { refunds, createRefund, getTotalRefundedAmount } = useRefunds()
  
  const searchParams = useSearchParams()
  const centerFilter = searchParams.get("center")
  const { students } = useStudents()
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refund dialog state
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [refundMethod, setRefundMethod] = useState("bank_transfer")
  const [refundNotes, setRefundNotes] = useState("")
  const [isRefunding, setIsRefunding] = useState(false)

  // ── Batch delete state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

  // Apply center filter to invoices (for the new payment dialog dropdown)
  const filteredInvoices = invoices.filter(inv => {
    if (centerFilter && centerFilter !== "all") {
      const student = students.find(s => s.id === inv.studentId)
      if (!student || student.centerId !== centerFilter) return false
    }
    return (
      inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })
  
  // Center filter for payments: payment.invoiceId → invoice.studentId → student.centerId
  const filteredPayments = centerFilter && centerFilter !== "all"
    ? payments.filter(payment => {
        const invoice = invoices.find(inv => inv.id === payment.invoiceId)
        if (!invoice) return false
        const student = students.find(s => s.id === invoice.studentId)
        return student?.centerId === centerFilter
      })
    : payments

  // ── Batch delete computed values ──
  const allPaymentIds = filteredPayments.map(p => p.id)
  const allSelected = allPaymentIds.length > 0 && selectedIds.size === allPaymentIds.length
  const someSelected = selectedIds.size > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allPaymentIds))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBatchDelete = async () => {
    setIsBatchDeleting(true)
    const ids = [...selectedIds]
    for (const id of ids) {
      try {
        await deletePayment(id)
      } catch {
        // continue on error
      }
    }
    setIsBatchDeleting(false)
    setIsBatchDeleteOpen(false)
    setSelectedIds(new Set())
    refetch()
    toast.success(`成功删除 ${ids.length} 条付款记录`)
  }
  
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId)
  
  const calculatePaidAmount = (invoiceId: string) => {
    return payments
      .filter(p => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + p.amount, 0)
  }

  // Stats
  const totalRefundedAmount = getTotalRefundedAmount()
  const totalCollected = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const handleConfirmPayment = async () => {
    if (!selectedInvoice || !paymentAmount || parseFloat(paymentAmount) <= 0) return

    setIsSubmitting(true)
    try {
      const amount = parseFloat(paymentAmount)
      
      // 1. Create the Payment record
      const payment = await createPayment({
        invoiceId: selectedInvoiceId,
        amount: amount,
        method: paymentMethod,
        date: new Date().toISOString(),
        status: 'completed',
        notes: `Payment for invoice ${selectedInvoice.invoiceNumber}`
      }, selectedInvoice)

      // 2. Automatically generate the Receipt
      await createReceipt({
        paymentId: payment.id,
        studentId: selectedInvoice.studentId,
        totalAmount: amount,
        receipt_date: new Date().toISOString().split('T')[0],
        status: 'issued',
        notes: `收据 - ${selectedInvoice.invoiceNumber}`
      })

      setIsPaymentDialogOpen(false)
      setSelectedInvoiceId("")
      setPaymentAmount("")
      toast.success("付款处理成功，收据已生成")
    } catch (error) {
      console.error("Payment failed:", error)
      toast.error("付款处理失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRefund = async () => {
    if (!refundPayment || !refundAmount || parseFloat(refundAmount) <= 0 || !refundReason.trim()) {
      toast.error("请填写退款金额和原因")
      return
    }

    setIsRefunding(true)
    try {
      await createRefund({
        paymentId: refundPayment.id,
        invoiceId: refundPayment.invoiceId,
        amount: parseFloat(refundAmount),
        reason: refundReason,
        method: refundMethod,
        status: 'completed',
        notes: refundNotes || undefined,
      })

      toast.success("退款处理成功")
      setIsRefundDialogOpen(false)
      setRefundPayment(null)
      setRefundAmount("")
      setRefundReason("")
      setRefundMethod("bank_transfer")
      setRefundNotes("")
    } catch (error) {
      console.error("Refund failed:", error)
      toast.error("退款处理失败，请重试")
    } finally {
      setIsRefunding(false)
    }
  }

  const openRefundDialog = (payment: Payment) => {
    setRefundPayment(payment)
    setRefundAmount(String(payment.amount))
    setRefundReason("")
    setRefundMethod("bank_transfer")
    setRefundNotes("")
    setIsRefundDialogOpen(true)
  }

  // Auto-fill payment amount with remaining balance when invoice is selected
  useEffect(() => {
    if (selectedInvoice) {
      const remaining = selectedInvoice.totalAmount - calculatePaidAmount(selectedInvoiceId)
      if (remaining > 0) {
        setPaymentAmount(String(remaining))
      }
    }
  }, [selectedInvoiceId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">{t('assignment.completed')}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t('common.pending')}</Badge>
      case 'failed':
        return <Badge className="bg-red-500 hover:bg-red-600">{t('finance.failed')}</Badge>
      case 'refunded':
        return <Badge className="bg-purple-500 hover:bg-purple-600">已退款</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Check if a payment was partial (after this payment, invoice is still not fully paid)
  const isPaymentPartial = (payment: Payment) => {
    const inv = invoices.find(i => i.id === payment.invoiceId)
    if (!inv) return false
    const totalCompletedForInvoice = payments
      .filter(p => p.invoiceId === inv.id && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    return totalCompletedForInvoice < inv.totalAmount
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-500" />
            付款管理
          </h2>
          <p className="text-slate-500">处理学生缴费，自动生成收据并更新发票状态</p>
        </div>
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="h-4 w-4" /> 记录新付款
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-hidden">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <DialogTitle className="text-xl">处理付款记录</DialogTitle>
              </div>
              <DialogDescription>
                请选择待缴费的发票并输入实付金额。系统将自动生成电子收据。
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    选择发票
                  </Label>
                  <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择发票" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredInvoices.map(inv => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.studentName} - {inv.invoiceNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    支付方式
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择支付方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">{t('finance.bank_transfer')}</SelectItem>
                      <SelectItem value="Cash">{t('finance.cash')}</SelectItem>
                      <SelectItem value="Online Banking">网银</SelectItem>
                      <SelectItem value="TNG">Touch 'n Go eWallet</SelectItem>
                      <SelectItem value="DuitNow">DuitNow</SelectItem>
                      <SelectItem value="Credit Card">信用卡</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-center mb-4">
                  <p className="text-xs text-slate-500 uppercase font-bold">付款汇总</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">发票总额:</span>
                    <span className="font-mono font-medium">RM {selectedInvoice?.totalAmount.toLocaleString() || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">已支付金额:</span>
                    <span className="font-mono font-medium text-green-600">RM {calculatePaidAmount(selectedInvoiceId || "").toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base font-bold">
                    <span className="text-slate-900">剩余待缴:</span>
                    <span className="font-mono text-blue-600">
                      RM {(selectedInvoice ? selectedInvoice.totalAmount - calculatePaidAmount(selectedInvoiceId) : 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  本次实付金额 (RM)
                </Label>
                <Input 
                  type="number" 
                  className="text-lg font-mono" 
                  placeholder="0.00" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>{t('report.cancel')}</Button>
                <Button 
                  onClick={handleConfirmPayment} 
                  disabled={isSubmitting || !selectedInvoiceId || !paymentAmount}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 min-w-32"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 处理中...</>
                  ) : (
                    "确认付款"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">收款总额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              RM {totalCollected.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">总退款金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              RM {totalRefundedAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">净收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              RM {(totalCollected - totalRefundedAmount).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>付款流水明细</CardTitle>
              <CardDescription>所有学生缴费记录及状态</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="搜索学生或发票..." 
                className="pl-9" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-red-700">已选择 <strong>{selectedIds.size}</strong> 条付款记录</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearSelection}><XCircle className="h-4 w-4 mr-1" />{t('finance.clear_selection')}</Button>
                <Button variant="destructive" size="sm" onClick={() => setIsBatchDeleteOpen(true)}><Trash2 className="h-4 w-4 mr-1" />删除选中({selectedIds.size})</Button>
              </div>
            </div>
          )}
          {paymentsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-500">加载付款记录中...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{t('finance.no_payment_records')}</p>
            </div>
          ) : (
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
                  <TableHead>{t('finance.date')}</TableHead>
                  <TableHead>{t('common.student')}</TableHead>
                  <TableHead>{t('finance.invoice_no')}</TableHead>
                  <TableHead>支付方式</TableHead>
                  <TableHead className="text-right">实付金额</TableHead>
                  <TableHead className="text-center">{t('teacher.status')}</TableHead>
                  <TableHead className="text-center">{t('teacher.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const inv = invoices.find(i => i.id === payment.invoiceId)
                  const partial = isPaymentPartial(payment)
                  return (
                    <TableRow key={payment.id} className={selectedIds.has(payment.id) ? "bg-red-50/50" : "group"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(payment.id)}
                          onCheckedChange={() => toggleSelect(payment.id)}
                          aria-label={`选择付款记录 ${inv?.studentName || ''}`}
                        />
                      </TableCell>
                      <TableCell className="text-slate-600">{formatDate(payment.date)}</TableCell>
                      <TableCell className="font-medium">{inv?.studentName || "未知学生"}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">{inv?.invoiceNumber || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{payment.method}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        RM {payment.amount.toLocaleString()}
                        {partial && payment.status === 'completed' && (
                          <span className="text-xs text-amber-500 ml-1 font-normal">(部分)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {payment.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openRefundDialog(payment)}
                          >
                            <Undo2 className="h-3.5 w-3.5 mr-1" />
                            退款
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              批量删除付款记录
            </DialogTitle>
            <DialogDescription />
            <div className="space-y-2 mt-2">
              <p className="text-sm">
                确定要删除选中的 <span className="font-bold text-red-600">{selectedIds.size}</span> 条付款记录吗？
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-40 overflow-y-auto">
                <ul className="text-xs space-y-0.5">
                  {[...selectedIds].map(id => {
                    const payment = filteredPayments.find(p => p.id === id)
                    const inv = payment ? invoices.find(i => i.id === payment.invoiceId) : null
                    return payment ? (
                      <li key={id} className="text-red-700">
                        • {inv?.studentName || "未知学生"} — {payment.date.split('T')[0]} — RM {payment.amount.toLocaleString()}
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
                  删除 {selectedIds.size} 条记录
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Undo2 className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-xl">处理退款</DialogTitle>
            </div>
            <DialogDescription>
              请填写退款信息。系统将记录退款并更新相关状态。
            </DialogDescription>
          </DialogHeader>

          {refundPayment && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-50 rounded-lg border text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">原始付款金额:</span>
                  <span className="font-medium">RM {refundPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">支付方式:</span>
                  <span className="font-medium">{refundPayment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">付款日期:</span>
                  <span className="font-medium">{refundPayment.date.split('T')[0]}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  退款金额 (RM)
                </Label>
                <Input
                  type="number"
                  className="text-lg font-mono"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={refundPayment.amount}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  退款原因 <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="请输入退款原因"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">退款方式</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择退款方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">{t('finance.bank_transfer')}</SelectItem>
                    <SelectItem value="cash">{t('finance.cash')}</SelectItem>
                    <SelectItem value="credit_note">信用凭证</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('teacher.notes')}</Label>
                <Input
                  placeholder="可选备注信息"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>{t('report.cancel')}</Button>
                <Button
                  onClick={handleRefund}
                  disabled={isRefunding || !refundAmount || parseFloat(refundAmount) <= 0 || !refundReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 min-w-32"
                >
                  {isRefunding ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 处理中...</>
                  ) : (
                    "确认退款"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
