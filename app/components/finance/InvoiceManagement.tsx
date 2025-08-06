"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Plus, Download, Printer, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useInvoices } from "@/hooks/useInvoices"
import { downloadInvoicePDF, printInvoicePDF, PDFOptions } from "@/lib/pdf-generator"
import { useStudents } from "@/hooks/useStudents"
import { useStudentFees } from "@/hooks/useStudentFees"
import { useFees } from "@/hooks/useFees"

export default function InvoiceManagement() {
  const {
    invoices,
    filters: invoiceFilters,
    setFilters: setInvoiceFilters,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    sendInvoiceReminder,
    getFilteredInvoices,
    generateInvoiceFromStudentFees,
    generateInvoicesForAllStudents,
    generateMonthlyInvoices,
    checkOverdueInvoices,
    getInvoiceStatistics,
    generateInvoiceNumber
  } = useInvoices()

  // Get student data and fee calculations
  const { students } = useStudents()
  const { calculateStudentTotal } = useStudentFees()
  const { feeItems } = useFees()

  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false)
  const [isBulkInvoiceDialogOpen, setIsBulkInvoiceDialogOpen] = useState(false)
  const [isInvoiceDetailDialogOpen, setIsInvoiceDetailDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

  // Get active fees and filter out graduated students
  const activeFees = feeItems.filter(fee => fee.status === 'active')
  const availableStudents = students.filter(student => student.grade !== '已毕业')

  // Calculate student amounts for invoice creation
  const studentsWithAmounts = useMemo(() => {
    return availableStudents.map(student => ({
      ...student,
      amount: calculateStudentTotal(Number(student.id), activeFees)
    }))
  }, [availableStudents, calculateStudentTotal, activeFees])

  // PDF options for school branding
  const pdfOptions: PDFOptions = {
    schoolName: "智慧教育学校",
    schoolAddress: "北京市朝阳区教育路123号",
    schoolPhone: "010-12345678",
    schoolEmail: "info@smarteducation.com",
    taxNumber: "91110105MA12345678"
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">草稿</Badge>
      case "issued":
        return <Badge variant="default">已开具</Badge>
      case "sent":
        return <Badge variant="secondary">已发送</Badge>
      case "pending":
        return <Badge variant="secondary">待付款</Badge>
      case "overdue":
        return <Badge variant="destructive">逾期</Badge>
      case "paid":
        return <Badge variant="default">已付款</Badge>
      case "cancelled":
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleDownloadInvoice = async (invoice: any) => {
    try {
      await downloadInvoicePDF(invoice, pdfOptions)
    } catch (error) {
      console.error('Failed to download invoice:', error)
    }
  }

  const handlePrintInvoice = async (invoice: any) => {
    try {
      await printInvoicePDF(invoice, pdfOptions)
    } catch (error) {
      console.error('Failed to print invoice:', error)
    }
  }

  const handleSendInvoice = (invoice: any) => {
    updateInvoiceStatus(invoice.id, 'sent')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            发票管理
          </CardTitle>
          <CardDescription>学生发票开具和管理</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={invoiceFilters.status} onValueChange={(value) => setInvoiceFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="发票状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="issued">已开具</SelectItem>
                <SelectItem value="sent">已发送</SelectItem>
                <SelectItem value="pending">待付款</SelectItem>
                <SelectItem value="overdue">逾期</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            
            <Input 
              placeholder="搜索学生姓名..." 
              value={invoiceFilters.studentName}
              onChange={(e) => setInvoiceFilters(prev => ({ ...prev, studentName: e.target.value }))}
              className="w-[200px]"
            />
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsBulkInvoiceDialogOpen(true)}>
                批量开具
              </Button>
              <Button variant="outline" size="sm">
                导出发票
              </Button>
              <Button variant="outline" size="sm">
                发送提醒
              </Button>
            </div>
            <Button size="sm" onClick={() => setIsCreateInvoiceDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新建发票
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>发票号码</TableHead>
                <TableHead>学生姓名</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>发票状态</TableHead>
                <TableHead>开具日期</TableHead>
                <TableHead>到期日期</TableHead>
                <TableHead>付款日期</TableHead>
                <TableHead>提醒状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredInvoices().map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.student}</TableCell>
                  <TableCell>¥{invoice.totalAmount}</TableCell>
                  <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                  <TableCell>{invoice.issueDate}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>{invoice.paidDate || "-"}</TableCell>
                  <TableCell>
                    {invoice.reminderSent ? (
                      <Badge variant="outline" className="text-xs">
                        已提醒 ({invoice.lastReminderDate})
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">未提醒</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setIsInvoiceDetailDialogOpen(true)
                        }}
                      >
                        查看
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                        disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                      >
                        发送
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => sendInvoiceReminder(invoice.id)}
                        disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                      >
                        提醒
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                        disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                      >
                        标记已付
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月发票</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">已开具发票数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">发票总额</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{invoices.reduce((sum, invoice) => sum + invoice.amount, 0)}</div>
            <p className="text-xs text-muted-foreground">所有发票总金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已付款</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.filter(inv => inv.status === 'paid').length}</div>
            <p className="text-xs text-muted-foreground">已付款发票</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付款</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.filter(inv => inv.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">待付款发票</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Detail Dialog */}
      <Dialog open={isInvoiceDetailDialogOpen} onOpenChange={setIsInvoiceDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>发票详情 - {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">发票信息</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">发票号码:</span> {selectedInvoice.invoiceNumber}</div>
                    <div><span className="font-medium">学生姓名:</span> {selectedInvoice.student}</div>
                    <div><span className="font-medium">开具日期:</span> {selectedInvoice.issueDate}</div>
                    <div><span className="font-medium">到期日期:</span> {selectedInvoice.dueDate}</div>
                    <div><span className="font-medium">状态:</span> {getInvoiceStatusBadge(selectedInvoice.status)}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">付款信息</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">付款方式:</span> {selectedInvoice.paymentMethod || "未付款"}</div>
                    <div><span className="font-medium">付款日期:</span> {selectedInvoice.paidDate || "未付款"}</div>
                    <div><span className="font-medium">家长邮箱:</span> {selectedInvoice.parentEmail}</div>
                    <div><span className="font-medium">提醒状态:</span> {selectedInvoice.reminderSent ? "已发送" : "未发送"}</div>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className="font-semibold mb-3">费用明细</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>项目名称</TableHead>
                      <TableHead>金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item: { name: string; amount: number }, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>¥{item.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Invoice Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="text-sm">小计: ¥{selectedInvoice.amount}</div>
                    <div className="text-sm">税费: ¥{selectedInvoice.tax}</div>
                    <div className="text-sm">折扣: -¥{selectedInvoice.discount}</div>
                    <div className="font-semibold">总计: ¥{selectedInvoice.totalAmount}</div>
                  </div>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadInvoice(selectedInvoice)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下载PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePrintInvoice(selectedInvoice)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      打印
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSendInvoice(selectedInvoice)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      发送邮件
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>新建发票</DialogTitle>
            <DialogDescription>从学生费用分配中选择学生和金额</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选择学生和金额</Label>
              <div className="max-h-96 overflow-y-auto border rounded-md p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>年级</TableHead>
                      <TableHead>家长姓名</TableHead>
                      <TableHead>应缴费金额</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsWithAmounts.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>{student.parentName}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ¥{student.amount}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // TODO: Implement invoice creation for this student
                              console.log('Creating invoice for:', student.name, 'Amount:', student.amount)
                            }}
                          >
                            创建发票
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateInvoiceDialogOpen(false)}>
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Invoice Dialog */}
      <Dialog open={isBulkInvoiceDialogOpen} onOpenChange={setIsBulkInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>批量开具发票</DialogTitle>
            <DialogDescription>按年级批量创建发票</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选择年级</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[...new Set(studentsWithAmounts.map(student => student.grade))].map(grade => (
                  <div key={grade} className="flex items-center space-x-2">
                    <Checkbox id={`bulk-grade-${grade}`} />
                    <Label htmlFor={`bulk-grade-${grade}`} className="text-sm">{grade}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>预览选中年级的学生</Label>
              <div className="max-h-64 overflow-y-auto border rounded-md p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>年级</TableHead>
                      <TableHead>应缴费金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsWithAmounts.slice(0, 5).map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ¥{student.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                    {studentsWithAmounts.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                          还有 {studentsWithAmounts.length - 5} 个学生...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div>
              <Label>到期日期</Label>
              <Input type="date" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBulkInvoiceDialogOpen(false)}>
                取消
              </Button>
              <Button>批量开具</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 