"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Building2, Save, Plus, Trash2, Copy, CheckCircle, Eye, Upload, Palette, FileText, Smartphone, Mail,
} from "lucide-react"

// Types
export interface PayslipSettingsPreset {
  id: string
  name: string
  // School Info
  schoolName: string
  schoolNameEn: string
  schoolLogo: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  // Company Registration
  companyRegNo?: string
  employerEpfNo?: string
  employerSocsoNo?: string
  // Branding
  primaryColor: string
  secondaryColor: string
  accentColor: string
  // Content
  footerText: string
  showEmployerEPF: boolean
  // Defaults
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Default preset factory
const createDefaultPreset = (overrides?: Partial<PayslipSettingsPreset>): PayslipSettingsPreset => ({
  id: Date.now().toString(),
  name: "默认设置",
  schoolName: "",
  schoolNameEn: "",
  schoolLogo: "",
  schoolAddress: "",
  schoolPhone: "",
  schoolEmail: "",
  companyRegNo: "",
  employerEpfNo: "",
  employerSocsoNo: "",
  primaryColor: "#1e40af",
  secondaryColor: "#3b82f6",
  accentColor: "#f59e0b",
  footerText: "",
  showEmployerEPF: true,
  isDefault: true,
  createdAt: new Date().toISOString().split('T')[0],
  updatedAt: new Date().toISOString().split('T')[0],
  ...overrides
})

// Generate a preview payslip HTML using current settings
export const generatePayslipPreviewHTML = (settings: PayslipSettingsPreset): string => {
  const primaryColor = settings.primaryColor || '#1e40af'
  const secondaryColor = settings.secondaryColor || '#3b82f6'
  const accentColor = settings.accentColor || '#f59e0b'
  const schoolName = settings.schoolName || '智慧教育学校'
  const teacherName = "张老师"
  const year = 2026
  const monthName = "六月"
  const baseSalary = 3500.00
  const allowances = 500.00
  const overtimePay = 200.00
  const grossSalary = 4200.00
  const epfDeduction = 462.00
  const socsoDeduction = 21.00
  const socsoEmployer = 49.50
  const eisDeduction = 8.40
  const eisEmployer = 8.40
  const taxDeduction = 50.00
  const totalDeductions = epfDeduction + socsoDeduction + eisDeduction + taxDeduction
  const netSalary = grossSalary - totalDeductions
  const epfEmployer = 546.00

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>薪资单预览</title>
  <style>
    @page { margin: 0; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif;
      color: #1f2937;
      background: #fff;
      width: 794px;
      margin: 0 auto;
    }
    .payslip-wrapper { width: 100%; background: #fff; overflow: hidden; }
    .header {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: #fff;
      padding: 32px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .header-logo {
      width: 64px; height: 64px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: bold; color: #fff;
      overflow: hidden;
      flex-shrink: 0;
    }
    .header-logo img { width: 100%; height: 100%; object-fit: contain; }
    .header-title h1 { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
    .header-title p { font-size: 12px; opacity: 0.85; margin-top: 2px; }
    .body { padding: 28px 36px; position: relative; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 24px; }
    .info-block { flex: 1; }
    .info-block h3 {
      font-size: 12px; text-transform: uppercase; color: #6b7280;
      letter-spacing: 1px; margin-bottom: 8px;
    }
    .info-block p { font-size: 14px; line-height: 1.6; color: #374151; }
    .info-block .highlight { font-size: 18px; font-weight: 700; color: ${primaryColor}; }
    .divider { border: none; border-top: 2px dashed #e5e7eb; margin: 16px 0; }
    .section-title {
      font-size: 15px; font-weight: 700; color: ${primaryColor};
      padding: 8px 0; margin-bottom: 12px;
      border-bottom: 2px solid ${primaryColor}30;
    }
    .items-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .items-table th {
      background: ${primaryColor}15; color: ${primaryColor};
      font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 10px 16px; text-align: left;
      border-bottom: 2px solid ${primaryColor}30;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .items-table th:last-child { text-align: right; }
    .items-table td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .items-table td:last-child { text-align: right; font-weight: 600; }
    .items-table tr:last-child td { border-bottom: none; }
    .total-row td {
      border-top: 2px solid ${primaryColor};
      font-weight: 700; font-size: 15px; color: ${primaryColor};
      padding: 12px 16px;
    }
    .net-salary-row td {
      border-top: 2px solid ${primaryColor};
      background: ${primaryColor}10;
      font-weight: 800; font-size: 18px; color: ${primaryColor};
      padding: 14px 16px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .net-salary-row td:last-child { color: ${primaryColor}; font-size: 20px; }
    .deductions-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .deductions-table th {
      background: #dc262615; color: #dc2626;
      font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 10px 16px; text-align: left;
      border-bottom: 2px solid #dc262630;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .deductions-table th:last-child { text-align: right; }
    .deductions-table td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .deductions-table td:last-child { text-align: right; font-weight: 600; }
    .deductions-table tr:last-child td { border-bottom: none; }
    .deductions-total td {
      border-top: 2px solid #dc2626;
      font-weight: 700; font-size: 15px; color: #dc2626;
      padding: 12px 16px;
    }
    .payment-info {
      margin-top: 24px; padding: 16px 20px;
      background: #f9fafb; border-radius: 8px;
      border-left: 4px solid ${accentColor};
      display: flex; gap: 40px; flex-wrap: wrap;
    }
    .payment-info h4 { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .payment-info p { font-size: 14px; font-weight: 600; color: #374151; }
    .footer {
      margin-top: 24px; padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="payslip-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="header-logo">
          ${settings.schoolLogo ? `<img src="${settings.schoolLogo}" alt="logo" crossorigin="anonymous" />` : schoolName.charAt(0)}
        </div>
        <div class="header-title">
          <h1>${schoolName}</h1>
          <p>${settings.schoolNameEn || '智慧教育 · 卓越未来'}</p>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.2);padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,0.3);white-space:nowrap;">PAYSLIP / 薪资单</div>
    </div>

    <div class="body">
      <div class="info-row">
        <div class="info-block">
          <h3>教师信息 Teacher</h3>
          <p class="highlight">${teacherName}</p>
        </div>
        <div class="info-block" style="text-align:right;">
          <h3>薪资期间 Period</h3>
          <p class="highlight">${year}年 ${monthName}</p>
        </div>
      </div>

      <hr class="divider" />

      <div class="section-title">💰 薪资构成 Salary Breakdown</div>
      <table class="items-table">
        <thead>
          <tr><th>项目 Item</th><th>金额 Amount (RM)</th></tr>
        </thead>
        <tbody>
          <tr><td>基本薪资 Base Salary</td><td>${baseSalary.toFixed(2)}</td></tr>
          <tr><td>津贴 Allowances</td><td>${allowances.toFixed(2)}</td></tr>
          <tr><td>加班费 Overtime Pay</td><td>${overtimePay.toFixed(2)}</td></tr>
          <tr class="total-row"><td>总薪资 Gross Salary</td><td>${grossSalary.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <hr class="divider" />

      <div class="section-title" style="color:#dc2626;border-bottom-color:#dc262630;">📋 扣款明细 Deductions</div>
      <table class="deductions-table">
        <thead>
          <tr><th>项目 Item</th><th>金额 Amount (RM)</th></tr>
        </thead>
        <tbody>
          <tr><td>EPF 雇员公积金 (Employee)</td><td>${epfDeduction.toFixed(2)}</td></tr>
          <tr><td>SOCSO 社会保险</td><td>${socsoDeduction.toFixed(2)}</td></tr>
          <tr><td>EIS 就业保险</td><td>${eisDeduction.toFixed(2)}</td></tr>
          <tr><td>PCB 预扣税 Tax</td><td>${taxDeduction.toFixed(2)}</td></tr>
          <tr class="deductions-total"><td>扣款总计 Total Deductions</td><td>${totalDeductions.toFixed(2)}</td></tr>
        </tbody>
      </table>

      ${settings.showEmployerEPF ? `
      <hr class="divider" />
      <div class="section-title" style="color:#059669;border-bottom-color:#05966930;">🏢 雇主缴纳 Employer Contributions</div>
      <table class="items-table">
        <thead>
          <tr><th>项目 Item</th><th>金额 Amount (RM)</th></tr>
        </thead>
        <tbody>
          <tr><td>EPF 雇主公积 (Employer)</td><td>${epfEmployer.toFixed(2)}</td></tr>
          <tr><td>SOCSO 雇主社保 (Employer)</td><td>${socsoEmployer.toFixed(2)}</td></tr>
          <tr><td>EIS 雇主就业险 (Employer)</td><td>${eisEmployer.toFixed(2)}</td></tr>
          <tr class="total-row"><td>雇主缴纳总计 Total Employer</td><td>${(epfEmployer + socsoEmployer + eisEmployer).toFixed(2)}</td></tr>
        </tbody>
      </table>` : ''}

      <hr class="divider" />

      <table class="items-table">
        <tbody>
          <tr class="net-salary-row">
            <td>🏆 净薪资 Net Salary</td>
            <td>RM ${netSalary.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>${schoolName} | 薪资单 Payslip</p>
        ${settings.footerText ? `<p style="margin-top:6px;">${settings.footerText}</p>` : ''}
        <p style="margin-top:6px;">本薪资单为内部文件，请妥善保管</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

interface PayslipSettingsManagerProps {
  onSettingsChange?: (settings: PayslipSettingsPreset) => void
  activePresetId?: string
}

export default function PayslipSettingsManager({ onSettingsChange, activePresetId }: PayslipSettingsManagerProps) {
  const { t } = useLanguage()
  const [presets, setPresets] = useState<PayslipSettingsPreset[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [settings, setSettings] = useState<PayslipSettingsPreset>(createDefaultPreset())
  const [isNewPresetDialogOpen, setIsNewPresetDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const logoSpanRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Load presets from PocketBase on mount
  useEffect(() => {
    let cancelled = false
    const loadPresets = async () => {
      try {
        const res = await fetch('/api/pocketbase-proxy/api/collections/salary_settings/records?perPage=50&sort=-created')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        const items = data.items || []

        if (items.length > 0) {
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
            primaryColor: r.primaryColor || '#1e40af',
            secondaryColor: r.secondaryColor || '#3b82f6',
            accentColor: r.accentColor || '#f59e0b',
            footerText: r.footerText || '',
            showEmployerEPF: r.showEmployerEPF || false,
            isDefault: r.isDefault || false,
            createdAt: r.created || '',
            updatedAt: r.updated || '',
          })) as PayslipSettingsPreset[]

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
        console.error('Failed to load payslip settings from PB:', e)
      }

      // Fallback: try localStorage migration
      if (cancelled) return
      try {
        const saved = localStorage.getItem('payslipSettingsPresets')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const p of parsed) {
              await fetch('/api/pocketbase-proxy/api/collections/salary_settings/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...p, id: undefined })
              })
            }
            window.location.reload()
            return
          }
        }
      } catch {}

      const defaultPreset = createDefaultPreset()
      setPresets([defaultPreset])
      setActiveId(defaultPreset.id)
      setSettings(defaultPreset)
    }
    loadPresets()
    return () => { cancelled = true }
  }, [])

  const savePreset = async (preset: PayslipSettingsPreset, isNew: boolean = false) => {
    const { id, createdAt, updatedAt, ...data } = preset as any
    const url = isNew
      ? '/api/pocketbase-proxy/api/collections/salary_settings/records'
      : `/api/pocketbase-proxy/api/collections/salary_settings/records/${id}`
    const method = isNew ? 'POST' : 'PATCH'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to save preset')
    return await res.json()
  }

  const deletePreset = async (presetId: string) => {
    await fetch(`/api/pocketbase-proxy/api/collections/salary_settings/records/${presetId}`, {
      method: 'DELETE'
    })
  }

  const updateSettings = async (updates: Partial<PayslipSettingsPreset>) => {
    const newSettings = { ...settings, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
    setSettings(newSettings)
    const updated = presets.map(p => p.id === activeId ? newSettings : p)
    setPresets(updated)
    try { await savePreset(newSettings) } catch (e) { console.error('Save failed:', e) }
    if (onSettingsChange) onSettingsChange(newSettings)
  }

  const handleSelectPreset = (id: string) => {
    const preset = presets.find(p => p.id === id)
    if (preset) {
      setActiveId(id)
      setSettings(preset)
      if (onSettingsChange) onSettingsChange(preset)
    }
  }

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

  const handleSetDefault = async () => {
    const updated = presets.map(p => ({ ...p, isDefault: p.id === activeId }))
    setPresets(updated)
    for (const p of updated) {
      if (p.isDefault !== presets.find(op => op.id === p.id)?.isDefault) {
        try { await savePreset(p) } catch {}
      }
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateSettings({ schoolLogo: ev.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

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
            <Plus className="h-4 w-4 mr-1" />另存为新预设
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-1" />复制
          </Button>
          <Button variant="outline" size="sm" onClick={handleSetDefault}>
            <CheckCircle className="h-4 w-4 mr-1" />设为默认
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeletePreset}>
            <Trash2 className="h-4 w-4 mr-1" />删除
          </Button>
        </div>
      </div>

      {/* Main Content: Form + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Settings Form - stacked vertically with h2 dividers */}
        <div className="space-y-6">
          {/* Section: School Info */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b mb-4">
              <Building2 className="h-5 w-5" />学校信息
            </h2>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('report.basic_info')}</CardTitle>
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
                    <Label><Smartphone className="h-3.5 w-3.5 inline mr-1" />{t('report.phone')}</Label>
                    <Input value={settings.schoolPhone} onChange={e => updateSettings({ schoolPhone: e.target.value })} placeholder="010-12345678" />
                  </div>
                  <div>
                    <Label><Mail className="h-3.5 w-3.5 inline mr-1" />{t('report.email')}</Label>
                    <Input value={settings.schoolEmail} onChange={e => updateSettings({ schoolEmail: e.target.value })} placeholder="info@school.com" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>SSM 注册号</Label>
                    <Input value={settings.companyRegNo || ''} onChange={e => updateSettings({ companyRegNo: e.target.value })} placeholder="201901012345" />
                  </div>
                  <div>
                    <Label>EPF 雇主编号</Label>
                    <Input value={settings.employerEpfNo || ''} onChange={e => updateSettings({ employerEpfNo: e.target.value })} placeholder="EPF12345678" />
                  </div>
                  <div>
                    <Label>PERKESO 雇主编号</Label>
                    <Input value={settings.employerSocsoNo || ''} onChange={e => updateSettings({ employerSocsoNo: e.target.value })} placeholder="SOCSO12345678" />
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
                          <span className="text-[10px] mt-1">{t('report.click_to_upload')}</span>
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
          </div>

          {/* Section: Branding */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b mb-4">
              <Palette className="h-5 w-5" />品牌样式
            </h2>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">颜色方案</CardTitle>
                <CardDescription>自定义薪资单的主题颜色</CardDescription>
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
          </div>

          {/* Section: Content */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b mb-4">
              <FileText className="h-5 w-5" />内容设置
            </h2>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">薪资单内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.showEmployerEPF}
                    onCheckedChange={checked => updateSettings({ showEmployerEPF: checked })}
                    id="showEmployerEPF"
                  />
                  <Label htmlFor="showEmployerEPF" className="cursor-pointer">显示雇主 EPF 缴纳信息</Label>
                </div>
                <div>
                  <Label>页脚文字</Label>
                  <Textarea value={settings.footerText} onChange={e => updateSettings({ footerText: e.target.value })} rows={2} placeholder="自定义页脚文字" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              薪资单预览
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrintPreview}>
                <FileText className="h-4 w-4 mr-1" />打印预览
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsPreviewDialogOpen(true)}>
                <Eye className="h-4 w-4 mr-1" />全屏预览
              </Button>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm" style={{ minHeight: 500 }}>
            <iframe
              ref={previewRef}
              srcDoc={generatePayslipPreviewHTML(settings)}
              className="w-full border-0"
              style={{ minHeight: 500, height: 'calc(100vh - 400px)' }}
              title="薪资单预览"
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
              <Input value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="例如：标准薪资单、简化版" onKeyDown={e => { if (e.key === 'Enter') handleSaveAsNew() }} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewPresetDialogOpen(false)}>{t('report.cancel')}</Button>
              <Button onClick={handleSaveAsNew} disabled={!newPresetName.trim()}>{t('report.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>薪资单预览 - {settings.name}</DialogTitle>
            <DialogDescription>使用当前设置生成的薪资单样式</DialogDescription>
          </DialogHeader>
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[70vh]">
            <iframe
              srcDoc={generatePayslipPreviewHTML(settings)}
              className="w-full border-0 bg-white rounded-lg shadow-sm"
              style={{ minHeight: 600 }}
              title="全屏薪资单预览"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
