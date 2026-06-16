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
  DollarSign
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { usePayments } from "@/hooks/usePayments"
import { useInvoices } from "@/hooks/useInvoices"
import { useReceipts } from "@/hooks/useReceipts"

export default function PaymentManagement() {
  const { invoices, loading: invoicesLoading } = useInvoices()
  const { payments, loading: paymentsLoading, createPayment } = usePayments()
  const { createReceipt } = useReceipts()
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredInvoices = invoices.filter(inv => 
    inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId)
  
  const calculatePaidAmount = (invoiceId: string) => {
    return payments
      .filter(p => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + p.amount, 0)
  }

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
        notes: `Payment for invoice ${selectedInvoice.invoiceNumber}`
      })

      // 2. Automatically generate the Receipt
      await createReceipt({
        paymentId: payment.id,
        studentName: selectedInvoice.studentName,
        amount: amount,
        date: new Date().toISOString(),
        receiptNumber: `REC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      })

      setIsPaymentDialogOpen(false)
      setSelectedInvoiceId("")
      setPaymentAmount("")
    } catch (error) {
      console.error("Payment failed:", error)
      alert("付款处理失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
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
                      <SelectItem value="Bank Transfer">银行转账</SelectItem>
                      <SelectItem value="Cash">现金</SelectItem>
                      <SelectItem value="Online Banking">网银</SelectItem>
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
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>取消</Button>
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
          {paymentsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-500">加载付款记录中...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">暂无付款记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>学生</TableHead>
                  <TableHead>发票编号</TableHead>
                  <TableHead>支付方式</TableHead>
                  <TableHead className="text-right">实付金额</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const inv = invoices.find(i => i.id === payment.invoiceId)
                  return (
                    <TableRow key={payment.id} className="group">
                      <TableCell className="text-slate-600">{payment.date.split('T')[0]}</TableCell>
                      <TableCell className="font-medium">{inv?.studentName || "未知学生"}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">{inv?.invoiceNumber || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{payment.method}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        RM {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500 hover:bg-green-600">已到账</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
