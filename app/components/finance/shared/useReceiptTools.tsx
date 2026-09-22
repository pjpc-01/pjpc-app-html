"use client"

/**
 * 收据工具 —— 共享模块（付款页内嵌收据用）
 *
 * 背景：收据是「记录付款」时自动生成的产物，payments ↔ receipts 是 1:1
 * （receipts.paymentId 指向 payments.id）。所以收据不再单独一页，
 * 而是作为付款列表的一列 + 弹窗呈现。
 *
 * 本模块从原 ReceiptManagement 抽出：PDF 预设、打印/下载/发送、详情弹窗、
 * 收据设置、回收站。付款页与（暂时保留的）旧收据页共用同一套逻辑。
 */

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { FileText, CheckCircle, AlertCircle, Download, Printer, Send, Eye, Receipt, Settings, Trash2, Loader2 } from "lucide-react"
import { downloadReceiptPDF, generateReceiptPDF, generateReceiptHTML } from "@/lib/pdf-generator"
import ReceiptSettingsManager, { type ReceiptSettingsPreset } from "@/app/components/finance/payment-management/ReceiptSettingsManager"

const PROXY = "/api/pocketbase-proxy/api/collections"

const DEFAULT_PRESET: ReceiptSettingsPreset = {
  id: "default", name: "默认设置", schoolName: "智慧教育学校", schoolNameEn: "",
  schoolLogo: "", schoolAddress: "", schoolPhone: "", schoolEmail: "",
  primaryColor: "#1e40af", secondaryColor: "#3b82f6", accentColor: "#f59e0b",
  footerText: "", receiptNote: "",
  isDefault: true, createdAt: "", updatedAt: "",
}

export interface ReceiptTools {
  getPresetFor: (receipt: any) => ReceiptSettingsPreset
  getStudentName: (studentId: string) => string
  getInvoiceNumber: (paymentId: string) => string
  viewReceipt: (receipt: any) => void
  download: (receipt: any) => Promise<void>
  print: (receipt: any) => void
  send: (receipt: any) => Promise<void>
  selectedReceipt: any
  detailOpen: boolean
  setDetailOpen: (v: boolean) => void
}

/**
 * 收据工具 hook。students / payments / invoices 由调用方传入（页面已加载，不重复请求）。
 */
export function useReceiptTools({ students, payments, invoices }: {
  students: any[]; payments: any[]; invoices: any[]
}): ReceiptTools {
  const [pdfSettings, setPdfSettings] = useState<ReceiptSettingsPreset>(DEFAULT_PRESET)
  const [centerPresetMap, setCenterPresetMap] = useState<Record<string, string>>({})
  const [allPresets, setAllPresets] = useState<ReceiptSettingsPreset[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // 载入收据 PDF 设置（含各中心专属预设）
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [res, cpRes, allRes] = await Promise.all([
          fetch(`${PROXY}/receipt_settings/records?perPage=1&sort=-created`),
          fetch("/api/center-presets"),
          fetch(`${PROXY}/receipt_settings/records?perPage=50&sort=-created`),
        ])
        if (cancelled) return
        if (res.ok) {
          const items = (await res.json()).items || []
          if (items.length > 0) {
            const s = items[0]
            setPdfSettings(prev => ({
              ...prev,
              schoolLogo: s.schoolLogo || '', schoolName: s.schoolName || '智慧教育学校',
              schoolNameEn: s.schoolNameEn || '', schoolAddress: s.schoolAddress || '',
              schoolPhone: s.schoolPhone || '', schoolEmail: s.schoolEmail || '',
              primaryColor: s.primaryColor || '#1e40af', secondaryColor: s.secondaryColor || '#3b82f6',
              accentColor: s.accentColor || '#f59e0b', footerText: s.footerText || '',
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
          setAllPresets((allData.items || []).map((s: any) => ({
            id: s.id, name: s.name || '未命名', schoolName: s.schoolName || '',
            schoolNameEn: s.schoolNameEn || '', schoolLogo: s.schoolLogo || '',
            schoolAddress: s.schoolAddress || '', schoolPhone: s.schoolPhone || '',
            schoolEmail: s.schoolEmail || '', primaryColor: s.primaryColor || '#1e40af',
            secondaryColor: s.secondaryColor || '#3b82f6', accentColor: s.accentColor || '#f59e0b',
            footerText: s.footerText || '', receiptNote: s.receiptNote || '',
            isDefault: true, createdAt: s.created || '', updatedAt: s.updated || '',
          })))
        }
      } catch { /* 用默认设置 */ }
    })()
    return () => { cancelled = true }
  }, [])

  const getPresetFor = (receipt: any): ReceiptSettingsPreset => {
    const student = students.find((s: any) => s.id === receipt?.studentId)
    const centerId = student?.center || ''
    if (centerId && centerPresetMap[centerId]) {
      const preset = allPresets.find(p => p.id === centerPresetMap[centerId])
      if (preset) return preset
    }
    return pdfSettings
  }

  const getStudentName = (studentId: string) => {
    const s = students.find((x: any) => x.id === studentId)
    return s?.student_name || s?.name || studentId
  }

  const getInvoiceNumber = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return paymentId
    const invoice = invoices.find(inv => inv.id === payment.invoiceId)
    return invoice?.invoiceNumber || paymentId
  }

  const viewReceipt = (receipt: any) => { setSelectedReceipt(receipt); setDetailOpen(true) }

  const download = async (receipt: any) => {
    try {
      await downloadReceiptPDF(receipt, getPresetFor(receipt), getStudentName(receipt.studentId))
    } catch (e) { console.error('下载收据 PDF 失败:', e) }
  }

  const print = (receipt: any) => {
    const html = generateReceiptHTML(receipt, getPresetFor(receipt), getStudentName(receipt.studentId))
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  const send = async (receipt: any) => {
    const student = students.find((s: any) => s.id === receipt.studentId)
    const phone = student?.mother_phone || student?.father_phone || student?.emergencyContact || student?.parentPhone || ''
    const formattedPhone = phone ? phone.replace(/\s+/g, '').replace(/^0/, '60').replace(/^\+/, '') : ''
    if (!formattedPhone) {
      alert('该学生没有家长电话号码，请先在学生管理填上家长电话。')
      return
    }
    try {
      // 只发 PDF（收据内容已在 PDF 里）
      const pdfBlob = await generateReceiptPDF(receipt, getPresetFor(receipt), getStudentName(receipt.studentId))
      const pdfFile = new File([pdfBlob], `Receipt_${receipt.receiptNumber}.pdf`, { type: 'application/pdf' })
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({ files: [pdfFile], title: `收据 ${receipt.receiptNumber}` })
          return
        } catch { /* 用户取消分享 → 走下载+WhatsApp */ }
      }
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url; a.download = `Receipt_${receipt.receiptNumber}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent('📎 请贴上刚下载的收据PDF文件')}`, '_blank')
    } catch (e) {
      console.error('发送收据失败:', e)
    }
  }

  return { getPresetFor, getStudentName, getInvoiceNumber, viewReceipt, download, print, send, selectedReceipt, detailOpen, setDetailOpen }
}

