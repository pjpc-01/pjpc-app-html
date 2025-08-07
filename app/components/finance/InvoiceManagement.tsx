"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Plus, Download, Printer, Send, CheckCircle, AlertCircle, Eye, Edit, Settings } from "lucide-react"
import { useInvoices } from "@/hooks/useInvoices"
import { downloadInvoicePDF, printInvoicePDF, PDFOptions } from "@/lib/pdf-generator"
import { useStudents } from "@/hooks/useStudents"
import { useStudentFees } from "@/hooks/useStudentFees"
import { useFees } from "@/hooks/useFees"
import { renderInvoiceTemplate, type TemplateData } from "@/lib/template-renderer"
import { InvoiceTemplate } from "./InvoiceTemplateManager"
import { InvoiceCreateDialog } from "./InvoiceCreateDialog"
import { BulkInvoiceDialog } from "./BulkInvoiceDialog"
import { InvoiceList } from "./InvoiceList"
import InvoiceTemplateManager from "./InvoiceTemplateManager"

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
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [selectedStudentForInvoice, setSelectedStudentForInvoice] = useState<any>(null)
  const [isCreateInvoiceFormOpen, setIsCreateInvoiceFormOpen] = useState(false)
  const [invoiceFormData, setInvoiceFormData] = useState({
    dueDate: '',
    notes: '',
    paymentMethod: 'bank_transfer'
  })

  // Template management
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [isTemplateSelectDialogOpen, setIsTemplateSelectDialogOpen] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState<InvoiceTemplate[]>([
    {
      id: "1",
      name: "标准发票模板",
      description: "默认的学校发票模板",
      htmlContent: `
        <div class="invoice-template">
          <div class="header">
            <h1>{{schoolName}}</h1>
            <p>{{schoolAddress}}</p>
            <p>电话: {{schoolPhone}}</p>
          </div>
          <div class="invoice-info">
            <h2>发票</h2>
            <p>发票号码: {{invoiceNumber}}</p>
            <p>开具日期: {{issueDate}}</p>
            <p>到期日期: {{dueDate}}</p>
          </div>
          <div class="student-info">
            <h3>学生信息</h3>
            <p>学生姓名: {{studentName}}</p>
            <p>年级: {{studentGrade}}</p>
            <p>家长姓名: {{parentName}}</p>
          </div>
          <div class="items">
            <h3>费用明细</h3>
            {{#each items}}
            <div class="item">
              <span>{{name}}</span>
              <span>¥{{amount}}</span>
            </div>
            {{/each}}
          </div>
          <div class="total">
            <h3>总计: ¥{{totalAmount}}</h3>
          </div>
        </div>
      `,
      variables: [
        "schoolName", "schoolAddress", "schoolPhone", "invoiceNumber", 
        "issueDate", "dueDate", "studentName", "studentGrade", 
        "parentName", "items", "totalAmount"
      ],
      isDefault: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    }
  ])

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

  const handleCreateInvoiceForStudent = (student: any) => {
    setSelectedStudentForInvoice(student)
    setIsCreateInvoiceFormOpen(true)
    setIsCreateInvoiceDialogOpen(false)
  }

  const handleSubmitInvoice = () => {
    if (!selectedStudentForInvoice) return

    // Get the selected template or default template
    const template = selectedTemplate || availableTemplates.find(t => t.isDefault)
    
    if (!template) {
      console.error('No template available')
      return
    }

    // Prepare template data
    const templateData: TemplateData = {
      schoolName: "智慧教育学校",
      schoolAddress: "北京市朝阳区教育路123号",
      schoolPhone: "010-12345678",
      schoolEmail: "info@smarteducation.com",
      invoiceNumber: generateInvoiceNumber(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: invoiceFormData.dueDate,
      studentName: selectedStudentForInvoice.name,
      studentGrade: selectedStudentForInvoice.grade,
      parentName: selectedStudentForInvoice.parentName,
      items: [
        { name: "学生费用", amount: selectedStudentForInvoice.amount }
      ],
      totalAmount: selectedStudentForInvoice.amount,
      tax: 0,
      discount: 0,
      paymentMethod: invoiceFormData.paymentMethod,
      notes: invoiceFormData.notes
    }

    // Render the template with data
    const renderedHtml = renderInvoiceTemplate(template.htmlContent, templateData)

    const newInvoice = {
      id: Date.now(), // Temporary ID
      invoiceNumber: templateData.invoiceNumber,
      student: selectedStudentForInvoice.name,
      studentId: selectedStudentForInvoice.id,
      amount: selectedStudentForInvoice.amount,
      items: templateData.items,
      status: "issued" as const,
      issueDate: templateData.issueDate,
      dueDate: templateData.dueDate,
      paidDate: null,
      paymentMethod: templateData.paymentMethod || null,
      notes: templateData.notes || '',
      tax: templateData.tax,
      discount: templateData.discount,
      totalAmount: templateData.totalAmount,
      parentEmail: `${selectedStudentForInvoice.parentName}@example.com`,
      reminderSent: false,
      lastReminderDate: null,
      // Add template information
      templateId: template.id,
      templateName: template.name,
      renderedHtml: renderedHtml
    }

    createInvoice(newInvoice)
    
    // Reset form
    setSelectedStudentForInvoice(null)
    setSelectedTemplate(null)
    setInvoiceFormData({
      dueDate: '',
      notes: '',
      paymentMethod: 'bank_transfer'
    })
    setIsCreateInvoiceFormOpen(false)
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
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setIsCreateInvoiceDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新建发票
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTemplateManagerOpen(true)}
                className="p-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <InvoiceList
            invoices={getFilteredInvoices()}
            filters={invoiceFilters}
            setFilters={setInvoiceFilters}
            onDownload={handleDownloadInvoice}
            onPrint={handlePrintInvoice}
            onSend={handleSendInvoice}
            onView={(invoice) => {
              setSelectedInvoice(invoice)
              setIsInvoiceDetailDialogOpen(true)
            }}
            onEdit={(invoice) => {
              // TODO: Implement edit functionality
            }}
            onDelete={(invoice) => {
              // TODO: Implement delete functionality
            }}
            onStatusChange={updateInvoiceStatus}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InvoiceCreateDialog
        isOpen={isCreateInvoiceDialogOpen}
        onOpenChange={setIsCreateInvoiceDialogOpen}
        students={students}
        onCreateInvoice={handleSubmitInvoice}
        selectedStudent={selectedStudentForInvoice}
        setSelectedStudent={setSelectedStudentForInvoice}
        invoiceFormData={invoiceFormData}
        setInvoiceFormData={setInvoiceFormData}
        availableTemplates={availableTemplates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        isTemplateSelectDialogOpen={isTemplateSelectDialogOpen}
        setIsTemplateSelectDialogOpen={setIsTemplateSelectDialogOpen}
      />

      <BulkInvoiceDialog
        isOpen={isBulkInvoiceDialogOpen}
        onOpenChange={setIsBulkInvoiceDialogOpen}
        students={students}
        onBulkCreate={(selectedGrades, dueDate) => {
          // TODO: Implement bulk create functionality
          console.log('Bulk create:', selectedGrades, dueDate)
        }}
      />

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

      {/* Invoice Template Manager Dialog */}
      <Dialog open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>发票模板管理</DialogTitle>
            <DialogDescription>管理自定义发票模板</DialogDescription>
          </DialogHeader>
          <InvoiceTemplateManager />
        </DialogContent>
      </Dialog>

      </div>
    )
 } 