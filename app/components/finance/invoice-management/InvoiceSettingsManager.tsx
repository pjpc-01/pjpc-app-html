"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Save,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  Eye,
  Upload,
  Palette,
  Landmark,
  FileText,
  Smartphone,
  Mail,
} from "lucide-react"

// Types
export interface InvoiceSettingsPreset {
  id: string
  name: string
  // School Info
  schoolName: string
  schoolNameEn: string
  schoolLogo: string // base64 data URL
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  schoolWebsite: string
  // Tax
  taxNumber: string
  // Banking
  bankName: string
  bankAccount: string
  bankHolder: string
  // Branding
  primaryColor: string
  secondaryColor: string
  accentColor: string
  // Content
  footerText: string
  paymentTerms: string
  receiptNote: string
  // Defaults
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Default preset factory
const createDefaultPreset = (overrides?: Partial<InvoiceSettingsPreset>): InvoiceSettingsPreset => ({
  id: Date.now().toString(),
  name: "默认设置",
  schoolName: "",
  schoolNameEn: "",
  schoolLogo: "",
  schoolAddress: "",
  schoolPhone: "",
  schoolEmail: "",
  schoolWebsite: "",
  taxNumber: "",
  bankName: "",
  bankAccount: "",
  bankHolder: "",
  primaryColor: "#1e40af",
  secondaryColor: "#3b82f6",
  accentColor: "#f59e0b",
  footerText: "",
  paymentTerms: "",
  receiptNote: "",
  isDefault: true,
  createdAt: new Date().toISOString().split('T')[0],
  updatedAt: new Date().toISOString().split('T')[0],
  ...overrides
})

// Generate a preview invoice HTML using current settings
export const generateInvoicePreviewHTML = (settings: InvoiceSettingsPreset): string => {
  const sampleItems = [
    { name: "基础学费 (Tuition Fee)", amount: 800 },
    { name: "教材费 (Material Fee)", amount: 200 },
    { name: "交通费 (Transport Fee)", amount: 150 },
  ]
  const subtotal = sampleItems.reduce((s, i) => s + i.amount, 0)
  const tax = 0
  const total = subtotal + tax

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>发票预览</title>
  <style>
    @page { margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif;
      color: #1f2937;
      padding: 30px;
      background: #f8fafc;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor});
      color: #fff;
      padding: 32px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .header-logo {
      width: 64px; height: 64px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: bold; color: #fff;
      overflow: hidden;
    }
    .header-logo img { width: 100%; height: 100%; object-fit: contain; }
    .header-title h1 { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
    .header-title p { font-size: 12px; opacity: 0.85; margin-top: 2px; }
    .header-badge {
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .body { padding: 28px 36px; }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 24px;
    }
    .info-block { flex: 1; }
    .info-block h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .info-block p { font-size: 14px; line-height: 1.6; color: #374151; }
    .info-block .highlight { font-size: 18px; font-weight: 700; color: ${settings.primaryColor}; }
    .divider { border: none; border-top: 2px dashed #e5e7eb; margin: 16px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .items-table th {
      background: ${settings.primaryColor}10;
      color: ${settings.primaryColor};
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 2px solid ${settings.primaryColor}30;
    }
    .items-table th:last-child { text-align: right; }
    .items-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
    }
    .items-table td:last-child { text-align: right; font-weight: 600; }
    .items-table tr:last-child td { border-bottom: none; }
    .totals {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #e5e7eb;
    }
    .total-line {
      display: flex; justify-content: flex-end; align-items: center;
      padding: 4px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .total-line span:first-child { width: 120px; text-align: right; margin-right: 20px; }
    .total-line span:last-child { width: 120px; text-align: right; }
    .grand-total {
      display: flex; justify-content: flex-end; align-items: center;
      padding: 12px 0;
      font-size: 20px; font-weight: 700;
      color: ${settings.primaryColor};
      border-top: 2px solid ${settings.primaryColor};
      margin-top: 8px;
    }
    .grand-total span:first-child { width: 120px; text-align: right; margin-right: 20px; }
    .grand-total span:last-child { width: 120px; text-align: right; }
    .payment-info {
      margin-top: 24px;
      padding: 16px 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid ${settings.accentColor};
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
    }
    .payment-info h4 { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .payment-info p { font-size: 14px; font-weight: 600; color: #374151; }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.8;
    }
    .watermark {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 120px;
      font-weight: 900;
      color: ${settings.primaryColor}08;
      pointer-events: none;
      z-index: 0;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-wrapper { box-shadow: none; border-radius: 0; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="watermark">INVOICE</div>
  <div class="invoice-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="header-logo">
          ${settings.schoolLogo ? `<img src="${settings.schoolLogo}" alt="logo" />` : settings.schoolName.charAt(0)}
        </div>
        <div class="header-title">
          <h1>${settings.schoolName}</h1>
          <p>${settings.schoolNameEn}</p>
        </div>
      </div>
      <div class="header-badge">发票 INVOICE</div>
    </div>

    <div class="body">
      <div class="info-row">
        <div class="info-block">
          <h3>发票号码</h3>
          <p class="highlight">INV-2026-06-12-PREVIEW</p>
          <p style="margin-top:4px;font-size:12px;color:#9ca3af;">开具: 2026-06-12</p>
        </div>
        <div class="info-block" style="text-align:right;">
          <h3>到期日期</h3>
          <p class="highlight">2026-06-27</p>
          <p style="margin-top:4px;font-size:12px;color:#9ca3af;">Due Date</p>
        </div>
      </div>

      <div class="info-row">
        <div class="info-block">
          <h3>学生信息 Student</h3>
          <p><strong>王小明</strong></p>
          <p>年级: 三年级 (Standard 3)</p>
          <p>学号: B1</p>
        </div>
        <div class="info-block" style="text-align:right;">
          <h3>学校信息 School</h3>
          <p>${settings.schoolAddress}</p>
          <p>${settings.schoolPhone}</p>
          <p>${settings.schoolEmail}</p>
        </div>
      </div>

      <hr class="divider" />

      <table class="items-table">
        <thead>
          <tr>
            <th>项目 Item</th>
            <th>金额 Amount (RM)</th>
          </tr>
        </thead>
        <tbody>
          ${sampleItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.amount.toFixed(2)}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-line">
          <span>小计 Subtotal</span>
          <span>RM ${subtotal.toFixed(2)}</span>
        </div>
        ${tax > 0 ? `<div class="total-line"><span>税费 Tax</span><span>RM ${tax.toFixed(2)}</span></div>` : ''}
        <div class="grand-total">
          <span>总计 Total</span>
          <span>RM ${total.toFixed(2)}</span>
        </div>
      </div>

      <div class="payment-info">
        <div>
          <h4>🏦 银行信息 Bank</h4>
          <p>${settings.bankName}</p>
          <p>账户: ${settings.bankAccount}</p>
          <p>户名: ${settings.bankHolder}</p>
        </div>
        <div>
          <h4>📝 付款须知</h4>
          <p>${settings.paymentTerms}</p>
        </div>
      </div>

      ${settings.receiptNote ? `
      <div style="margin-top:12px;padding:8px 12px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e;">
        📌 ${settings.receiptNote}
      </div>` : ''}

      <div class="footer">
        <p>${settings.schoolName} | ${settings.schoolAddress}</p>
        <p>${settings.schoolPhone} | ${settings.schoolEmail}</p>
        <p style="margin-top:6px;">${settings.footerText}</p>
        <p style="margin-top:4px;font-size:10px;color:#d1d5db;">税号: ${settings.taxNumber}</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

interface InvoiceSettingsManagerProps {
  onSettingsChange?: (settings: InvoiceSettingsPreset) => void
  activePresetId?: string
}

export default function InvoiceSettingsManager({ onSettingsChange, activePresetId }: InvoiceSettingsManagerProps) {
  const [presets, setPresets] = useState<InvoiceSettingsPreset[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [settings, setSettings] = useState<InvoiceSettingsPreset>(createDefaultPreset())
  const [isNewPresetDialogOpen, setIsNewPresetDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("school")
  const logoSpanRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Load presets from PocketBase on mount
  useEffect(() => {
    let cancelled = false
    const loadPresets = async () => {
      try {
        const res = await fetch('/api/pocketbase-proxy/api/collections/invoice_settings/records?perPage=50&sort=-created')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        const items = data.items || []
        
        if (items.length > 0) {
          // Map PB records to InvoiceSettingsPreset
          const mapped = items.map((r: any) => ({
            ...r,
            id: r.id,
            name: r.name || '默认设置',
            schoolLogo: r.schoolLogo || '',
            schoolName: r.schoolName || '',
            schoolNameEn: r.schoolNameEn || '',
            schoolAddress: r.schoolAddress || '',
            schoolPhone: r.schoolPhone || '',
            schoolEmail: r.schoolEmail || '',
            schoolWebsite: r.schoolWebsite || '',
            taxNumber: r.taxNumber || '',
            bankName: r.bankName || '',
            bankAccount: r.bankAccount || '',
            bankHolder: r.bankHolder || '',
            primaryColor: r.primaryColor || '#1e40af',
            secondaryColor: r.secondaryColor || '#3b82f6',
            accentColor: r.accentColor || '#f59e0b',
            footerText: r.footerText || '',
            paymentTerms: r.paymentTerms || '',
            receiptNote: r.receiptNote || '',
            isDefault: r.isDefault || false,
            createdAt: r.created || '',
            updatedAt: r.updated || '',
          })) as InvoiceSettingsPreset[]
          
          if (cancelled) return
          setPresets(mapped)
          const defaultId = activePresetId || mapped.find((p: any) => p.isDefault)?.id || mapped[0].id
          setActiveId(defaultId)
          const active = mapped.find((p: any) => p.id === defaultId)
          if (active) {
            setSettings(active)
            if (onSettingsChange) onSettingsChange(active)
          }
          return
        }
      } catch (e) {
        console.error('Failed to load invoice settings from PB:', e)
      }
      
      // Fallback: try localStorage migration
      if (cancelled) return
      try {
        const saved = localStorage.getItem('invoiceSettingsPresets')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Migrate to PB
            for (const p of parsed) {
              await fetch('/api/pocketbase-proxy/api/collections/invoice_settings/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...p, id: undefined })
              })
            }
            // Reload
            window.location.reload()
            return
          }
        }
      } catch {}
      
      // No presets anywhere, create default in-memory
      const defaultPreset = createDefaultPreset()
      setPresets([defaultPreset])
      setActiveId(defaultPreset.id)
      setSettings(defaultPreset)
    }
    loadPresets()
    return () => { cancelled = true }
  }, [])

  // Save a single preset to PocketBase (POST for new, PATCH for existing)
  const savePreset = async (preset: InvoiceSettingsPreset, isNew: boolean = false) => {
    const { id, createdAt, updatedAt, ...data } = preset as any
    const url = isNew 
      ? '/api/pocketbase-proxy/api/collections/invoice_settings/records'
      : `/api/pocketbase-proxy/api/collections/invoice_settings/records/${id}`
    const method = isNew ? 'POST' : 'PATCH'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to save preset')
    return await res.json()
  }

  // Delete a preset from PocketBase
  const deletePreset = async (presetId: string) => {
    await fetch(`/api/pocketbase-proxy/api/collections/invoice_settings/records/${presetId}`, {
      method: 'DELETE'
    })
  }

  // Update current settings and persist to PB
  const updateSettings = async (updates: Partial<InvoiceSettingsPreset>) => {
    const newSettings = { ...settings, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
    setSettings(newSettings)
    // Update in presets list
    const updated = presets.map(p => p.id === activeId ? newSettings : p)
    setPresets(updated)
    // Save to PB
    try { await savePreset(newSettings) } catch (e) { console.error('Save failed:', e) }
    if (onSettingsChange) onSettingsChange(newSettings)
  }

  // Handle preset selection
  const handleSelectPreset = (id: string) => {
    const preset = presets.find(p => p.id === id)
    if (preset) {
      setActiveId(id)
      setSettings(preset)
      if (onSettingsChange) onSettingsChange(preset)
    }
  }

  // Save current as new preset
  const handleSaveAsNew = async () => {
    if (!newPresetName.trim()) return
    const newPreset = createDefaultPreset({
      ...settings,
      id: Date.now().toString(),
      name: newPresetName.trim(),
      isDefault: false,
    })
    try {
      const saved = await savePreset(newPreset, true)
      const savedPreset = { ...newPreset, id: saved.id }
      setPresets(prev => [...prev, savedPreset])
      setActiveId(saved.id)
      setSettings(savedPreset)
    } catch (e) {
      console.error('Save as new failed:', e)
    }
    setNewPresetName("")
    setIsNewPresetDialogOpen(false)
  }

  // Duplicate current preset
  const handleDuplicate = async () => {
    const dup = createDefaultPreset({
      ...settings,
      id: Date.now().toString(),
      name: settings.name + " (副本)",
      isDefault: false,
    })
    try {
      const saved = await savePreset(dup, true)
      const savedPreset = { ...dup, id: saved.id }
      setPresets(prev => [...prev, savedPreset])
      setActiveId(saved.id)
      setSettings(savedPreset)
    } catch (e) {
      console.error('Duplicate failed:', e)
    }
  }

  // Delete preset
  const handleDeletePreset = async () => {
    if (presets.length <= 1) {
      alert("至少需要保留一个预设")
      return
    }
    try {
      await deletePreset(activeId)
      const updated = presets.filter(p => p.id !== activeId)
      setPresets(updated)
      setActiveId(updated[0].id)
      setSettings(updated[0])
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  // Set as default
  const handleSetDefault = async () => {
    const updated = presets.map(p => ({ ...p, isDefault: p.id === activeId }))
    setPresets(updated)
    // Update all presets in PB
    for (const p of updated) {
      if (p.isDefault !== presets.find(op => op.id === p.id)?.isDefault) {
        try { await savePreset(p) } catch (e) { console.error('Set default failed:', e) }
      }
    }
  }

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateSettings({ schoolLogo: ev.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  // Print preview
  const handlePrintPreview = () => {
    const iframe = previewRef.current
    if (iframe) {
      iframe.contentWindow?.print()
    }
  }

  const activePreset = presets.find(p => p.id === activeId)

  return (
    <div className="space-y-6">
      {/* Preset Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          <Label className="whitespace-nowrap font-medium">预设方案:</Label>
          <Select value={activeId} onValueChange={handleSelectPreset}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="选择预设" />
            </SelectTrigger>
            <SelectContent>
              {presets.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} {p.isDefault ? '⭐' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsNewPresetDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            另存为新预设
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-1" />
            复制
          </Button>
          <Button variant="outline" size="sm" onClick={handleSetDefault}>
            <CheckCircle className="h-4 w-4 mr-1" />
            设为默认
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeletePreset}>
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
        </div>
      </div>

      {/* Main Content: Form + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Settings Form */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="school"><Building2 className="h-4 w-4 mr-1" />学校信息</TabsTrigger>
              <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-1" />品牌样式</TabsTrigger>
              <TabsTrigger value="payment"><Landmark className="h-4 w-4 mr-1" />付款信息</TabsTrigger>
            </TabsList>

            {/* Tab: School Info */}
            <TabsContent value="school" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>学校名称 (中文)</Label>
                      <Input value={settings.schoolName} onChange={e => updateSettings({ schoolName: e.target.value })} placeholder="智慧教育学校" />
                    </div>
                    <div>
                      <Label>学校名称 (英文)</Label>
                      <Input value={settings.schoolNameEn} onChange={e => updateSettings({ schoolNameEn: e.target.value })} placeholder="Smart Education School" />
                    </div>
                  </div>
                  <div>
                    <Label>学校地址</Label>
                    <Textarea value={settings.schoolAddress} onChange={e => updateSettings({ schoolAddress: e.target.value })} rows={2} placeholder="详细地址" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label><Smartphone className="h-3.5 w-3.5 inline mr-1" />电话</Label>
                      <Input value={settings.schoolPhone} onChange={e => updateSettings({ schoolPhone: e.target.value })} placeholder="010-12345678" />
                    </div>
                    <div>
                      <Label><Mail className="h-3.5 w-3.5 inline mr-1" />邮箱</Label>
                      <Input value={settings.schoolEmail} onChange={e => updateSettings({ schoolEmail: e.target.value })} placeholder="info@school.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>网站</Label>
                      <Input value={settings.schoolWebsite} onChange={e => updateSettings({ schoolWebsite: e.target.value })} placeholder="https://" />
                    </div>
                    <div>
                      <Label>税号</Label>
                      <Input value={settings.taxNumber} onChange={e => updateSettings({ taxNumber: e.target.value })} placeholder="SSM/Tax ID" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">学校标志 (Logo)</Label>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted bg-muted/20 flex items-center justify-center overflow-hidden flex-shrink-0 group relative cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => logoSpanRef.current?.click()}>
                        {settings.schoolLogo ? (
                          <>
                            <img src={settings.schoolLogo} alt="logo" className="w-full h-full object-contain p-1" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Building2 className="h-8 w-8" />
                            <span className="text-[10px] mt-1">点击上传</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input ref={logoSpanRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        <Button variant="outline" size="sm" onClick={() => logoSpanRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-1" />上传Logo
                        </Button>
                        <p className="text-xs text-muted-foreground">建议正方形，PNG/SVG</p>
                        {settings.schoolLogo && (
                          <Button variant="ghost" size="sm" onClick={() => updateSettings({ schoolLogo: '' })} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 mr-1" />移除Logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Branding */}
            <TabsContent value="branding" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">颜色方案</CardTitle>
                  <CardDescription>自定义发票的主题颜色</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>主色</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={settings.primaryColor} onChange={e => updateSettings({ primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border" />
                        <Input value={settings.primaryColor} onChange={e => updateSettings({ primaryColor: e.target.value })} className="flex-1 font-mono text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label>辅色</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={settings.secondaryColor} onChange={e => updateSettings({ secondaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border" />
                        <Input value={settings.secondaryColor} onChange={e => updateSettings({ secondaryColor: e.target.value })} className="flex-1 font-mono text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label>强调色</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={settings.accentColor} onChange={e => updateSettings({ accentColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border" />
                        <Input value={settings.accentColor} onChange={e => updateSettings({ accentColor: e.target.value })} className="flex-1 font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50">
                    <div className="text-sm text-gray-600">预览效果：</div>
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.primaryColor }} title="主色" />
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.secondaryColor }} title="辅色" />
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.accentColor }} title="强调色" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Payment & Footer */}
            <TabsContent value="payment" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">银行信息</CardTitle>
                  <CardDescription>显示在发票底部的付款账户信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>银行名称</Label>
                      <Input value={settings.bankName} onChange={e => updateSettings({ bankName: e.target.value })} placeholder="马来亚银行" />
                    </div>
                    <div>
                      <Label>账户号码</Label>
                      <Input value={settings.bankAccount} onChange={e => updateSettings({ bankAccount: e.target.value })} placeholder="1234-5678-9012" />
                    </div>
                  </div>
                  <div>
                    <Label>账户户名</Label>
                    <Input value={settings.bankHolder} onChange={e => updateSettings({ bankHolder: e.target.value })} placeholder="智慧教育学校" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">发票内容</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>付款条款</Label>
                    <Textarea value={settings.paymentTerms} onChange={e => updateSettings({ paymentTerms: e.target.value })} rows={2} placeholder="请在到期日期前完成付款..." />
                  </div>
                  <div>
                    <Label>收据备注</Label>
                    <Textarea value={settings.receiptNote} onChange={e => updateSettings({ receiptNote: e.target.value })} rows={2} placeholder="此收据仅作为付款凭证..." />
                  </div>
                  <div>
                    <Label>页脚文字</Label>
                    <Textarea value={settings.footerText} onChange={e => updateSettings({ footerText: e.target.value })} rows={2} placeholder="感谢您的信任与支持！" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              发票预览
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrintPreview}>
                <FileText className="h-4 w-4 mr-1" />
                打印预览
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsPreviewDialogOpen(true)}>
                <Eye className="h-4 w-4 mr-1" />
                全屏预览
              </Button>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm" style={{ minHeight: 500 }}>
            <iframe
              ref={previewRef}
              srcDoc={generateInvoicePreviewHTML(settings)}
              className="w-full border-0"
              style={{ minHeight: 500, height: 'calc(100vh - 400px)' }}
              title="发票预览"
            />
          </div>
        </div>
      </div>

      {/* Save Status */}
      <div className="flex items-center justify-end text-xs text-gray-500 border-t pt-3">
        <Save className="h-3.5 w-3.5 mr-1" />
        自动保存 · 最后更新: {settings.updatedAt}
        {activePreset?.isDefault && <Badge variant="outline" className="ml-2 text-xs">默认预设</Badge>}
      </div>

      {/* New Preset Dialog */}
      <Dialog open={isNewPresetDialogOpen} onOpenChange={setIsNewPresetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>另存为新预设</DialogTitle>
            <DialogDescription>将当前设置保存为一个新的预设方案</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>预设名称</Label>
              <Input value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="例如：国际部、假期班" onKeyDown={e => { if (e.key === 'Enter') handleSaveAsNew() }} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewPresetDialogOpen(false)}>取消</Button>
              <Button onClick={handleSaveAsNew} disabled={!newPresetName.trim()}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>发票预览 - {settings.name}</DialogTitle>
            <DialogDescription>使用当前设置生成的发票样式</DialogDescription>
          </DialogHeader>
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[70vh]">
            <iframe
              srcDoc={generateInvoicePreviewHTML(settings)}
              className="w-full border-0 bg-white rounded-lg shadow-sm"
              style={{ minHeight: 600 }}
              title="全屏发票预览"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