/** 付款行内的一排收据按钮 */
export function ReceiptActions({ receipt, tools }: { receipt: any; tools: ReceiptTools }) {
  if (!receipt) return <span className="text-xs text-slate-300">未生成</span>
  return (
    <div className="flex items-center justify-center gap-0.5">
      <span className="font-mono text-[11px] text-slate-500 mr-1">{receipt.receiptNumber}</span>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="查看收据" onClick={() => tools.viewReceipt(receipt)}>
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="打印" onClick={() => tools.print(receipt)}>
        <Printer className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="下载 PDF" onClick={() => tools.download(receipt)}>
        <Download className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:text-green-700" title="发送给家长 (WhatsApp)" onClick={() => tools.send(receipt)}>
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

/** 收据详情（PDF 预览 + 下载/打印） */
export function ReceiptDetailDialog({ tools }: { tools: ReceiptTools }) {
  const r = tools.selectedReceipt
  return (
    <Dialog open={tools.detailOpen} onOpenChange={tools.setDetailOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> 收据详情 - {r?.receiptNumber}
          </DialogTitle>
          <DialogDescription>查看收据的详细信息</DialogDescription>
        </DialogHeader>
        {r && (
          <div className="space-y-4">
            <div className="w-full border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={generateReceiptHTML(r, tools.getPresetFor(r), tools.getStudentName(r.studentId))}
                className="w-full border-0"
                style={{ height: '70vh', minHeight: '500px' }}
                title="收据预览"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => tools.download(r)}>
                <Download className="h-4 w-4 mr-2" /> 下载PDF
              </Button>
              <Button variant="outline" onClick={() => tools.print(r)}>
                <Printer className="h-4 w-4 mr-2" /> 打印
              </Button>
              <Button onClick={() => tools.setDetailOpen(false)}>关闭</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** 收据统计卡（4 张） */
export function ReceiptStatsCards({ stats }: { stats: { total: number; issued: number; draft: number; totalAmount: number } }) {
  const cards = [
    { label: '总收据数', value: stats.total, color: 'text-green-600', Icon: FileText },
    { label: '已开具', value: stats.issued, color: 'text-blue-600', Icon: CheckCircle },
    { label: '待处理', value: stats.draft, color: 'text-orange-600', Icon: AlertCircle },
    { label: '总金额', value: `RM ${stats.totalAmount.toLocaleString()}`, color: 'text-purple-600', Icon: FileText },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
              <c.Icon className={`h-6 w-6 ${c.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** 收据 PDF 设置 */
export function ReceiptSettingsDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved?: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> 收据 PDF 设置</DialogTitle>
        </DialogHeader>
        <ReceiptSettingsManager onSettingsChange={() => { onSaved?.(); onOpenChange(false) }} />
      </DialogContent>
    </Dialog>
  )
}

/** 收据回收站（软删的收据：恢复 / 永久删除） */
export function ReceiptBinDialog({ open, onOpenChange, tools }: { open: boolean; onOpenChange: (v: boolean) => void; tools: ReceiptTools }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${PROXY}/receipts/records?filter=${encodeURIComponent('deleted=true')}&sort=-updated&perPage=200`)
      setItems((await res.json())?.items || [])
    } catch { setItems([]) } finally { setLoading(false) }
  }
  useEffect(() => { if (open) load() }, [open])

  const restore = async (id: string) => {
    await fetch(`${PROXY}/receipts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleted: false }),
    })
    load()
  }
  const purge = async (id: string) => {
    if (!confirm('确定要永久删除这张收据吗？此操作不可恢复！')) return
    await fetch(`${PROXY}/receipts/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-red-500" /> 收据回收站</DialogTitle>
          <DialogDescription>已删除的收据可恢复；永久删除不可逆。</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin text-amber-500" /></div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">回收站是空的</div>
        ) : (
          <div className="divide-y">
            {items.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px]">{r.receiptNumber}</Badge>
                    <span className="text-slate-700 truncate">{tools.getStudentName(r.studentId)}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('zh-CN') : '—'} · RM {(r.totalAmount || 0).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => restore(r.id)}>恢复</Button>
                  <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => purge(r.id)}>永久删除</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
