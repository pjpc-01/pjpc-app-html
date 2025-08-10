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
import { useReceipts } from "@/hooks/useReceipts"
import { usePayments } from "@/hooks/usePayments"
import { renderInvoiceTemplate, type TemplateData } from "@/lib/template-renderer"
import { InvoiceTemplate } from "./InvoiceTemplateManager"
import { InvoiceCreateDialog } from "./InvoiceCreateDialog"
import { BulkInvoiceDialog } from "./BulkInvoiceDialog"
import { InvoiceList } from "./InvoiceList"
import InvoiceTemplateManager from "./InvoiceTemplateManager"
import { getStatusBadge } from "@/lib/utils"

// Types
interface InvoiceFormData {
  dueDate: string
  notes: string
  paymentMethod: string
}

// Constants
const PDF_OPTIONS: PDFOptions = {
  schoolName: "智慧教育学校",
  schoolAddress: "北京市朝阳区教育路123号",
  schoolPhone: "010-12345678",
  schoolEmail: "info@smarteducation.com",
  taxNumber: "91110105MA12345678"
}

// Utility functions
const getInvoiceStatusBadge = (status: string) => {
  const statusMap = {
    draft: { variant: "outline" as const, text: "草稿" },
    issued: { variant: "default" as const, text: "已开具" },
    sent: { variant: "secondary" as const, text: "已发送" },
    pending: { variant: "secondary" as const, text: "待付款" },
    overdue: { variant: "destructive" as const, text: "逾期" },
    paid: { variant: "default" as const, text: "已付款" },
    cancelled: { variant: "destructive" as const, text: "已取消" }
  }
  
  const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: "outline" as const, text: status }
  return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
}

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

  // Data hooks
  const { students } = useStudents()
  const { calculateStudentTotal } = useStudentFees()
  const { feeItems } = useFees()
  const { createReceiptFromInvoice } = useReceipts()
  const { payments } = usePayments(invoices)

  // State
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false)
  const [isBulkInvoiceDialogOpen, setIsBulkInvoiceDialogOpen] = useState(false)
  const [isInvoiceDetailDialogOpen, setIsInvoiceDetailDialogOpen] = useState(false)
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [selectedStudentForInvoice, setSelectedStudentForInvoice] = useState<any>(null)
  const [isCreateInvoiceFormOpen, setIsCreateInvoiceFormOpen] = useState(false)
  const [invoiceFormData, setInvoiceFormData] = useState<InvoiceFormData>({
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
              <span>RM {{amount}}</span>
            </div>
            {{/each}}
          </div>
          <div class="total">
            <h3>总计: RM {{totalAmount}}</h3>
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

  // Computed values
  const activeFees = feeItems.filter(fee => fee.status === 'active')
  const availableStudents = students.filter(student => student.grade !== '已毕业')

  const studentsWithAmounts = useMemo(() => {
    return availableStudents.map(student => ({
      ...student,
      amount: calculateStudentTotal(Number(student.id), activeFees)
    }))
  }, [availableStudents, calculateStudentTotal, activeFees])

  // Event handlers
  const handleDownloadInvoice = async (invoice: any) => {
    try {
      await downloadInvoicePDF(invoice, PDF_OPTIONS)
    } catch (error) {
      console.error('Failed to download invoice:', error)
    }
  }

  const handlePrintInvoice = async (invoice: any) => {
    try {
      await printInvoicePDF(invoice, PDF_OPTIONS)
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

    const template = selectedTemplate || availableTemplates.find(t => t.isDefault)
    
    if (!template) {
      console.error('No template available')
      return
    }

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

    const renderedHtml = renderInvoiceTemplate(template.htmlContent, templateData)

    const newInvoice = {
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
      totalAmount: selectedStudentForInvoice.amount,
      parentEmail: selectedStudentForInvoice.parentEmail || "parent@example.com",
      reminderSent: false,
      lastReminderDate: null
    }

    createInvoice(newInvoice)
    setIsCreateInvoiceFormOpen(false)
    setSelectedStudentForInvoice(null)
    setInvoiceFormData({ dueDate: '', notes: '', paymentMethod: 'bank_transfer' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">发票管理</h1>
          <p className="text-gray-600">管理学校发票和付款状态</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsTemplateManagerOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            模板管理
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsBulkInvoiceDialogOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            批量生成
          </Button>
          
          <Button onClick={() => setIsCreateInvoiceDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建发票
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">总发票数</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">已付款</p>
                <p className="text-2xl font-bold">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">待付款</p>
                <p className="text-2xl font-bold">
                  {invoices.filter(inv => inv.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">逾期</p>
                <p className="text-2xl font-bold">
                  {invoices.filter(inv => inv.status === 'overdue').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <InvoiceList
        invoices={invoices}
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
          setSelectedInvoice(invoice)
          // Handle edit logic here
        }}
        onDelete={(invoice) => {
          deleteInvoice(invoice.id)
        }}
        payments={payments}
      />

      {/* Dialogs */}
      <InvoiceCreateDialog
        isOpen={isCreateInvoiceDialogOpen}
        onOpenChange={setIsCreateInvoiceDialogOpen}
        students={studentsWithAmounts}
        onCreateInvoice={handleCreateInvoiceForStudent}
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
        students={studentsWithAmounts}
        onBulkCreate={(selectedGrades, dueDate) => {
          // Handle bulk invoice creation
          console.log('Bulk create invoices for grades:', selectedGrades, 'due date:', dueDate)
        }}
      />

      {/* Template Manager */}
      {isTemplateManagerOpen && (
        <Dialog open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>发票模板管理</DialogTitle>
              <DialogDescription>管理发票模板和样式</DialogDescription>
            </DialogHeader>
            <InvoiceTemplateManager />
          </DialogContent>
        </Dialog>
      )}

      {/* Create Invoice Form */}
      <Dialog open={isCreateInvoiceFormOpen} onOpenChange={setIsCreateInvoiceFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建发票 - {selectedStudentForInvoice?.name}</DialogTitle>
            <DialogDescription>为学生创建新的发票</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">到期日期</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceFormData.dueDate}
                  onChange={(e) => setInvoiceFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">付款方式</Label>
                <Select
                  value={invoiceFormData.paymentMethod}
                  onValueChange={(value) => setInvoiceFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">银行转账</SelectItem>
                    <SelectItem value="cash">现金</SelectItem>
                    <SelectItem value="check">支票</SelectItem>
                    <SelectItem value="online">在线支付</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={invoiceFormData.notes}
                onChange={(e) => setInvoiceFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="输入发票备注信息..."
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">发票信息</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">学生:</span> {selectedStudentForInvoice?.name}</div>
                <div><span className="font-medium">年级:</span> {selectedStudentForInvoice?.grade}</div>
                <div><span className="font-medium">金额:</span> RM {selectedStudentForInvoice?.amount}</div>
                <div><span className="font-medium">发票号:</span> {generateInvoiceNumber()}</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateInvoiceFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitInvoice}>
              创建发票
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 