"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
import { FileText, Download, Printer, Send, CheckCircle, AlertCircle, Eye, Link, Receipt, Trash2, XCircle, Loader2, CheckSquare, Settings, ChevronDown, ChevronUp, Maximize2 } from "lucide-react"
import { useReceipts } from "@/hooks/useReceipts"
import { useInvoices } from "@/hooks/useInvoices"
import { useStudents } from "@/hooks/useStudents"
import { usePayments } from "@/hooks/usePayments"
import { downloadReceiptPDF, generateReceiptPDF, generateReceiptHTML } from "@/lib/pdf-generator"
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
  const [expandedReceiptIds, setExpandedReceiptIds] = useState<Set<string>>(new Set())

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
  const [centerPresetMap, setCenterPresetMap] = useState<Record<string, string>>({})
  const [allReceiptPresets, setAllReceiptPresets] = useState<ReceiptSettingsPreset[]>([])

  // Load school settings for PDF header
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [res, cpRes, allRes] = await Promise.all([
          fetch('/api/pocketbase-proxy/api/collections/receipt_settings/records?perPage=1&sort=-created'),
          fetch('/api/center-presets'),
          fetch('/api/pocketbase-proxy/api/collections/receipt_settings/records?perPage=50&sort=-created'),
        ])
        if (res.ok) {
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
        }
        if (cpRes.ok) {
          const cpData = await cpRes.json()
          const map: Record<string, string> = {}
          for (const [cid, p] of Object.entries(cpData.data || {})) {
            if ((p as any).receipt_settings_id) map[cid] = (p as any).receipt_settings_id
          }
          setCenterPresetMap(map)
        }
        if (allRes.ok) {
          const allData = await allRes.json()
          const presets = (allData.items || []).map((s: any) => ({
            id: s.id, name: s.name || '未命名', schoolName: s.schoolName || '',
            schoolNameEn: s.schoolNameEn || '', schoolLogo: s.schoolLogo || '',
            schoolAddress: s.schoolAddress || '', schoolPhone: s.schoolPhone || '',
            schoolEmail: s.schoolEmail || '', primaryColor: s.primaryColor || '#1e40af',
            secondaryColor: s.secondaryColor || '#3b82f6', accentColor: s.accentColor || '#f59e0b',
            footerText: s.footerText || '', receiptNote: s.receiptNote || '',
            isDefault: true, createdAt: s.created || '', updatedAt: s.updated || '',
          }))
          setAllReceiptPresets(presets)
        }
      } catch { /* use defaults */ }
    }
    loadSettings()
  }, [])

  // Get receipt preset based on student's center
  const getReceiptPresetForReceipt = (receipt: any): ReceiptSettingsPreset => {
    const student = students.find((s: any) => s.id === receipt.studentId)
    const centerId = student?.center || ''
    if (centerId && centerPresetMap[centerId]) {
      const preset = allReceiptPresets.find(p => p.id === centerPresetMap[centerId])
      if (preset) return preset
    }
    return pdfSettings
  }

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
    if (!payment) return paymentId
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
      await downloadReceiptPDF(receipt, getReceiptPresetForReceipt(receipt), studentName)
    } catch (error) {
      console.error('Failed to download receipt PDF:', error)
    }
  }

  const handlePrintReceipt = (receipt: any) => {
    const studentName = getStudentName(receipt.studentId)
    const preset = getReceiptPresetForReceipt(receipt)
    const html = generateReceiptHTML(receipt, preset, studentName)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 300)
  }

  const handleSendReceipt = async (receipt: any) => {
    const studentName = getStudentName(receipt.studentId)
    const student = students.find(s => s.id === receipt.studentId)
    const phone = student?.mother_phone || student?.father_phone || student?.emergencyContact || student?.parentPhone || ''
    const formattedPhone = phone ? phone.replace(/\s+/g, '').replace(/^0/, '60').replace(/^\+/, '') : ''
    
    if (!formattedPhone) {
      alert('该学生没有家长电话号码，请先在student management 填上家长电话。')
      return
    }

    try {
      // 只发 PDF，不带字段文本（发票内容已在 PDF 里）
      const pdfBlob = await generateReceiptPDF(receipt, getReceiptPresetForReceipt(receipt), studentName)
      const pdfFile = new File([pdfBlob], `Receipt_${receipt.receiptNumber}.pdf`, { type: 'application/pdf' })

      // 2. Try Web Share API (mobile — can share PDF directly)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `收据 ${receipt.receiptNumber}`,
          })
          return
        } catch {
          // user cancelled share — fall through
        }
      }

      // 3. Fallback: download PDF + open WhatsApp
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Receipt_${receipt.receiptNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)

      const encodedMessage = encodeURIComponent('📎 请贴上刚下载的收据PDF文件')
      window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank')
    } catch (error) {
      console.error('Failed to send receipt:', error)
      const msg = encodeURIComponent('📎 请贴上刚下载的收据PDF文件')
      window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedReceiptIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

      

      {/* Receipt Documents View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('finance.receipt_list')}</CardTitle>
            <CardDescription>
              收据单据预览，点击展开查看完整收据
            </CardDescription>
          </div>
          {allReceiptIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAllReceipts}
                aria-label="全选"
              />
              <span className="text-sm text-gray-500">
                {someSelected ? `已选 ${selectedReceiptIds.size}/${allReceiptIds.length}` : '全选'}
              </span>
            </div>
          )}
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
                <div className="flex items-center justify-between mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
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

              {/* ── Receipt Document Cards ── */}
              <div className="space-y-4">
                {filteredReceipts.map((receipt) => {
                  const isExpanded = expandedReceiptIds.has(receipt.id)
                  const isSelected = selectedReceiptIds.has(receipt.id)
                  const preset = getReceiptPresetForReceipt(receipt)
                  const studentName = getStudentName(receipt.studentId)
                  const receiptHTML = generateReceiptHTML(receipt, preset, studentName)

                  return (
                    <div
                      key={receipt.id}
                      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-red-400 border-red-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* ── Receipt Card Header ── */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer select-none"
                        onClick={() => toggleExpand(receipt.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectReceipt(receipt.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 flex items-center gap-4 min-w-0">
                          <Receipt className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0 flex items-center gap-4">
                            <span className="font-mono font-semibold text-sm truncate">
                              {receipt.receiptNumber}
                            </span>
                            <Link className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {getInvoiceNumber(receipt.paymentId)}
                            </span>
                          </div>
                          <span className="text-sm font-medium min-w-[60px]">
                            {getStudentName(receipt.studentId)}
                          </span>
                          <span className="text-sm font-semibold text-blue-700 min-w-[80px] text-right">
                            RM {receipt.totalAmount?.toLocaleString() || '0.00'}
                          </span>
                          <span className="text-xs text-gray-400 min-w-[80px] text-right">
                            {formatDate(receipt.receipt_date)}
                          </span>
                          <span className="min-w-[70px] flex justify-center">
                            {getReceiptStatusBadge(receipt.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleViewReceipt(receipt) }}
                            title="全屏查看"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(receipt) }}
                            title="下载PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handlePrintReceipt(receipt) }}
                            title="打印"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleSendReceipt(receipt) }}
                            title="发送"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <div className="ml-1">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Receipt Document Preview (expanded) ── */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-white">
                          {/* Receipt paper effect wrapper */}
                          <div className="p-3 flex justify-center bg-gray-100/50">
                            <div className="bg-white shadow-lg rounded-sm"
                              style={{
                                width: '100%',
                                maxWidth: '700px',
                                boxShadow: '0 2px 15px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                              }}
                            >
                              <iframe
                                srcDoc={receiptHTML}
                                className="w-full border-0"
                                style={{ height: '65vh', minHeight: '400px' }}
                                title={`收据 ${receipt.receiptNumber}`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Receipt Detail Dialog (full screen) */}
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
                  srcDoc={generateReceiptHTML(selectedReceipt, getReceiptPresetForReceipt(selectedReceipt), getStudentName(selectedReceipt.studentId))}
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
