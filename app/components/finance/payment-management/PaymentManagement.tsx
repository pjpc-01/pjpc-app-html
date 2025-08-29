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
  const { payments, loading, error, createPayment, isCreating } = usePaymentData()
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
        description: "Payment created successfully"
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

  // Get status badge
  const getStatusBadge = (status: string) => {
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
    const methodIcons: Record<string, any> = {
      cash: DollarSign,
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

      {/* Manage Invoices Section - Duplicated from Invoice Tab */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Invoice Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                      <p className="text-2xl font-bold">{availableInvoices.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                      <p className="text-2xl font-bold text-red-600">
                        {availableInvoices.filter(inv => inv.status === 'pending').length}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Paid</p>
                      <p className="text-2xl font-bold text-green-600">
                        {availableInvoices.filter(inv => inv.status === 'paid').length}
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
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        RM {(availableInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>发票ID</TableHead>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>到期日期</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        暂无发票记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
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
                          {getStatusBadge(invoice.status || 'pending')}
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
          </div>
        </CardContent>
      </Card>

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
                      <TableHead>金额</TableHead>
                      <TableHead>缴费方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>缴费日期</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          暂无付款记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.payment_id || 'N/A'}
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
                            {getStatusBadge(payment.status || 'pending')}
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
                        </TableRow>
                      ))
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建付款</DialogTitle>
            <DialogDescription>
              为学生创建新的付款记录
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoice_id">选择发票</Label>
              <Select 
                value={paymentFormData.invoice_id} 
                onValueChange={(value) => {
                  const selectedInvoice = availableInvoices.find(inv => inv.id === value)
                  setPaymentFormData(prev => ({ 
                    ...prev, 
                    invoice_id: value,
                    amount: selectedInvoice ? selectedInvoice.total_amount.toString() : ''
                  }))
                }}
                disabled={invoicesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={invoicesLoading ? "加载中..." : "选择要支付的发票"} />
                </SelectTrigger>
                <SelectContent>
                  {invoicesLoading ? (
                    <SelectItem value="" disabled>加载发票中...</SelectItem>
                  ) : availableInvoices.length === 0 ? (
                    <SelectItem value="" disabled>暂无可用发票</SelectItem>
                  ) : (
                    availableInvoices
                      .filter(invoice => invoice.status === 'pending')
                      .map(invoice => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_id} - {invoice.student_name} (RM {invoice.total_amount})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {invoicesLoading && (
                <p className="text-sm text-gray-500 mt-1">正在加载发票数据...</p>
              )}
            </div>
            
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