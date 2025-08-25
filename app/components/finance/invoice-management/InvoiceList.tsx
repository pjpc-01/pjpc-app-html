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
  loading?: boolean
  error?: string | null
  onStatusUpdate?: (invoiceId: string, newStatus: string) => void
  onDelete?: (invoice: any) => void
  getStudentTotalAmount?: (studentId: string) => number
}

export function InvoiceList({
  invoices,
  loading = false,
  error = null,
  onStatusUpdate,
  onDelete,
  getStudentTotalAmount
}: InvoiceListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const handleDeleteClick = (invoice: any) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (invoiceToDelete && onDelete) {
      onDelete(invoiceToDelete)
      setIsDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setInvoiceToDelete(null)
  }

  const handleStatusUpdate = (invoiceId: string, newStatus: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(invoiceId, newStatus)
    }
  }

  const getPaymentStatusBadge = (invoice: any) => {
    const status = invoice.status || 'pending'
    
    switch (status) {
      case 'paid':
        return <Badge variant="default">已缴费</Badge>
      case 'pending':
        return <Badge variant="outline">未缴费</Badge>
      case 'overdue':
        return <Badge variant="destructive">逾期</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '未设置'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = !searchTerm || 
      (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.studentName && invoice.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">加载中...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <span className="ml-2 text-red-500">错误: {error}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            发票列表
          </CardTitle>
          <CardDescription>
            管理所有学生发票
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">搜索</Label>
              <Input
                id="search"
                placeholder="搜索发票号码、学生姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label>缴费状态</Label>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有缴费状态</SelectItem>
                  <SelectItem value="pending">未缴费</SelectItem>
                  <SelectItem value="paid">已缴费</SelectItem>
                  <SelectItem value="overdue">逾期</SelectItem>
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
                  <TableHead>学生姓名</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>缴费状态</TableHead>
                  <TableHead>开具日期</TableHead>
                  <TableHead>到期日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无发票数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber || '未设置'}</TableCell>
                      <TableCell>{invoice.studentName || '未知学生'}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(invoice.totalAmount || invoice.amount || 0)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(invoice)}
                      </TableCell>
                      <TableCell>{formatDate(invoice.issueDate || invoice.createdAt)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStatusUpdate(invoice.id, 'paid')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(invoice)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除发票 "{invoiceToDelete?.invoiceNumber}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelDelete}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
