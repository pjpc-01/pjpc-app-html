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
import { FileText, Plus, Download, Printer, Send, CheckCircle, AlertCircle, Eye, Edit, Settings, Loader2 } from "lucide-react"
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
import { InvoiceList } from "./InvoiceList"
import InvoiceTemplateManager from "./InvoiceTemplateManager"
import { getStatusBadge } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect } from "react"

// Types
interface InvoiceFormData {
  dueDate: string
  notes: string
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
  const { fees } = useFees()
  const { createReceipt } = useReceipts()
  const { payments } = usePayments()

  // State
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false)

  const [isInvoiceDetailDialogOpen, setIsInvoiceDetailDialogOpen] = useState(false)
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'invoice-template' | 'message-formats'>('invoice-template')
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [selectedStudentForInvoice, setSelectedStudentForInvoice] = useState<any>(null)
  const [isCreateInvoiceFormOpen, setIsCreateInvoiceFormOpen] = useState(false)
  const [isSendMessageDialogOpen, setIsSendMessageDialogOpen] = useState(false)
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'email'>('whatsapp')
  const [messageContent, setMessageContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [invoiceFormData, setInvoiceFormData] = useState<InvoiceFormData>({
    dueDate: '',
    notes: ''
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

  // Message format templates
  const [messageFormats, setMessageFormats] = useState({
    whatsapp: {
      subject: "发票通知",
      template: `您好！这是来自智慧教育学校的发票通知。

发票号码: {{invoiceNumber}}
学生姓名: {{studentName}}
金额: RM {{totalAmount}}
到期日期: {{dueDate}}

{{customMessage}}

谢谢！
智慧教育学校`,
      variables: ["invoiceNumber", "studentName", "totalAmount", "dueDate", "customMessage"]
    },
    email: {
      subject: "发票通知 - {{invoiceNumber}}",
      template: `尊敬的家长：

您好！这是来自智慧教育学校的发票通知。

发票详情：
- 发票号码: {{invoiceNumber}}
- 学生姓名: {{studentName}}
- 年级: {{studentGrade}}
- 金额: RM {{totalAmount}}
- 开具日期: {{issueDate}}
- 到期日期: {{dueDate}}

费用明细：
{{#each items}}
- {{name}}: RM {{amount}}
{{/each}}

{{#if tax}}
税费: RM {{tax}}
{{/if}}
{{#if discount}}
折扣: RM {{discount}}
{{/if}}
总计: RM {{totalAmount}}

{{customMessage}}

付款方式：
- 银行转账
- 现金
- 支票
- 在线支付

如有任何问题，请随时联系我们。

谢谢！
智慧教育学校
电话: 010-12345678
邮箱: info@smarteducation.com`,
      variables: ["invoiceNumber", "studentName", "studentGrade", "totalAmount", "issueDate", "dueDate", "items", "tax", "discount", "customMessage"]
    }
  })

  // Computed values
  const activeFees = fees.filter(fee => fee.status === 'active')
  const availableStudents = students.filter(student => student.status !== 'graduated')

  const studentsWithAmounts = useMemo(() => {
    return availableStudents.map(student => ({
      ...student,
      amount: calculateStudentTotal(student.id, activeFees)
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
    setSelectedInvoice(invoice)
    setIsSendMessageDialogOpen(true)
  }

  const handleSendWhatsApp = async (invoice: any) => {
    try {
      setIsSending(true)
      
      // Get student phone number from the invoice or student data
      const student = students.find(s => s.id === invoice.studentId)
      const phoneNumber = student?.parentEmail || ''
      
      if (!phoneNumber) {
        throw new Error('无法找到学生或家长的电话号码')
      }

      // Format phone number for WhatsApp (remove spaces, add country code if needed)
      const formattedPhone = phoneNumber.replace(/\s+/g, '').replace(/^0/, '60')
      
      // Create WhatsApp message using template
      const templateData = {
        invoiceNumber: invoice.invoiceNumber,
        studentName: invoice.student,
        totalAmount: invoice.totalAmount?.toLocaleString(),
        dueDate: new Date(invoice.dueDate).toLocaleDateString('zh-CN'),
        customMessage: messageContent || '请及时处理付款，如有疑问请联系我们。'
      }
      
      const message = messageFormats.whatsapp.template
        .replace(/\{\{invoiceNumber\}\}/g, templateData.invoiceNumber)
        .replace(/\{\{studentName\}\}/g, templateData.studentName)
        .replace(/\{\{totalAmount\}\}/g, templateData.totalAmount)
        .replace(/\{\{dueDate\}\}/g, templateData.dueDate)
        .replace(/\{\{customMessage\}\}/g, templateData.customMessage)

      // Generate PDF for attachment
      await downloadInvoicePDF(invoice, PDF_OPTIONS)
      
      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message)
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank')
      
      // Update invoice status
      updateInvoiceStatus(invoice.id, 'issued')
      
      // Close dialog
      setIsSendMessageDialogOpen(false)
      setMessageContent('')
      
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      alert('发送WhatsApp消息失败: ' + (error as Error).message)
    } finally {
      setIsSending(false)
    }
  }

  const handleSendEmail = async (invoice: any) => {
    try {
      setIsSending(true)
      
      // Get student email from the invoice or student data
      const student = students.find(s => s.id === invoice.studentId)
      const email = student?.parentEmail || ''
      
      if (!email) {
        throw new Error('无法找到学生或家长的邮箱地址')
      }

      // Create email using template
      const templateData = {
        invoiceNumber: invoice.invoiceNumber,
        studentName: invoice.student,
        studentGrade: invoice.grade || '未指定',
        totalAmount: invoice.totalAmount?.toLocaleString(),
        issueDate: new Date(invoice.issueDate).toLocaleDateString('zh-CN'),
        dueDate: new Date(invoice.dueDate).toLocaleDateString('zh-CN'),
        items: invoice.items && invoice.items.length > 0 
          ? invoice.items.map((item: any) => `- ${item.name}: RM ${item.amount?.toLocaleString()}`).join('\n')
          : `- 学生费用: RM ${invoice.amount?.toLocaleString()}`,
        tax: invoice.tax && invoice.tax > 0 ? `税费: RM ${invoice.tax.toLocaleString()}` : '',
        discount: invoice.discount && invoice.discount > 0 ? `折扣: RM ${invoice.discount.toLocaleString()}` : '',
        customMessage: messageContent || '请及时处理付款，如有疑问请联系我们。'
      }
      
      const subject = messageFormats.email.subject
        .replace(/\{\{invoiceNumber\}\}/g, templateData.invoiceNumber)
      
      const body = messageFormats.email.template
        .replace(/\{\{invoiceNumber\}\}/g, templateData.invoiceNumber)
        .replace(/\{\{studentName\}\}/g, templateData.studentName)
        .replace(/\{\{studentGrade\}\}/g, templateData.studentGrade)
        .replace(/\{\{totalAmount\}\}/g, templateData.totalAmount)
        .replace(/\{\{issueDate\}\}/g, templateData.issueDate)
        .replace(/\{\{dueDate\}\}/g, templateData.dueDate)
        .replace(/\{\{items\}\}/g, templateData.items)
        .replace(/\{\{tax\}\}/g, templateData.tax)
        .replace(/\{\{discount\}\}/g, templateData.discount)
        .replace(/\{\{customMessage\}\}/g, templateData.customMessage)

      // Generate PDF for attachment
      await downloadInvoicePDF(invoice, PDF_OPTIONS)
      
      // Create mailto URL with attachment (note: mailto doesn't support attachments, but we can mention it)
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\n附件: 发票PDF文件')}`
      
      // Open default email client
      window.open(mailtoUrl, '_blank')
      
      // Update invoice status
      updateInvoiceStatus(invoice.id, 'issued')
      
      // Close dialog
      setIsSendMessageDialogOpen(false)
      setMessageContent('')
      
    } catch (error) {
      console.error('Failed to send email:', error)
      alert('发送邮件失败: ' + (error as Error).message)
    } finally {
      setIsSending(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedInvoice) return
    
    if (sendMethod === 'whatsapp') {
      await handleSendWhatsApp(selectedInvoice)
    } else {
      await handleSendEmail(selectedInvoice)
    }
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
      studentGrade: selectedStudentForInvoice.standard,
      parentName: selectedStudentForInvoice.parentName,
      items: [
        { name: "学生费用", amount: selectedStudentForInvoice.amount }
      ],
      totalAmount: selectedStudentForInvoice.amount,
      tax: 0,
      discount: 0,
             paymentMethod: 'bank_transfer', // Default payment method
       notes: invoiceFormData.notes
    }

    const renderedHtml = renderInvoiceTemplate(template.htmlContent, templateData)

         const newInvoice = {
       studentName: selectedStudentForInvoice.name,
       studentId: selectedStudentForInvoice.id,
       studentGrade: selectedStudentForInvoice.grade || selectedStudentForInvoice.standard,
       items: templateData.items,
       status: "issued" as const,
       issueDate: templateData.issueDate,
       dueDate: templateData.dueDate,
       notes: templateData.notes || '',
       totalAmount: selectedStudentForInvoice.amount
     }

    createInvoice(newInvoice)
    setIsCreateInvoiceFormOpen(false)
    setSelectedStudentForInvoice(null)
         setInvoiceFormData({ dueDate: '', notes: '' })
  }

  // Load saved message formats from localStorage on mount
  useEffect(() => {
    const savedMessageFormats = localStorage.getItem('invoiceMessageFormats')
    if (savedMessageFormats) {
      setMessageFormats(JSON.parse(savedMessageFormats))
    }
  }, [])

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
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            设置
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
                  {invoices.filter(inv => inv.status === 'issued').length}
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
        onBulkCreate={(selectedGrades, formData) => {
          // Handle bulk invoice creation
          console.log('Bulk create invoices for grades:', selectedGrades, 'form data:', formData)
          // You can implement the actual bulk creation logic here
        }}
        invoiceFormData={invoiceFormData}
        setInvoiceFormData={setInvoiceFormData}
        availableTemplates={availableTemplates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        isTemplateSelectDialogOpen={isTemplateSelectDialogOpen}
        setIsTemplateSelectDialogOpen={setIsTemplateSelectDialogOpen}
      />



      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              发票设置
            </DialogTitle>
            <DialogDescription>管理发票模板和消息格式</DialogDescription>
          </DialogHeader>
          
          <Tabs value={settingsTab} onValueChange={(value) => setSettingsTab(value as 'invoice-template' | 'message-formats')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invoice-template">发票模板</TabsTrigger>
              <TabsTrigger value="message-formats">消息格式</TabsTrigger>
            </TabsList>
            
            <TabsContent value="invoice-template" className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">发票模板管理</h3>
                <InvoiceTemplateManager />
              </div>
            </TabsContent>
            
            <TabsContent value="message-formats" className="space-y-6">
              <div className="space-y-6">
                {/* WhatsApp Message Format */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="text-2xl">📱</div>
                      WhatsApp 消息格式
                    </CardTitle>
                    <CardDescription>自定义发送到WhatsApp的消息格式</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="whatsappSubject">消息主题</Label>
                      <Input
                        id="whatsappSubject"
                        value={messageFormats.whatsapp.subject}
                        onChange={(e) => setMessageFormats(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, subject: e.target.value }
                        }))}
                        placeholder="输入消息主题..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsappTemplate">消息模板</Label>
                      <Textarea
                        id="whatsappTemplate"
                        value={messageFormats.whatsapp.template}
                        onChange={(e) => setMessageFormats(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, template: e.target.value }
                        }))}
                        placeholder="输入消息模板..."
                        rows={12}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        可用变量: {'{{invoiceNumber}}'}, {'{{studentName}}'}, {'{{totalAmount}}'}, {'{{dueDate}}'}, {'{{customMessage}}'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Message Format */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="text-2xl">📧</div>
                      电子邮件格式
                    </CardTitle>
                    <CardDescription>自定义发送到电子邮件的消息格式</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="emailSubject">邮件主题</Label>
                      <Input
                        id="emailSubject"
                        value={messageFormats.email.subject}
                        onChange={(e) => setMessageFormats(prev => ({
                          ...prev,
                          email: { ...prev.email, subject: e.target.value }
                        }))}
                        placeholder="输入邮件主题..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailTemplate">邮件模板</Label>
                      <Textarea
                        id="emailTemplate"
                        value={messageFormats.email.template}
                        onChange={(e) => setMessageFormats(prev => ({
                          ...prev,
                          email: { ...prev.email, template: e.target.value }
                        }))}
                        placeholder="输入邮件模板..."
                        rows={16}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        可用变量: {'{{invoiceNumber}}'}, {'{{studentName}}'}, {'{{studentGrade}}'}, {'{{totalAmount}}'}, {'{{issueDate}}'}, {'{{dueDate}}'}, {'{{items}}'}, {'{{tax}}'}, {'{{discount}}'}, {'{{customMessage}}'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={() => {
                    // Save message formats to localStorage or backend
                    localStorage.setItem('invoiceMessageFormats', JSON.stringify(messageFormats))
                    alert('消息格式已保存！')
                  }}>
                    保存设置
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Form */}
      <Dialog open={isCreateInvoiceFormOpen} onOpenChange={setIsCreateInvoiceFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建发票 - {selectedStudentForInvoice?.name}</DialogTitle>
            <DialogDescription>为学生创建新的发票</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
                <div><span className="font-medium">年级:</span> {selectedStudentForInvoice?.standard}</div>
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

      {/* Invoice Details Dialog */}
      <Dialog open={isInvoiceDetailDialogOpen} onOpenChange={setIsInvoiceDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              发票详情 - {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>查看发票的详细信息</DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">发票号码</p>
                    <p className="font-semibold text-lg">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">状态</p>
                    <div className="mt-1">{getInvoiceStatusBadge(selectedInvoice.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">开具日期</p>
                    <p className="font-semibold">{new Date(selectedInvoice.issueDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">到期日期</p>
                    <p className="font-semibold">{new Date(selectedInvoice.dueDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">学生信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">学生姓名</p>
                      <p className="font-semibold">{selectedInvoice.student}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">学生ID</p>
                      <p className="font-semibold">{selectedInvoice.studentId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">年级</p>
                      <p className="font-semibold">{selectedInvoice.grade || '未指定'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">家长邮箱</p>
                      <p className="font-semibold">{selectedInvoice.parentEmail || '未提供'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">费用明细</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items && selectedInvoice.items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right font-semibold">
                              RM {item.amount?.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!selectedInvoice.items || selectedInvoice.items.length === 0) && (
                          <TableRow>
                            <TableCell>学生费用</TableCell>
                            <TableCell className="text-right font-semibold">
                              RM {selectedInvoice.amount?.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Totals */}
                  <div className="mt-4 space-y-2">
                    {selectedInvoice.tax !== null && selectedInvoice.tax !== undefined && Number(selectedInvoice.tax) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>税费:</span>
                        <span>RM {selectedInvoice.tax.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.discount !== null && selectedInvoice.discount !== undefined && Number(selectedInvoice.discount) > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>折扣:</span>
                        <span>-RM {selectedInvoice.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>总计:</span>
                      <span className="text-green-600">RM {selectedInvoice.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

                             {/* Payment Information */}
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg">付款信息</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <p className="text-sm text-gray-600">付款日期</p>
                       <p className="font-semibold">
                         {selectedInvoice.paidDate 
                           ? new Date(selectedInvoice.paidDate).toLocaleDateString('zh-CN')
                           : '未付款'
                         }
                       </p>
                     </div>
                     <div>
                       <p className="text-sm text-gray-600">提醒发送</p>
                       <p className="font-semibold">
                         {selectedInvoice.reminderSent ? '已发送' : '未发送'}
                       </p>
                     </div>
                     <div>
                       <p className="text-sm text-gray-600">最后提醒日期</p>
                       <p className="font-semibold">
                         {selectedInvoice.lastReminderDate 
                           ? new Date(selectedInvoice.lastReminderDate).toLocaleDateString('zh-CN')
                           : '无'
                         }
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>

              {/* Notes */}
              {selectedInvoice.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">备注</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  打印
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSendInvoice(selectedInvoice)}
                  disabled={selectedInvoice.status === 'sent'}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {selectedInvoice.status === 'sent' ? '已发送' : '发送'}
                </Button>
                <Button onClick={() => setIsInvoiceDetailDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={isSendMessageDialogOpen} onOpenChange={setIsSendMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              发送发票通知
            </DialogTitle>
            <DialogDescription>
              选择发送方式发送发票给 {selectedInvoice?.student} 的家长
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Send Method Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">选择发送方式</Label>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Card 
                      className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                        sendMethod === 'whatsapp' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setSendMethod('whatsapp')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">📱</div>
                        <p className="font-semibold text-lg">WhatsApp</p>
                        <p className="text-sm text-gray-600 mt-1">发送到手机</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                        sendMethod === 'email' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSendMethod('email')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">📧</div>
                        <p className="font-semibold text-lg">电子邮件</p>
                        <p className="text-sm text-gray-600 mt-1">发送到邮箱</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">联系信息</h3>
                  {sendMethod === 'whatsapp' ? (
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">电话号码:</span> 
                        {(() => {
                          const student = students.find(s => s.id === selectedInvoice.studentId)
                          const phoneNumber = student?.parentName || '未提供'
                          return ` ${phoneNumber}`
                        })()}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">邮箱地址:</span> 
                        {(() => {
                          const student = students.find(s => s.id === selectedInvoice.studentId)
                          const email = student?.parentEmail || '未提供'
                          return ` ${email}`
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsSendMessageDialogOpen(false)
                    setMessageContent('')
                  }}
                  disabled={isSending}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      发送 {sendMethod === 'whatsapp' ? 'WhatsApp' : '邮件'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 