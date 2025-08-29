"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Plus
} from "lucide-react"
import { usePaymentData } from "@/hooks/usePaymentData"
import { useInvoiceData } from "@/hooks/useInvoiceData"
import { useToast } from "@/hooks/use-toast"
import { Payment } from "@/types/fees"

// Simple payment form data
interface PaymentFormData {
  amount: string
  method: 'cash' | 'bank_transfer' | 'card' | 'e_wallet'
  notes: string
  invoice_id: string
  transaction_id: string
}

export default function PaymentManagement() {
  const { toast } = useToast()
  const { payments, loading, error, createPayment, refundPayment, isCreating, isRefunding } = usePaymentData()
  const { invoices: availableInvoices, loading: invoicesLoading } = useInvoiceData()
  
  // Basic state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amount: '',
    method: 'cash',
    notes: '',
    invoice_id: '',
    transaction_id: ''
  })

  // Simple filter state
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filtered payments
  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesSearch = !searchTerm || 
      payment.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.amount_paid?.toString().includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  // Handle payment creation
  const handleCreatePayment = async () => {
    if (!paymentFormData.amount || !paymentFormData.method || !paymentFormData.invoice_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (发票, 金额, 缴费方式)",
        variant: "destructive"
      })
      return
    }

    try {
      // Generate payment_id that matches PocketBase validation pattern: ^PAY-\d{4}-\d{5}$
      const currentYear = new Date().getFullYear()
      const randomDigits = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
      const payment_id = `PAY-${currentYear}-${randomDigits}`
      
      const paymentData = {
        payment_id: payment_id,
        amount_paid: parseFloat(paymentFormData.amount),
        payment_method: paymentFormData.method,
        status: 'confirmed' as const,
        payment_date: new Date().toISOString(),
        notes: paymentFormData.notes || '',
        invoice_id: paymentFormData.invoice_id,
        transaction_id: paymentFormData.transaction_id || undefined
      }

      await createPayment(paymentData)
      
      toast({
        title: "Success",
        description: "Payment created successfully and invoice status automatically updated"
      })
      
      setIsCreateDialogOpen(false)
      setPaymentFormData({ amount: '', method: 'cash', notes: '', invoice_id: '', transaction_id: '' })
      
    } catch (error: any) {
      console.error('Payment creation error:', error)
      
      let errorMessage = "Failed to create payment"
      
      // Check for PocketBase validation errors
      if (error.data && error.data.data) {
        const validationErrors = error.data.data
        if (typeof validationErrors === 'object') {
          const errorFields = Object.keys(validationErrors)
          if (errorFields.length > 0) {
            errorMessage = `Validation errors: ${errorFields.join(', ')}`
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Handle payment refund
  const handleRefundPayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to refund this payment? This action cannot be undone.')) {
      return
    }

    try {
      await refundPayment(paymentId, 'Payment refunded by admin')
      
      toast({
        title: "Success",
        description: "Payment refunded successfully and invoice status automatically updated"
      })
      
    } catch (error: any) {
      console.error('Payment refund error:', error)
      
      let errorMessage = "Failed to refund payment"
      
      if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Get invoice status badge
  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">已缴费</Badge>
      case 'overpaid':
        return <Badge className="bg-blue-100 text-blue-800">超额缴费</Badge>
      case 'underpaid':
        return <Badge className="bg-yellow-100 text-yellow-800">部分缴费</Badge>
      case 'pending':
        return <Badge className="bg-red-100 text-red-800">待缴费</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: '已缴费', variant: 'default' as const, icon: CheckCircle },
      pending: { label: '待缴费', variant: 'secondary' as const, icon: AlertCircle },
      failed: { label: '缴费失败', variant: 'destructive' as const, icon: XCircle },
      cancelled: { label: '已取消', variant: 'outline' as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  // Get method icon
  const getMethodIcon = (method: string) => {
    if (method === 'cash') {
      return null // No icon for cash payments
    }
    
    const methodIcons: Record<string, any> = {
      bank_transfer: CreditCard,
      card: CreditCard,
      e_wallet: CreditCard
    }
    
    const Icon = methodIcons[method] || CreditCard
    return <Icon className="w-4 h-4" />
  }

  if (loading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-4" />
          <p>Error loading payments: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">付款管理</h1>
          <p className="text-gray-600">管理学生缴费记录</p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建付款
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总付款数</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已缴费</p>
                <p className="text-2xl font-bold text-green-600">
                  {payments.filter(p => p.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">待缴费</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总金额</p>
                <p className="text-2xl font-bold text-blue-600">
                  RM {payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Main Content */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">付款记录</TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>付款记录</CardTitle>
              <CardDescription>
                查看和管理所有付款记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple Filters */}
              <div className="flex gap-4 mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="缴费状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="confirmed">已缴费</SelectItem>
                    <SelectItem value="pending">待缴费</SelectItem>
                    <SelectItem value="failed">缴费失败</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="搜索付款ID或金额..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[300px]"
                />
              </div>

              {/* Payments Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>付款ID</TableHead>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>发票ID</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>缴费方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>缴费日期</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          暂无付款记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => {
                        // Find the associated invoice to get student name
                        const associatedInvoice = availableInvoices.find(inv => inv.id === payment.invoice_id)
                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {payment.payment_id || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {associatedInvoice?.student_name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {associatedInvoice?.invoice_id || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-600">
                                RM {payment.amount_paid?.toFixed(2) || '0.00'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getMethodIcon(payment.payment_method || '')}
                                <span className="capitalize">
                                  {payment.payment_method || 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(payment.status || 'pending')}
                            </TableCell>
                            <TableCell>
                              {payment.payment_date ? 
                                new Date(payment.payment_date).toLocaleDateString() : 
                                'N/A'
                              }
                            </TableCell>
                            <TableCell>
                              {payment.notes || '-'}
                            </TableCell>
                            <TableCell>
                              {payment.status === 'confirmed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRefundPayment(payment.id)}
                                  disabled={isRefunding}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  退款
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Payment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建付款</DialogTitle>
            <DialogDescription>
              为学生创建新的付款记录 - 请从下方列表中选择要支付的发票
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Invoice Selection Table */}
            <div>
              <Label className="text-base font-medium mb-3 block">选择要支付的发票</Label>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>选择</TableHead>
                      <TableHead>发票ID</TableHead>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>到期日期</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          正在加载发票数据...
                        </TableCell>
                      </TableRow>
                    ) : availableInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          暂无可用发票
                        </TableCell>
                      </TableRow>
                    ) : (
                      availableInvoices
                        .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'overpaid')
                        .map((invoice) => (
                          <TableRow 
                            key={invoice.id} 
                            className={`cursor-pointer hover:bg-gray-50 ${
                              paymentFormData.invoice_id === invoice.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                            onClick={() => {
                              setPaymentFormData(prev => ({ 
                                ...prev, 
                                invoice_id: invoice.id,
                                amount: invoice.total_amount?.toString() || ''
                              }))
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {paymentFormData.invoice_id === invoice.id ? (
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {invoice.invoice_id || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {invoice.student_name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-blue-600">
                                RM {invoice.total_amount?.toFixed(2) || '0.00'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {getInvoiceStatusBadge(invoice.status || 'pending')}
                            </TableCell>
                            <TableCell>
                              {invoice.due_date ? 
                                new Date(invoice.due_date).toLocaleDateString() : 
                                'N/A'
                              }
                            </TableCell>
                            <TableCell>
                              {invoice.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {paymentFormData.invoice_id && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-800">
                    已选择发票: <span className="font-semibold">
                      {availableInvoices.find(inv => inv.id === paymentFormData.invoice_id)?.invoice_id} - 
                      {availableInvoices.find(inv => inv.id === paymentFormData.invoice_id)?.student_name}
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">金额 (RM)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="method">缴费方式</Label>
                <Select 
                  value={paymentFormData.method} 
                  onValueChange={(value: 'cash' | 'bank_transfer' | 'card' | 'e_wallet') => setPaymentFormData(prev => ({ ...prev, method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择缴费方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">现金</SelectItem>
                    <SelectItem value="bank_transfer">银行转账</SelectItem>
                    <SelectItem value="card">信用卡</SelectItem>
                    <SelectItem value="e_wallet">电子钱包</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="transaction_id">交易ID</Label>
              <Input
                id="transaction_id"
                placeholder="交易参考号..."
                value={paymentFormData.transaction_id}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">备注</Label>
              <Input
                id="notes"
                placeholder="付款备注..."
                value={paymentFormData.notes}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleCreatePayment}
              disabled={isCreating}
            >
              {isCreating ? '创建中...' : '创建付款'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 