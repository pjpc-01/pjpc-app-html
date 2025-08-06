"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreditCard, DollarSign, CheckCircle, AlertCircle, RotateCcw, Eye, Loader2 } from "lucide-react"
import { usePayments } from "@/hooks/usePayments"
import { useInvoices } from "@/hooks/useInvoices"

export default function PaymentManagement() {
  const { invoices } = useInvoices()
  const {
    payments,
    filters: paymentFilters,
    setFilters: setPaymentFilters,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentByInvoice,
    getInvoiceOutstandingBalance,
    getInvoicePaymentHistory,
    addPaymentToInvoice,
    getFilteredPayments,
    getPaymentStatistics,
    reconcilePayments,
    processPartialPayment
  } = usePayments(invoices)

  const [isPaymentDetailDialogOpen, setIsPaymentDetailDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isProcessPaymentDialogOpen, setIsProcessPaymentDialogOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">已缴费</Badge>
      case "pending":
        return <Badge variant="secondary">待缴费</Badge>
      case "overdue":
        return <Badge variant="destructive">逾期</Badge>
      case "refunded":
        return <Badge variant="outline">已退款</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleProcessPayment = (invoiceId: number, amount: number, method: string) => {
    const { payment, isFullyPaid } = processPartialPayment(invoiceId, amount, method as any)
    if (isFullyPaid) {
      // Update invoice status to paid
      console.log('Payment processed successfully')
    }
  }

  const handleRefundPayment = (paymentId: number) => {
    if (confirm("确定要退款吗？")) {
      updatePayment(paymentId, { status: 'refunded' })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            缴费记录
          </CardTitle>
          <CardDescription>学生缴费情况管理</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={paymentFilters.status} onValueChange={(value) => setPaymentFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="缴费状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="paid">已缴费</SelectItem>
                <SelectItem value="pending">待缴费</SelectItem>
                <SelectItem value="overdue">逾期</SelectItem>
                <SelectItem value="refunded">已退款</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentFilters.method} onValueChange={(value) => setPaymentFilters(prev => ({ ...prev, method: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="支付方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部方式</SelectItem>
                <SelectItem value="cash">现金</SelectItem>
                <SelectItem value="bank_transfer">银行转账</SelectItem>
                <SelectItem value="wechat">微信支付</SelectItem>
                <SelectItem value="alipay">支付宝</SelectItem>
                <SelectItem value="card">银行卡</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              placeholder="搜索学生姓名..." 
              value={paymentFilters.studentName}
              onChange={(e) => setPaymentFilters(prev => ({ ...prev, studentName: e.target.value }))}
              className="w-[200px]"
            />
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                导出记录
              </Button>
              <Button variant="outline" size="sm">
                对账
              </Button>
            </div>
            <Button size="sm" onClick={() => setIsProcessPaymentDialogOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              处理缴费
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead>付款编号</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>缴费状态</TableHead>
                <TableHead>缴费日期</TableHead>
                <TableHead>支付方式</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredPayments().map((payment) => {
                const invoice = invoices.find(inv => inv.id === payment.invoiceId)
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{invoice?.student || '未知学生'}</TableCell>
                    <TableCell>{payment.reference}</TableCell>
                    <TableCell>¥{payment.amount}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.method}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setIsPaymentDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payment.status === "paid" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRefundPayment(payment.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月缴费</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">缴费记录数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缴费总额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{payments.reduce((sum, payment) => sum + payment.amount, 0)}</div>
            <p className="text-xs text-muted-foreground">累计缴费金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已缴费</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.filter(p => p.status === 'paid').length}</div>
            <p className="text-xs text-muted-foreground">已缴费记录</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待缴费</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.filter(p => p.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">待缴费记录</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Detail Dialog */}
      <Dialog open={isPaymentDetailDialogOpen} onOpenChange={setIsPaymentDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>缴费详情 - {selectedPayment?.reference}</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">缴费信息</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">付款编号:</span> {selectedPayment.reference}</div>
                    <div><span className="font-medium">缴费金额:</span> ¥{selectedPayment.amount}</div>
                    <div><span className="font-medium">缴费状态:</span> {getStatusBadge(selectedPayment.status)}</div>
                    <div><span className="font-medium">缴费日期:</span> {selectedPayment.date}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">支付信息</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">支付方式:</span> {selectedPayment.method}</div>
                    <div><span className="font-medium">交易编号:</span> {selectedPayment.transactionId || "无"}</div>
                    <div><span className="font-medium">处理时间:</span> {selectedPayment.processedAt || "无"}</div>
                    <div><span className="font-medium">备注:</span> {selectedPayment.notes || "无"}</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">关联发票</h3>
                {(() => {
                  const invoice = invoices.find(inv => inv.id === selectedPayment.invoiceId)
                  return invoice ? (
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">发票号码:</span> {invoice.invoiceNumber}</div>
                      <div><span className="font-medium">学生姓名:</span> {invoice.student}</div>
                      <div><span className="font-medium">发票金额:</span> ¥{invoice.totalAmount}</div>
                      <div><span className="font-medium">发票状态:</span> {invoice.status}</div>
                    </div>
                  ) : (
                    <p className="text-gray-500">未找到关联发票</p>
                  )
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Payment Dialog */}
      <Dialog open={isProcessPaymentDialogOpen} onOpenChange={setIsProcessPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>处理缴费</DialogTitle>
            <DialogDescription>为学生处理缴费记录</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选择发票</Label>
              <Select onValueChange={(value) => {
                const invoice = invoices.find(inv => inv.id === parseInt(value))
                setSelectedInvoiceForPayment(invoice)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要缴费的发票" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.filter(inv => inv.status !== 'paid').map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id.toString()}>
                      {invoice.invoiceNumber} - {invoice.student} (¥{invoice.totalAmount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedInvoiceForPayment && (
              <>
                <div>
                  <Label>缴费金额</Label>
                  <Input 
                    type="number" 
                    placeholder="输入缴费金额"
                    defaultValue={selectedInvoiceForPayment.totalAmount}
                  />
                </div>
                
                <div>
                  <Label>支付方式</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择支付方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">现金</SelectItem>
                      <SelectItem value="bank_transfer">银行转账</SelectItem>
                      <SelectItem value="wechat">微信支付</SelectItem>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="card">银行卡</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>备注</Label>
                  <Input placeholder="缴费备注..." />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsProcessPaymentDialogOpen(false)}>
                取消
              </Button>
              <Button disabled={!selectedInvoiceForPayment}>
                确认缴费
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 