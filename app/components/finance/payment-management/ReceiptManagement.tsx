"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { FileText, Download, Printer, Send, CheckCircle, AlertCircle, Eye, Link, Receipt, Trash2, XCircle, Loader2, CheckSquare, Settings } from "lucide-react"
import { useReceipts } from "@/hooks/useReceipts"
import { useInvoices } from "@/hooks/useInvoices"
import { useStudents } from "@/hooks/useStudents"
import { usePayments } from "@/hooks/usePayments"
import { downloadReceiptPDF, generateReceiptHTML } from "@/lib/pdf-generator"
import ReceiptSettingsManager, { type ReceiptSettingsPreset } from "@/app/components/finance/payment-management/ReceiptSettingsManager"



// Utility functions
const getReceiptStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: "outline" | "default" | "secondary" | "destructive"; text: string }> = {
    draft: { variant: "outline" as const, text: "草稿" },
    pending: { variant: "outline" as const, text: "待处理" },
    issued: { variant: "default" as const, text: "已开具" },
    sent: { variant: "secondary" as const, text: "已发送" },
    cancelled: { variant: "destructive" as const, text: "已取消" }
  }
  
  const statusInfo = statusMap[status] || { variant: "outline" as const, text: status }
  return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
  } catch {
    return dateStr
  }
}

