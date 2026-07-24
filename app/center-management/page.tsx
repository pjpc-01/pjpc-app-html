"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Plus, Edit, Trash2, Building, MapPin, Phone, User, Users, FileText
} from "lucide-react"

interface Center {
  id: string
  name: string
  code: string
  address: string
  phone: string
  manager: string
  status: string
}

const API_BASE = '/api/pocketbase-proxy'

export default function CenterManagementPage() {
  const { t } = useLanguage()
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCenter, setEditCenter] = useState<Center | null>(null)
  const [form, setForm] = useState({
    name: '', code: '', address: '', phone: '', manager: '', status: 'active'
  })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // PDF preset state
  const [presetForm, setPresetForm] = useState({ invoice_settings_id: '', receipt_settings_id: '', payslip_settings_id: '' })
  const [invoicePresets, setInvoicePresets] = useState<any[]>([])
  const [receiptPresets, setReceiptPresets] = useState<any[]>([])
  const [payslipPresets, setPayslipPresets] = useState<any[]>([])
  const [centerPresetsMap, setCenterPresetsMap] = useState<Record<string, any>>({})

  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/api/collections/centers/records?perPage=50&sort=name`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setCenters(data.items || [])
      
      // Also get student counts per center
      const sRes = await fetch(`${API_BASE}/api/collections/students/records?perPage=200`)
      if (sRes.ok) {
        const sData = await sRes.json()
        const counts: Record<string, number> = {}
        ;(sData.items || []).forEach((s: any) => {
          const c = s.center || '未知'
          counts[c] = (counts[c] || 0) + 1
        })
        setStudentCounts(counts)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPresets = async () => {
    try {
      const [iRes, rRes, pRes, cpRes] = await Promise.all([
        fetch(`${API_BASE}/api/collections/invoice_settings/records?perPage=50`),
        fetch(`${API_BASE}/api/collections/receipt_settings/records?perPage=50`),
        fetch(`${API_BASE}/api/collections/salary_settings/records?perPage=50`),
        fetch('/api/center-presets'),
      ])
      if (iRes.ok) { const d = await iRes.json(); setInvoicePresets(d.items || []) }
      if (rRes.ok) { const d = await rRes.json(); setReceiptPresets(d.items || []) }
      if (pRes.ok) { const d = await pRes.json(); setPayslipPresets(d.items || []) }
      if (cpRes.ok) {
        const d = await cpRes.json()
        setCenterPresetsMap(d.data || {})
      }
    } catch {}
  }

  useEffect(() => { fetchCenters(); fetchPresets() }, [fetchCenters])

  const openAdd = () => {
    setEditCenter(null)
    setForm({ name: '', code: '', address: '', phone: '', manager: '', status: 'active' })
    setPresetForm({ invoice_settings_id: '', receipt_settings_id: '', payslip_settings_id: '' })
    setDialogOpen(true)
  }

  const openEdit = (c: Center) => {
    setEditCenter(c)
    setForm({
      name: c.name || '',
      code: c.code || '',
      address: c.address || '',
      phone: c.phone || '',
      manager: c.manager || '',
      status: c.status || 'active',
    })
    const cp = centerPresetsMap[c.code] || {}
    setPresetForm({ invoice_settings_id: cp.invoice_settings_id || '', receipt_settings_id: cp.receipt_settings_id || '', payslip_settings_id: cp.payslip_settings_id || '' })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const method = editCenter ? 'PATCH' : 'POST'
      const url = editCenter
        ? `${API_BASE}/api/collections/centers/records/${editCenter.id}`
        : `${API_BASE}/api/collections/centers/records`
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const saved = await res.json()
      const centerCode = saved.code || editCenter?.code || form.code

      // Save center presets via API
      if (centerCode) {
        await fetch('/api/center-presets', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...presetForm, center_id: centerCode }),
        })
      }

      setDialogOpen(false)
      fetchCenters()
      fetchPresets()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`${API_BASE}/api/collections/centers/records/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDeleteId(null)
      fetchCenters()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              分行管理
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              管理所有分行信息，查看各分行学生人数
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加分行
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              加载中...
            </div>
          ) : centers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>暂无分行数据</p>
              <p className="text-sm mt-1">点击上方按钮添加第一个分行</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分行名称</TableHead>
                    <TableHead>代码</TableHead>
                    <TableHead>负责人</TableHead>
                    <TableHead>{t('report.phone')}</TableHead>
                    <TableHead>{t('teacher.address')}</TableHead>
                    <TableHead>发票预设</TableHead>
                    <TableHead>收据预设</TableHead>
                    <TableHead>工资单预设</TableHead>
                    <TableHead>学生数</TableHead>
                    <TableHead>{t('teacher.status')}</TableHead>
                    <TableHead className="w-20">{t('teacher.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs">{c.code || '-'}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          {c.manager || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {c.phone || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                          {c.address || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{invoicePresets.find(p => p.id === centerPresetsMap[c.code]?.invoice_settings_id)?.name || '未设置'}</TableCell>
                      <TableCell className="text-xs text-gray-500">{receiptPresets.find(p => p.id === centerPresetsMap[c.code]?.receipt_settings_id)?.name || '未设置'}</TableCell>
                      <TableCell className="text-xs text-gray-500">{payslipPresets.find(p => p.id === centerPresetsMap[c.code]?.payslip_settings_id)?.name || '未设置'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50">
                          <Users className="h-3 w-3 mr-1" />
                          {studentCounts[c.name] || studentCounts[c.code] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>
                          {c.status === 'active' ? '营业中' : '已关闭'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteId(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCenter ? '编辑分行' : '添加分行'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">名称 *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="col-span-3"
                placeholder="例: PU1 分院"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">代码</Label>
              <Input
                value={form.code}
                onChange={e => setForm({...form, code: e.target.value})}
                className="col-span-3"
                placeholder="例: PU1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">负责人</Label>
              <Input
                value={form.manager}
                onChange={e => setForm({...form, manager: e.target.value})}
                className="col-span-3"
                placeholder="负责人姓名"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('report.phone')}</Label>
              <Input
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className="col-span-3"
                placeholder="分行电话"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('teacher.address')}</Label>
              <Input
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                className="col-span-3"
                placeholder="分行地址"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('teacher.status')}</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">营业中</SelectItem>
                  <SelectItem value="inactive">{t('center.disabled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PDF Preset Selectors */}
            <div className="col-span-4 border-t pt-4 mt-2">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><FileText className="h-4 w-4" />PDF 预设方案</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">发票预设</Label>
                  <select className="col-span-3 border rounded-md px-3 py-2 text-sm" value={presetForm.invoice_settings_id} onChange={e => setPresetForm({...presetForm, invoice_settings_id: e.target.value})}>
                    <option value="">不使用预设</option>
                    {invoicePresets.map((p: any) => <option key={p.id} value={p.id}>{p.name || '未命名'}{p.isDefault ? ' (默认)' : ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">收据预设</Label>
                  <select className="col-span-3 border rounded-md px-3 py-2 text-sm" value={presetForm.receipt_settings_id} onChange={e => setPresetForm({...presetForm, receipt_settings_id: e.target.value})}>
                    <option value="">不使用预设</option>
                    {receiptPresets.map((p: any) => <option key={p.id} value={p.id}>{p.name || '未命名'}{p.isDefault ? ' (默认)' : ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">工资单预设</Label>
                  <select className="col-span-3 border rounded-md px-3 py-2 text-sm" value={presetForm.payslip_settings_id} onChange={e => setPresetForm({...presetForm, payslip_settings_id: e.target.value})}>
                    <option value="">不使用预设</option>
                    {payslipPresets.map((p: any) => <option key={p.id} value={p.id}>{p.name || '未命名'}{p.isDefault ? ' (默认)' : ''}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('report.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('course.confirm_delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">确定要删除这个分行吗？此操作不可撤销。</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t('report.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDelete}>{t('card.delete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
