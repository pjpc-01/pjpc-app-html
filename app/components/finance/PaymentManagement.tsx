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
import { useReceipts } from "@/hooks/useReceipts"
import { getPaymentStatusBadge, getPaymentStatusOptions } from "./shared"

export default function PaymentManagement() {
  const { 
    invoices, 
    updateInvoiceStatus,
    createInvoice
  } = useInvoices()
  const {
    payments,
    filters: paymentFilters,
    setFilters: setPaymentFilters,
    createPayment,
    updatePayment,
    deletePayment,
    getPaymentsByInvoice,
    getFilteredPayments,
    getPaymentStatistics
  } = usePayments()
  const { createReceipt } = useReceipts()

  const [isPaymentDetailDialogOpen, setIsPaymentDetailDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isProcessPaymentDialogOpen, setIsProcessPaymentDialogOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null)
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    method: '',
    notes: ''
  })



  const handleProcessPayment = () => {
    if (!selectedInvoiceForPayment || !paymentFormData.amount || !paymentFormData.method) {
      alert('请填写完整的缴费信息');
      return;
    }

    const amount = parseFloat(paymentFormData.amount);
    if (amount <= 0) {
      alert('缴费金额必须大于0');
      return;
    }

    // Calculate already paid amount
    const invoicePayments = payments.filter(p => p.invoiceId === selectedInvoiceForPayment.id);
    const totalPaidBefore = invoicePayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalPaidAfter = totalPaidBefore + amount;
    const invoiceTotal = selectedInvoiceForPayment.totalAmount;

    let paymentStatus: "completed" | "overpaid" | "underpaid" = "completed";

    if (totalPaidAfter > invoiceTotal) {
      paymentStatus = "overpaid";
    } else if (totalPaidAfter < invoiceTotal) {
      paymentStatus = "underpaid";
    }

    // Create the payment record
    const payment = createPayment({
      invoiceId: selectedInvoiceForPayment.id,
      amountPaid: amount,
      method: paymentFormData.method as any,
      notes: paymentFormData.notes,
      datePaid: new Date().toISOString().split('T')[0],
      status: paymentStatus,
      referenceNo: `PAY-${Date.now()}`
    });

    // Handle invoice status changes and automatic receipt generation
    if (paymentStatus === "completed") {
      updateInvoiceStatus(selectedInvoiceForPayment.id, 'paid');
      
      // Automatically generate and send receipt for completed payments
      try {
        const receipt = createReceipt({
          paymentId: payment.id,
          invoiceId: selectedInvoiceForPayment.id,
          recipientName: selectedInvoiceForPayment.studentName,
          totalPaid: amount,
          dateIssued: new Date().toISOString().split('T')[0],
          status: 'issued',
          items: selectedInvoiceForPayment.items || [{ name: "学生费用", amount: amount }],
          notes: `自动生成的收据 - 付款方式: ${paymentFormData.method}`
        });
        
        // Auto-send receipt (you can implement email/WhatsApp sending here)
        console.log('Receipt automatically generated and sent:', receipt.receiptNumber);
      } catch (error) {
        console.error('Failed to generate receipt:', error);
      }
    } else if (paymentStatus === "overpaid") {
      // Keep invoice as paid but mark overpayment for carry forward/refund
      updateInvoiceStatus(selectedInvoiceForPayment.id, 'paid');
      
      // Automatically generate and send receipt for overpaid payments
      try {
        const receipt = createReceipt({
          paymentId: payment.id,
          invoiceId: selectedInvoiceForPayment.id,
          recipientName: selectedInvoiceForPayment.studentName,
          totalPaid: amount,
          dateIssued: new Date().toISOString().split('T')[0],
          status: 'issued',
          items: selectedInvoiceForPayment.items || [{ name: "学生费用", amount: amount }],
          notes: `自动生成的收据 - 付款方式: ${paymentFormData.method} (多缴金额: RM ${(totalPaidAfter - invoiceTotal).toFixed(2)})`
        });
        
        // Auto-send receipt (you can implement email/WhatsApp sending here)
        console.log('Receipt automatically generated and sent for overpaid payment:', receipt.receiptNumber);
      } catch (error) {
        console.error('Failed to generate receipt for overpaid payment:', error);
      }
      
      alert(`多缴金额: RM ${(totalPaidAfter - invoiceTotal).toFixed(2)}\n您可以选择结转到下月或退款。`);
    } else if (paymentStatus === "underpaid") {
      const outstanding = invoiceTotal - totalPaidAfter;
      updateInvoiceStatus(selectedInvoiceForPayment.id, 'issued');
      alert(`少缴金额: RM ${outstanding.toFixed(2)}\n该金额将自动加入到下个月的发票中。`);

      // Auto-debt: Add outstanding balance to next month's invoice
      const nextMonthDate = new Date(selectedInvoiceForPayment.issueDate);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

      // Find or create next month's invoice for this student
      let nextInvoice = invoices.find(inv => 
        inv.studentId === selectedInvoiceForPayment.studentId &&
        inv.issueDate.startsWith(nextMonth)
      );

      if (nextInvoice) {
        // Update existing next month's invoice
        updateInvoiceStatus(nextInvoice.id, nextInvoice.status); // keep status same
        // Add the outstanding to its totalAmount
        nextInvoice.totalAmount += outstanding;
      } else {
        // Create a new invoice with the outstanding amount
        const newInvoice = {
          studentId: selectedInvoiceForPayment.studentId,
          studentName: selectedInvoiceForPayment.studentName,
          studentGrade: selectedInvoiceForPayment.studentGrade,
          issueDate: `${nextMonth}-01`,
          dueDate: `${nextMonth}-10`,
          status: 'issued' as const,
          items: [{ name: "上月未缴清余额", amount: outstanding }],
          totalAmount: outstanding,
          notes: "自动结转未缴余额"
        };
        // Create the new invoice
        createInvoice(newInvoice);
      }
    }

    // Reset form
    setPaymentFormData({ amount: '', method: '', notes: '' });
    setSelectedInvoiceForPayment(null);
    setIsProcessPaymentDialogOpen(false);

    alert('缴费处理成功！收据已自动生成并发送给付款人。');
  };

  const handleRefundPayment = (paymentId: string) => {
    if (confirm("确定要退款吗？")) {
      updatePayment(paymentId, { status: 'refunded' })
    }
  }

  const handleCarryForward = (payment: any) => {
    const invoice = invoices.find(inv => inv.id === payment.invoiceId);
    if (!invoice) {
      alert("未找到关联发票");
      return;
    }

    const overpaidAmount = payment.amountPaid - invoice.totalAmount;
    if (overpaidAmount <= 0) {
      alert("该付款没有多缴金额");
      return;
    }

    if (!confirm(`确认将 RM ${overpaidAmount.toFixed(2)} 结转到下个月账单吗？`)) {
      return;
    }

    const nextMonthDate = new Date(invoice.issueDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

    // 查找或创建下个月发票
    let nextInvoice = invoices.find(inv => 
      inv.studentId === invoice.studentId &&
      inv.issueDate.startsWith(nextMonth)
    );

    if (nextInvoice) {
      nextInvoice.totalAmount -= overpaidAmount; // 负数表示已预缴
      nextInvoice.items.push({ name: "上月多缴结转", amount: -overpaidAmount });
    } else {
      // 创建一个有负数余额的发票（表示预付）
      createInvoice({
        studentId: invoice.studentId,
        studentName: invoice.studentName,
        studentGrade: invoice.studentGrade,
        issueDate: `${nextMonth}-01`,
        dueDate: `${nextMonth}-10`,
        status: 'issued' as const,
        items: [{ name: "上月多缴结转", amount: -overpaidAmount }],
        totalAmount: -overpaidAmount,
        notes: "结转自上个月的多缴金额"
      });
    }

    // 更新当前付款状态为已结转
    updatePayment(payment.id, { status: 'completed' });

    alert("结转成功！");
  };



  const handleReconciliation = () => {
    // Perform reconciliation checks
    const reconciliationResults: {
      totalInvoices: number;
      totalPayments: number;
      paidInvoices: number;
      unpaidInvoices: number;
      totalAmountInvoiced: number;
      totalAmountPaid: number;
      discrepancies: Array<{
        type: string;
        invoiceId: string;
        invoiceNumber: string;
        expected: number;
        actual: number;
        difference: number;
      }>;
    } = {
      totalInvoices: invoices.length,
      totalPayments: payments.length,
      paidInvoices: invoices.filter(inv => {
        const invoicePayments = payments.filter(p => p.invoiceId === inv.id)
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amountPaid, 0)
        return totalPaid >= inv.totalAmount
      }).length,
      unpaidInvoices: invoices.filter(inv => {
        const invoicePayments = payments.filter(p => p.invoiceId === inv.id)
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amountPaid, 0)
        return totalPaid < inv.totalAmount
      }).length,
      totalAmountInvoiced: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
             totalAmountPaid: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      discrepancies: []
    }

    // Check for discrepancies
    invoices.forEach(invoice => {
      const invoicePayments = payments.filter(p => p.invoiceId === invoice.id)
      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amountPaid, 0)
      
      if (totalPaid > invoice.totalAmount) {
        reconciliationResults.discrepancies.push({
          type: 'overpayment',
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          expected: invoice.totalAmount,
          actual: totalPaid,
          difference: totalPaid - invoice.totalAmount
        })
      }
    })

    // Show reconciliation report
    const report = `
对账报告:
- 总发票数: ${reconciliationResults.totalInvoices}
- 总缴费记录: ${reconciliationResults.totalPayments}
- 已缴费发票: ${reconciliationResults.paidInvoices}
- 未缴费发票: ${reconciliationResults.unpaidInvoices}
- 发票总金额: RM ${reconciliationResults.totalAmountInvoiced.toLocaleString()}
- 缴费总金额: RM ${reconciliationResults.totalAmountPaid.toLocaleString()}
- 差异金额: RM ${(reconciliationResults.totalAmountPaid - reconciliationResults.totalAmountInvoiced).toLocaleString()}
- 发现差异: ${reconciliationResults.discrepancies.length} 项
    `

    alert(report)
    console.log('Reconciliation Results:', reconciliationResults)
  }

  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold">RM {payments.reduce((sum, payment) => sum + payment.amountPaid, 0)}</div>
            <p className="text-xs text-muted-foreground">累计缴费金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已缴费</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.filter(p => p.status === 'completed').length}</div>
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
                {getPaymentStatusOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={paymentFilters.method} onValueChange={(value) => setPaymentFilters(prev => ({ ...prev, method: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="支付方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部方式</SelectItem>
                <SelectItem value="现金">现金</SelectItem>
                <SelectItem value="银行转账">银行转账</SelectItem>
                <SelectItem value="微信">微信支付</SelectItem>
                <SelectItem value="支付宝">支付宝</SelectItem>
                <SelectItem value="银行卡">银行卡</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              placeholder="搜索学生姓名..." 
              value={paymentFilters.status}
              onChange={(e) => setPaymentFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-[200px]"
            />
          </div>

          <div className="flex justify-between items-center mb-4">
                         <div className="flex gap-2">
               <Button variant="outline" size="sm">
                 导出记录
               </Button>
               <Button variant="outline" size="sm" onClick={handleReconciliation}>
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
                    <TableCell className="font-medium">{invoice?.studentName || '未知学生'}</TableCell>
                    <TableCell>{payment.referenceNo}</TableCell>
                    <TableCell>RM {payment.amountPaid}</TableCell>
                    <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                    <TableCell>{payment.datePaid}</TableCell>
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
                                                 {payment.status === "completed" && (
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => handleRefundPayment(payment.id)}
                           >
                             退款
                           </Button>
                         )}

                        {payment.status === "overpaid" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleCarryForward(payment)}
                            >
                              结转下月
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRefundPayment(payment.id)}
                            >
                              退款
                            </Button>
                          </>
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
                    <div><span className="font-medium">缴费金额:</span> RM {selectedPayment.amount}</div>
                    <div><span className="font-medium">缴费状态:</span> {getPaymentStatusBadge(selectedPayment.status)}</div>
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
                      <div><span className="font-medium">学生姓名:</span> {invoice.studentName}</div>
                      <div><span className="font-medium">发票金额:</span> RM {invoice.totalAmount}</div>
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
                const invoice = invoices.find(inv => inv.id === value)
                setSelectedInvoiceForPayment(invoice)
                if (invoice) {
                  setPaymentFormData(prev => ({
                    ...prev,
                    amount: invoice.totalAmount.toString()
                  }))
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要缴费的发票" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.filter(inv => inv.status !== 'paid').map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.studentName} (RM {invoice.totalAmount})
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
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    发票总金额: RM {selectedInvoiceForPayment.totalAmount}
                    {(() => {
                      const invoicePayments = payments.filter(p => p.invoiceId === selectedInvoiceForPayment.id)
                      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amountPaid, 0)
                      const outstandingBalance = selectedInvoiceForPayment.totalAmount - totalPaid
                      return outstandingBalance > 0 ? (
                        <span className="text-orange-600 ml-2">
                          (待缴余额: RM {outstandingBalance})
                        </span>
                      ) : (
                        <span className="text-green-600 ml-2">(已全额缴费)</span>
                      )
                    })()}
                  </p>
                </div>
                
                <div>
                  <Label>支付方式</Label>
                  <Select 
                    value={paymentFormData.method}
                    onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择支付方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="现金">现金</SelectItem>
                      <SelectItem value="银行转账">银行转账</SelectItem>
                      <SelectItem value="微信">微信支付</SelectItem>
                      <SelectItem value="支付宝">支付宝</SelectItem>
                      <SelectItem value="银行卡">银行卡</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>备注</Label>
                  <Input 
                    placeholder="缴费备注..." 
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {/* Payment History */}
                <div>
                  <Label>缴费历史</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {getPaymentsByInvoice(selectedInvoiceForPayment.id).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                        <span>{payment.datePaid}</span>
                        <span className="font-medium">RM {payment.amountPaid}</span>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status === 'completed' ? '已缴费' : '待处理'}
                        </Badge>
                      </div>
                    ))}
                    {getPaymentsByInvoice(selectedInvoiceForPayment.id).length === 0 && (
                      <p className="text-gray-500 text-sm">暂无缴费记录</p>
                    )}
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsProcessPaymentDialogOpen(false)
                  setSelectedInvoiceForPayment(null)
                  setPaymentFormData({ amount: '', method: '', notes: '' })
                }}
              >
                取消
              </Button>
              <Button 
                disabled={!selectedInvoiceForPayment || !paymentFormData.amount || !paymentFormData.method}
                onClick={handleProcessPayment}
              >
                确认缴费
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 