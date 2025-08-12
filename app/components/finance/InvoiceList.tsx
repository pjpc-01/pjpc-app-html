"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Printer, Send, CheckCircle, AlertCircle, Loader2, Eye, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null)

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
  const getPaymentStatusBadge = (invoiceId: number) => {
    const invoicePayments = payments.filter(payment => payment.invoiceId === invoiceId)
    
    if (invoicePayments.length === 0) {
      return <Badge variant="outline">未缴费</Badge>
    }
    
    const completedPayments = invoicePayments.filter(p => p.status === 'completed')
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)
    const invoice = invoices.find(inv => inv.id === invoiceId)
    
    if (!invoice) {
      return <Badge variant="outline">未知</Badge>
    }
    
    if (totalPaid >= invoice.totalAmount) {
      return <Badge variant="default">已缴费</Badge>
    } else {
      return <Badge variant="secondary">待缴费</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
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
              <Label htmlFor="search">搜索</Label>
              <Input
                id="search"
                placeholder="搜索发票号码、学生姓名..."
                value={filters.search || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="w-48">
              <Label>缴费状态</Label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
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
              <Label>年级</Label>
              <Select 
                value={filters.grade || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有年级</SelectItem>
                  <SelectItem value="一年级">一年级</SelectItem>
                  <SelectItem value="二年级">二年级</SelectItem>
                  <SelectItem value="三年级">三年级</SelectItem>
                  <SelectItem value="四年级">四年级</SelectItem>
                  <SelectItem value="五年级">五年级</SelectItem>
                  <SelectItem value="六年级">六年级</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发票号码</TableHead>
                  <TableHead>收据号码</TableHead>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>缴费状态</TableHead>
                  <TableHead>开具日期</TableHead>
                  <TableHead>到期日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-blue-600 font-medium">
                      {invoice.receiptNumber || '待生成'}
                    </TableCell>
                    <TableCell>{invoice.studentName}</TableCell>
                    <TableCell>{invoice.grade}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(invoice.amount)}
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
                        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)
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
                        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)
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
                    <p className="text-sm font-medium text-gray-600">逾期</p>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这张发票吗？
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
    </>
  )
}