export default function ReceiptManagement() {
  const { t } = useLanguage()
  const {
    receipts,
    filters: receiptFilters,
    setFilters: setReceiptFilters,
    getFilteredReceipts,
    getReceiptStatistics,
    deleteReceipt,
  } = useReceipts()

  const {
    invoices
  } = useInvoices()

  const {
    payments
  } = usePayments()

  const { students } = useStudents()

  // State
  const [isReceiptDetailDialogOpen, setIsReceiptDetailDialogOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)

  // PDF settings for receipt generation
  const [pdfSettings, setPdfSettings] = useState<ReceiptSettingsPreset>({
    id: "default", name: "默认设置", schoolName: "智慧教育学校", schoolNameEn: "",
    schoolLogo: "", schoolAddress: "", schoolPhone: "", schoolEmail: "",
    primaryColor: "#1e40af", secondaryColor: "#3b82f6", accentColor: "#f59e0b",
    footerText: "", receiptNote: "",
    isDefault: true, createdAt: "", updatedAt: ""
  })

  // Settings dialog state
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [activePresetId, setActivePresetId] = useState<string>()

  // Load school settings for PDF header
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/pocketbase-proxy/api/collections/receipt_settings/records?perPage=1&sort=-created')
        if (!res.ok) return
        const data = await res.json()
        const items = data.items || []
        if (items.length > 0) {
          const s = items[0]
          setPdfSettings(prev => ({
            ...prev,
            schoolLogo: s.schoolLogo || '',
            schoolName: s.schoolName || '智慧教育学校',
            schoolNameEn: s.schoolNameEn || '',
            schoolAddress: s.schoolAddress || '',
            schoolPhone: s.schoolPhone || '',
            schoolEmail: s.schoolEmail || '',
            primaryColor: s.primaryColor || '#1e40af',
            secondaryColor: s.secondaryColor || '#3b82f6',
            accentColor: s.accentColor || '#f59e0b',
            footerText: s.footerText || '',
            receiptNote: s.receiptNote || '',
          }))
        }
      } catch { /* use defaults */ }
    }
    loadSettings()
  }, [])

  // ── Batch delete state ──
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<Set<string>>(new Set())
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

  // Get filtered receipts
  const filteredReceipts = getFilteredReceipts()
  const receiptStats = getReceiptStatistics()

  // ── Batch delete computed values & handlers ──
  const allReceiptIds = filteredReceipts.map(r => r.id)
  const allSelected = allReceiptIds.length > 0 && selectedReceiptIds.size === allReceiptIds.length
  const someSelected = selectedReceiptIds.size > 0

  const toggleSelectAllReceipts = () => {
    if (allSelected) {
      setSelectedReceiptIds(new Set())
    } else {
      setSelectedReceiptIds(new Set(allReceiptIds))
    }
  }

  const toggleSelectReceipt = (id: string) => {
    setSelectedReceiptIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBatchDeleteReceipts = async () => {
    setIsBatchDeleting(true)
    const ids = [...selectedReceiptIds]
    for (const id of ids) {
      try {
        await deleteReceipt(id)
      } catch {
        // continue on error for remaining items
      }
    }
    setIsBatchDeleting(false)
    setIsBatchDeleteOpen(false)
    setSelectedReceiptIds(new Set())
  }

  // Helper: look up student name by studentId
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.student_name || studentId
  }

  // Helper: resolve actual invoice number from receipt.paymentId
  const getInvoiceNumber = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return paymentId // fallback to paymentId if payment not found
    const invoice = invoices.find(inv => inv.id === payment.invoiceId)
    return invoice?.invoiceNumber || paymentId
  }

  const handleViewReceipt = (receipt: any) => {
    setSelectedReceipt(receipt)
    setIsReceiptDetailDialogOpen(true)
  }

  const handleDownloadReceipt = async (receipt: any) => {
    try {
      const studentName = getStudentName(receipt.studentId)
      await downloadReceiptPDF(receipt, pdfSettings, studentName)
    } catch (error) {
      console.error('Failed to download receipt PDF:', error)
    }
  }

  const handlePrintReceipt = (receipt: any) => {
    const studentName = getStudentName(receipt.studentId)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>收据 - ${receipt.receiptNumber}</title>
        <style>
          body { font-family: 'SimSun', 'Microsoft YaHei', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; font-size: 24px; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #ddd; padding-bottom: 8px; }
          .info-label { color: #555; font-weight: bold; min-width: 120px; }
          .info-value { flex: 1; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
          th { background: #f5f5f5; }
          .total-row { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; }
          .footer { text-align: center; color: #999; margin-top: 40px; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; background: #e8f5e9; color: #2e7d32; }
          .no-print { margin-bottom: 20px; }
          .no-print button { padding: 8px 20px; cursor: pointer; background: #1976d2; color: white; border: none; border-radius: 4px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()">打印此收据</button>
        </div>
        <h1>收 据</h1>
        <div class="subtitle">RECEIPT</div>
        <div class="info-row">
          <span class="info-label">收据号码</span>
          <span class="info-value">${receipt.receiptNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{t('teacher.status')}</span>
          <span class="info-value"><span class="status-badge">${receipt.status === 'issued' ? '已开具' : receipt.status}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">{t('student.student_name')}</span>
          <span class="info-value">${studentName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">付款ID</span>
          <span class="info-value">${receipt.paymentId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">付款日期</span>
          <span class="info-value">${formatDate(receipt.receipt_date)}</span>
        </div>
        <table>
          <tr><th>项目</th><th>{t('finance.amount')}</th></tr>
          <tr><td>学费付款</td><td>RM ${receipt.totalAmount?.toLocaleString() || '0.00'}</td></tr>
        </table>
        <div class="total-row">合计: RM ${receipt.totalAmount?.toLocaleString() || '0.00'}</div>
        ${receipt.notes ? `<p style="margin-top:15px;color:#666;">备注: ${receipt.notes}</p>` : ''}
        <div class="footer">此收据由 PJPC 系统自动生成</div>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleSendReceipt = (receipt: any) => {
    const studentName = getStudentName(receipt.studentId)
    const message = encodeURIComponent(
      `PJPC 收据通知\n\n` +
      `收据号码: ${receipt.receiptNumber}\n` +
      `学生: ${studentName}\n` +
      `金额: RM ${receipt.totalAmount?.toLocaleString() || '0.00'}\n` +
      `日期: ${formatDate(receipt.receipt_date)}\n` +
      `状态: ${receipt.status === 'issued' ? '已开具' : receipt.status}\n\n` +
      `感谢您的付款！`
    )
    // Try WhatsApp first, fall back to email
    const whatsappUrl = `https://wa.me/?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="space-y-6">
             {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">{t('finance.receipt_management')}</h3>
          <p className="text-gray-600">自动生成的学生缴费收据和凭证</p>
          <p className="text-sm text-green-600 mt-1">
            💡 收据会在缴费状态更改为&quot;已缴费&quot;且发票全额付款时自动生成
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总收据数</p>
                <p className="text-2xl font-bold text-green-600">{receiptStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已开具</p>
                <p className="text-2xl font-bold text-blue-600">{receiptStats.issued}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('common.pending')}</p>
                <p className="text-2xl font-bold text-orange-600">{receiptStats.draft}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总金额</p>
                <p className="text-2xl font-bold text-purple-600">RM {receiptStats.totalAmount.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>筛选收据</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">{t('teacher.status')}</Label>
                             <Select 
                 value={receiptFilters.status || "all"} 
                 onValueChange={(value) => setReceiptFilters(prev => ({ ...prev, status: value }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="选择状态" />
                 </SelectTrigger>
                                 <SelectContent>
                   <SelectItem value="all">{t('card.all')}</SelectItem>
                   <SelectItem value="pending">{t('common.pending')}</SelectItem>
                   <SelectItem value="issued">已开具</SelectItem>
                   <SelectItem value="sent">{t('finance.sent')}</SelectItem>
                   <SelectItem value="cancelled">{t('teacher.cancelled')}</SelectItem>
                 </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="student-filter">{t('student.student_name')}</Label>
              <Input
                id="student-filter"
                placeholder="搜索学生姓名..."
                value={receiptFilters.studentName || ''}
                onChange={(e) => setReceiptFilters(prev => ({ ...prev, studentName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="invoice-filter">收据号码</Label>
              <Input
                id="invoice-filter"
                placeholder="搜索收据号码..."
                value={receiptFilters.receiptNumber || ''}
                onChange={(e) => setReceiptFilters(prev => ({ ...prev, receiptNumber: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      

      {/* Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.receipt_list')}</CardTitle>
          <CardDescription>
           自动生成的收据列表，包含发票链接信息
         </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Receipt className="h-16 w-16 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">暂无收据记录</p>
              <p className="text-sm text-gray-400">完成付款后收据会自动生成</p>
            </div>
          ) : (
            <>
              {/* ── Batch action bar ── */}
              {someSelected && (
                <div className="flex items-center justify-between mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm text-red-700 font-medium">
                    已选择 <span className="font-bold">{selectedReceiptIds.size}</span> 张收据
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReceiptIds(new Set())}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      取消选择
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsBatchDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      删除选中 ({selectedReceiptIds.size})
                    </Button>
                  </div>
                </div>
              )}

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAllReceipts}
                          aria-label={t('teacher.select_all')}
                        />
                      </TableHead>
                      <TableHead>收据号码</TableHead>
                      <TableHead>发票号码</TableHead>
                      <TableHead>{t('student.student_name')}</TableHead>
                      <TableHead>{t('finance.amount')}</TableHead>
                      <TableHead>付款日期</TableHead>
                      <TableHead>{t('teacher.status')}</TableHead>
                      <TableHead>{t('teacher.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id} className={selectedReceiptIds.has(receipt.id) ? "bg-red-50/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedReceiptIds.has(receipt.id)}
                          onCheckedChange={() => toggleSelectReceipt(receipt.id)}
                          aria-label={`选择 ${receipt.receiptNumber}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Link className="h-3 w-3 text-blue-600" />
                        {getInvoiceNumber(receipt.paymentId)}
                      </TableCell>
                      <TableCell>{getStudentName(receipt.studentId)}</TableCell>
                      <TableCell>RM {receipt.totalAmount?.toLocaleString() || '0.00'}</TableCell>
                      <TableCell>{formatDate(receipt.receipt_date)}</TableCell>
                      <TableCell>{getReceiptStatusBadge(receipt.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewReceipt(receipt)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(receipt)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handlePrintReceipt(receipt)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSendReceipt(receipt)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      

      {/* Receipt Detail Dialog */}
      <Dialog open={isReceiptDetailDialogOpen} onOpenChange={setIsReceiptDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              收据详情 - {selectedReceipt?.receiptNumber}
            </DialogTitle>
            <DialogDescription>查看收据的详细信息</DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-4">
              {/* PDF Preview iframe */}
              <div className="w-full border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={generateReceiptHTML(selectedReceipt, pdfSettings, getStudentName(selectedReceipt.studentId))}
                  className="w-full border-0"
                  style={{ height: '70vh', minHeight: '500px' }}
                  title="收据预览"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadReceipt(selectedReceipt)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePrintReceipt(selectedReceipt)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  打印
                </Button>
                <Button onClick={() => setIsReceiptDetailDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              批量删除收据
            </DialogTitle>
            <DialogDescription />
            <div className="space-y-2 mt-2">
              <p className="text-sm">
                确定要删除选中的 <span className="font-bold text-red-600">{selectedReceiptIds.size}</span> 张收据吗？
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-40 overflow-y-auto">
                <ul className="text-xs space-y-0.5">
                  {[...selectedReceiptIds].map(id => {
                    const rec = filteredReceipts.find(r => r.id === id)
                    return rec ? (
                      <li key={id} className="text-red-700">
                        • {rec.receiptNumber} — {getStudentName(rec.studentId)} (RM {rec.totalAmount?.toLocaleString()})
                      </li>
                    ) : null
                  })}
                </ul>
              </div>
              <p className="text-xs text-red-500 mt-2">⚠️ 此操作不可撤销！</p>
            </div>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsBatchDeleteOpen(false)}
              disabled={isBatchDeleting}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBatchDeleteReceipts}
              disabled={isBatchDeleting}
            >
              {isBatchDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除 {selectedReceiptIds.size} 张收据
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>收据 PDF 设置</DialogTitle>
            <DialogDescription>
              自定义收据 PDF 的学校信息、品牌样式和内容
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[80vh] -mx-6 px-6">
            <ReceiptSettingsManager
              onSettingsChange={(settings) => {
                setPdfSettings(settings)
                setActivePresetId(settings.id)
              }}
              activePresetId={activePresetId}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
