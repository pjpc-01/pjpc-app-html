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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Building2, Save, Palette, FileText, Eye, Upload, Trash2, Settings,
} from "lucide-react"

export interface ReportSettingsPreset {
  id: string
  name: string
  schoolName: string
  schoolNameEn: string
  schoolLogo: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  primaryColor: string
  headerTitle: string
  headerSubtitle: string
  footerText: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

const createDefaultPreset = (overrides?: Partial<ReportSettingsPreset>): ReportSettingsPreset => ({
  id: Date.now().toString(),
  name: "默认设置",
  schoolName: "",
  schoolNameEn: "",
  schoolLogo: "",
  schoolAddress: "",
  schoolPhone: "",
  schoolEmail: "",
  primaryColor: "#3b82f6",
  headerTitle: "学生报告",
  headerSubtitle: "— 全面发展 · 健康成长 · 追求卓越 —",
  footerText: "自信自强 | 勤学善思 | 合作共进 | 全面发展",
  isDefault: true,
  createdAt: new Date().toISOString().split('T')[0],
  updatedAt: new Date().toISOString().split('T')[0],
  ...overrides
})

const generatePreviewHTML = (settings: ReportSettingsPreset): string => {
  const color = settings.primaryColor || "#3b82f6"
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>报告预览</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Microsoft YaHei','PingFang SC',sans-serif; color:#374151; padding:16px; background:#f8fafc; }
  .report { max-width:700px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,${color},${color}dd); color:#fff; padding:20px 24px; text-align:center; }
  .header h1 { font-size:22px; font-weight:700; }
  .header p { font-size:12px; opacity:0.85; margin-top:2px; }
  .body { padding:20px 24px; }
  .section-label { background:${color}; color:#fff; padding:6px 14px; border-radius:8px; font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; margin-bottom:12px; }
  table { width:100%; border-collapse:collapse; margin:12px 0; }
  th { background:${color}15; color:${color}; font-size:11px; text-transform:uppercase; padding:8px 10px; text-align:left; border-bottom:2px solid ${color}30; }
  td { padding:10px; border-bottom:1px solid #f3f4f6; font-size:13px; }
  tr:last-child td { border-bottom:none; }
  .stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
  .stat { background:${color}; color:#fff; border-radius:10px; padding:12px; text-align:center; }
  .stat .num { font-size:22px; font-weight:700; }
  .stat .label { font-size:10px; opacity:0.8; }
  .footer { background:#374151; color:#fff; text-align:center; padding:10px; font-size:12px; font-weight:500; }
  @media print { body { background:#fff; padding:0; } .report { box-shadow:none; border-radius:0; } }
</style></head>
<body>
<div class="report">
  <div class="header">
    ${settings.schoolLogo ? `<div style="width:56px;height:56px;margin:0 auto 8px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;"><img src="${settings.schoolLogo}" alt="logo" style="width:100%;height:100%;object-fit:contain;" /></div>` : ''}
    <h1>${settings.headerTitle || '学生报告'}</h1>
    ${settings.schoolName ? `<p style="font-size:13px;font-weight:600;margin-top:4px;">${settings.schoolName}</p>` : ''}
    <p>${settings.headerSubtitle || '— 全面发展 · 健康成长 · 追求卓越 —'}</p>
  </div>
  <div class="body">
    <div style="display:flex;gap:16px;margin-bottom:16px;align-items:center;">
      <div style="width:70px;height:70px;background:#e5e7eb;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#9ca3af;">👤</div>
      <div style="font-size:13px;line-height:1.8;">
        <b>王小明</b><br/>
        编号: B001 · 年级: 三年级<br/>
        出生: 2016-05-12 · 年龄: 10岁
      </div>
    </div>
    <div class="section-label">📚 一、学业表现</div>
    <table>
      <tr><th>学科</th><th>期中</th><th>期末</th><th>评价</th></tr>
      <tr><td>华文</td><td style="text-align:center">85</td><td style="text-align:center">90</td><td style="text-align:center">良好</td></tr>
      <tr><td>英文</td><td style="text-align:center">92</td><td style="text-align:center">95</td><td style="text-align:center">优秀</td></tr>
      <tr><td>数学</td><td style="text-align:center">78</td><td style="text-align:center">82</td><td style="text-align:center">良好</td></tr>
    </table>
    <div class="stat-row">
      <div class="stat"><div class="num">87.0</div><div class="label">平均分</div></div>
      <div class="stat"><div class="num">5</div><div class="label">班级排名</div></div>
      <div class="stat"><div class="num">↑3</div><div class="label">进步幅度</div></div>
    </div>
    ${settings.schoolAddress || settings.schoolPhone ? `<div style="margin-top:16px;padding:10px 14px;background:#f9fafb;border-radius:8px;font-size:11px;color:#6b7280;text-align:center;">${settings.schoolAddress || ''} ${settings.schoolAddress && settings.schoolPhone ? '·' : ''} ${settings.schoolPhone || ''}</div>` : ''}
  </div>
  <div class="footer">${settings.footerText || ''}</div>
</div>
</body></html>`
}

interface ReportSettingsManagerProps {
  onSettingsChange?: (settings: ReportSettingsPreset) => void
  activePresetId?: string
}

export default function ReportSettingsManager({ onSettingsChange, activePresetId }: ReportSettingsManagerProps) {
  const [presets, setPresets] = useState<ReportSettingsPreset[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [settings, setSettings] = useState<ReportSettingsPreset>(createDefaultPreset())
  const [activeTab, setActiveTab] = useState("school")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const logoSpanRef = useRef<HTMLInputElement>(null)

  // Load from PB on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/pocketbase-proxy/api/collections/report_settings/records?perPage=50&sort=-created')
        if (!res.ok) return
        const data = await res.json()
        const items = (data.items || []).map((r: any) => ({
          id: r.id, name: r.name || '默认设置',
          schoolName: r.schoolName || '', schoolNameEn: r.schoolNameEn || '',
          schoolLogo: r.schoolLogo || '', schoolAddress: r.schoolAddress || '',
          schoolPhone: r.schoolPhone || '', schoolEmail: r.schoolEmail || '',
          primaryColor: r.primaryColor || '#3b82f6',
          headerTitle: r.headerTitle || '学生报告',
          headerSubtitle: r.headerSubtitle || '— 全面发展 · 健康成长 · 追求卓越 —',
          footerText: r.footerText || '自信自强 | 勤学善思 | 合作共进 | 全面发展',
          isDefault: r.isDefault || false, createdAt: r.created || '', updatedAt: r.updated || '',
        } as ReportSettingsPreset))
        if (cancelled) return
        if (items.length > 0) {
          setPresets(items)
          const defId = activePresetId || items.find(p => p.isDefault)?.id || items[0].id
          setActiveId(defId)
          const active = items.find(p => p.id === defId)
          if (active) { setSettings(active); onSettingsChange?.(active) }
        } else {
          const d = createDefaultPreset()
          setPresets([d]); setActiveId(d.id); setSettings(d)
        }
      } catch (e) { console.error('Failed to load report settings:', e) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const savePreset = async (preset: ReportSettingsPreset, isNew = false) => {
    const { id, createdAt, updatedAt, ...data } = preset as any
    const url = isNew
      ? '/api/pocketbase-proxy/api/collections/report_settings/records'
      : `/api/pocketbase-proxy/api/collections/report_settings/records/${id}`
    const method = isNew ? 'POST' : 'PATCH'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw new Error('Save failed')
    return await res.json()
  }

  const updateSettings = async (updates: Partial<ReportSettingsPreset>) => {
    const ns = { ...settings, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
    setSettings(ns)
    setPresets(prev => prev.map(p => p.id === activeId ? ns : p))
    try { await savePreset(ns) } catch (e) { console.error('Save failed:', e) }
    onSettingsChange?.(ns)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => updateSettings({ schoolLogo: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  const handleSaveAsNew = async () => {
    const name = prompt("预设名称：")
    if (!name) return
    const np = createDefaultPreset({ ...settings, id: Date.now().toString(), name, isDefault: false })
    try {
      const saved = await savePreset(np, true)
      setPresets(prev => [...prev, { ...np, id: saved.id }])
      setActiveId(saved.id); setSettings({ ...np, id: saved.id })
    } catch (e) { console.error(e) }
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

  return (
    <div className="space-y-4">
      {/* Preset bar */}
      <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap text-sm">预设:</Label>
          <select
            value={activeId}
            onChange={e => {
              const p = presets.find(p => p.id === e.target.value)
              if (p) { setActiveId(p.id); setSettings(p); onSettingsChange?.(p) }
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            {presets.map(p => <option key={p.id} value={p.id}>{p.name}{p.isDefault ? ' ⭐' : ''}</option>)}
          </select>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={handleSaveAsNew}>另存为新预设</Button>
          <Button variant="outline" size="sm" onClick={handleSetDefault}>设为默认</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="h-3.5 w-3.5 mr-1" />预览
          </Button>
        </div>
      </div>

      {/* Settings form */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base"><Building2 className="h-4 w-4 inline mr-1" />学校信息</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">学校名称</Label><Input className="h-8 text-sm" value={settings.schoolName} onChange={e => updateSettings({ schoolName: e.target.value })} /></div>
              <div><Label className="text-xs">英文名称</Label><Input className="h-8 text-sm" value={settings.schoolNameEn} onChange={e => updateSettings({ schoolNameEn: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">地址</Label><Input className="h-8 text-sm" value={settings.schoolAddress} onChange={e => updateSettings({ schoolAddress: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">电话</Label><Input className="h-8 text-sm" value={settings.schoolPhone} onChange={e => updateSettings({ schoolPhone: e.target.value })} /></div>
              <div><Label className="text-xs">邮箱</Label><Input className="h-8 text-sm" value={settings.schoolEmail} onChange={e => updateSettings({ schoolEmail: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Logo</Label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg border-2 border-dashed border-muted bg-muted/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40"
                  onClick={() => logoSpanRef.current?.click()}>
                  {settings.schoolLogo ? <img src={settings.schoolLogo} className="w-full h-full object-contain p-1" /> : <Upload className="h-5 w-5 text-gray-400" />}
                </div>
                <div>
                  <input ref={logoSpanRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => logoSpanRef.current?.click()}><Upload className="h-3.5 w-3.5 mr-1" />上传</Button>
                  {settings.schoolLogo && <Button variant="ghost" size="sm" className="text-red-500" onClick={() => updateSettings({ schoolLogo: '' })}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base"><Palette className="h-4 w-4 inline mr-1" />样式 & 内容</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs">主色</Label>
              <input type="color" value={settings.primaryColor} onChange={e => updateSettings({ primaryColor: e.target.value })} className="w-9 h-9 rounded cursor-pointer border" />
              <Input className="h-8 text-sm w-28 font-mono" value={settings.primaryColor} onChange={e => updateSettings({ primaryColor: e.target.value })} />
            </div>
            <div><Label className="text-xs">标题</Label><Input className="h-8 text-sm" value={settings.headerTitle} onChange={e => updateSettings({ headerTitle: e.target.value })} /></div>
            <div><Label className="text-xs">副标题</Label><Input className="h-8 text-sm" value={settings.headerSubtitle} onChange={e => updateSettings({ headerSubtitle: e.target.value })} /></div>
            <div><Label className="text-xs">页脚文字</Label><Input className="h-8 text-sm" value={settings.footerText} onChange={e => updateSettings({ footerText: e.target.value })} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>报告预览 - {settings.name}</DialogTitle>
            <DialogDescription>使用当前设置生成的报告样式</DialogDescription>
          </DialogHeader>
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[70vh]">
            <iframe srcDoc={generatePreviewHTML(settings)} className="w-full border-0 bg-white rounded-lg" style={{ minHeight: 600 }} />
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-gray-400 flex items-center gap-1 border-t pt-2">
        <Save className="h-3 w-3" />自动保存 · {settings.updatedAt}
      </div>
    </div>
  )
}
