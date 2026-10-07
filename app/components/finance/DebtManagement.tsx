"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { Plus, Pencil, Trash2, Landmark, Wallet, TrendingDown, CalendarClock, HandCoins, Loader2 } from "lucide-react"

interface Debt {
  id: string
  name: string
  type?: string
  principal: number
  monthlyAmount?: number
  paymentDay?: number
  startDate?: string
  dueDate?: string
  status?: string
  note?: string
  voucher_no?: string
  paid: number
  remaining: number
  progress: number
  paymentCount: number
  lastPayment?: string
}

interface Payment {
  id: string
  debtId: string
  date: string
  amount: number
  note?: string
}

const rm = (n: number) => `RM ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_LABEL: Record<string, string> = { active: "进行中", settled: "已还清", paused: "暂停" }
const STATUS_CLASS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  settled: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
}

export default function DebtManagement() {
  const { t } = useLanguage()
  const [debts, setDebts] = useState<Debt[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [form, setForm] = useState<any>({ name: "", type: "", principal: "", monthlyAmount: "", paymentDay: "", startDate: "", dueDate: "", status: "active", note: "", voucher_no: "" })

  const [payOpen, setPayOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<Debt | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [payForm, setPayForm] = useState<any>({ date: new Date().toISOString().slice(0, 10), amount: "", note: "" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/finance/debts", { cache: "no-store" })
      const d = await r.json()
      if (d.success) {
        setDebts(d.data.debts || [])
        setSummary(d.data.summary)
        setTypes(d.data.types || [])
        setError("")
      } else {
        setError(d.error || "读取失败")
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ name: "", type: "", principal: "", monthlyAmount: "", paymentDay: "", startDate: new Date().toISOString().slice(0, 10), dueDate: "", status: "active", note: "", voucher_no: "" })
    setEditOpen(true)
  }

  const openEdit = (d: Debt) => {
    setEditing(d)
    setForm({
      name: d.name, type: d.type || "", principal: String(d.principal ?? ""), monthlyAmount: String(d.monthlyAmount ?? ""),
      paymentDay: d.paymentDay ? String(d.paymentDay) : "", startDate: (d.startDate || "").slice(0, 10), dueDate: (d.dueDate || "").slice(0, 10),
      status: d.status || "active", note: d.note || "", voucher_no: d.voucher_no || "",
    })
    setEditOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) { setError(t("名称必填")); return }
    setSaving(true)
    try {
      const url = editing ? `/api/finance/debts?id=${editing.id}` : "/api/finance/debts"
      const r = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const d = await r.json()
      if (!d.success) { setError(d.error || "保存失败"); return }
      setEditOpen(false)
      await load()
    } finally { setSaving(false) }
  }

  const remove = async (d: Debt) => {
    if (!confirm(`确定删除「${d.name}」？（软删除，可恢复）`)) return
    await fetch(`/api/finance/debts?id=${d.id}`, { method: "DELETE" })
    await load()
  }

  const openPay = async (d: Debt) => {
    setPayTarget(d)
    setPayForm({ date: new Date().toISOString().slice(0, 10), amount: d.monthlyAmount ? String(d.monthlyAmount) : "", note: "" })
    setPayOpen(true)
    const r = await fetch(`/api/finance/debt-payments?debtId=${d.id}`, { cache: "no-store" })
    const j = await r.json()
    setPayments(j.data || [])
  }

  const savePay = async () => {
    if (!payTarget) return
    const amt = Number(payForm.amount) || 0
    if (amt <= 0) { setError(t("还款金额要大于 0")); return }
    setSaving(true)
    try {
      const r = await fetch("/api/finance/debt-payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debtId: payTarget.id, date: payForm.date, amount: amt, note: payForm.note }),
      })
      const d = await r.json()
      if (!d.success) { setError(d.error || "记录失败"); return }
      setPayOpen(false)
      await load()
    } finally { setSaving(false) }
  }

  const delPay = async (p: Payment) => {
    if (!confirm(t("删除这条还款记录？（软删除）"))) return
    await fetch(`/api/finance/debt-payments?id=${p.id}`, { method: "DELETE" })
    if (payTarget) { const r = await fetch(`/api/finance/debt-payments?debtId=${payTarget.id}`, { cache: "no-store" }); const j = await r.json(); setPayments(j.data || []) }
    await load()
  }

  const cards = [
    { label: t("债务总额"), value: rm(summary?.totalPrincipal ?? 0), sub: `${summary?.count ?? 0} ${t("笔")} · ${t("进行中")} ${summary?.activeCount ?? 0}`, icon: Landmark, cls: "bg-rose-500" },
    { label: t("已还合计"), value: rm(summary?.totalPaid ?? 0), sub: t("累计还款"), icon: HandCoins, cls: "bg-emerald-500" },
    { label: t("剩余欠款"), value: rm(summary?.totalRemaining ?? 0), sub: t("本金 − 已还"), icon: TrendingDown, cls: "bg-amber-500" },
    { label: t("每月应还"), value: rm(summary?.monthlyTotal ?? 0), sub: t("进行中的债务合计"), icon: CalendarClock, cls: "bg-blue-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${c.cls}`}><c.icon className="h-5 w-5 text-white" /></div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{t(c.label)}</p>
                <p className="text-xl font-bold truncate">{c.value}</p>
                <p className="text-[11px] text-gray-400">{c.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t("还款只记在这里，不会进「支出」，避免影响经营成本与利润")}</p>
        <Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" />{t("加债务")}</Button>
      </div>

      {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

      <Card className="border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("名称")}</TableHead>
                <TableHead>{t("类型")}</TableHead>
                <TableHead className="text-right">{t("本金")}</TableHead>
                <TableHead className="text-right">{t("每月应还")}</TableHead>
                <TableHead>{t("还款日")}</TableHead>
                <TableHead className="text-right">{t("已还")}</TableHead>
                <TableHead className="text-right">{t("剩余")}</TableHead>
                <TableHead className="w-[140px]">{t("进度")}</TableHead>
                <TableHead>{t("状态")}</TableHead>
                <TableHead className="text-right">{t("操作")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-500"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />{t("加载中...")}</TableCell></TableRow>
              ) : debts.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-10 text-gray-500">{t("暂无债务，点右上「加债务」登记第一笔")}</TableCell></TableRow>
              ) : debts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}{d.note ? <span className="block text-[11px] text-gray-400">{d.note}</span> : null}</TableCell>
                  <TableCell>{d.type ? <Badge variant="outline">{d.type}</Badge> : <span className="text-gray-400">—</span>}</TableCell>
                  <TableCell className="text-right">{rm(d.principal)}</TableCell>
                  <TableCell className="text-right">{d.monthlyAmount ? rm(d.monthlyAmount) : "—"}</TableCell>
                  <TableCell>{d.paymentDay ? `${d.paymentDay} 号` : "—"}</TableCell>
                  <TableCell className="text-right text-emerald-700">{rm(d.paid)}</TableCell>
                  <TableCell className="text-right text-rose-700">{rm(d.remaining)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${d.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{d.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge className={STATUS_CLASS[d.status || "active"]}>{STATUS_LABEL[d.status || "active"]}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => openPay(d)} title={t("记录还款")}><HandCoins className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(d)} title={t("编辑")}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" className="text-rose-600" onClick={() => remove(d)} title={t("删除")}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增 / 编辑 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("编辑债务") : t("加债务")}</DialogTitle>
            <DialogDescription>{t("本金 = 总欠款；每月应还 = 一个月还多少")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>{t("名称")} *</Label>
              <Input value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder={t("如：BSN 装修贷款")} />
            </div>
            <div className="col-span-2">
              <Label>{t("类型")}</Label>
              <Input list="debt-type-list" value={form.type} onChange={(e) => setForm((p: any) => ({ ...p, type: e.target.value }))} placeholder={t("自由填写，如：银行贷款 / 车贷 / 个人借款 / 信用卡")} />
              <datalist id="debt-type-list">
                {types.map((tp) => <option key={tp} value={tp} />)}
              </datalist>
            </div>
            <div>
              <Label>{t("本金")}</Label>
              <Input type="number" step="0.01" inputMode="decimal" value={form.principal} onChange={(e) => setForm((p: any) => ({ ...p, principal: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <Label>{t("每月应还")}</Label>
              <Input type="number" step="0.01" inputMode="decimal" value={form.monthlyAmount} onChange={(e) => setForm((p: any) => ({ ...p, monthlyAmount: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <Label>{t("每月还款日")}</Label>
              <Input type="number" min={1} max={31} value={form.paymentDay} onChange={(e) => setForm((p: any) => ({ ...p, paymentDay: e.target.value }))} placeholder={t("几号（1-31）")} />
            </div>
            <div>
              <Label>{t("状态")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p: any) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("进行中")}</SelectItem>
                  <SelectItem value="paused">{t("暂停")}</SelectItem>
                  <SelectItem value="settled">{t("已还清")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("开始日期")}</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm((p: any) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <Label>{t("到期日")}</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((p: any) => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>{t("备注")}</Label>
              <Input value={form.note} onChange={(e) => setForm((p: any) => ({ ...p, note: e.target.value }))} placeholder={t("可选")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("取消")}</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}{t("保存")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 记录还款 */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("记录还款")} · {payTarget?.name}</DialogTitle>
            <DialogDescription>
              {t("已还")} {rm(payTarget?.paid ?? 0)} / {rm(payTarget?.principal ?? 0)} · {t("剩余")} {rm(payTarget?.remaining ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("日期")}</Label>
              <Input type="date" value={payForm.date} onChange={(e) => setPayForm((p: any) => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <Label>{t("金额")}</Label>
              <Input type="number" step="0.01" inputMode="decimal" value={payForm.amount} onChange={(e) => setPayForm((p: any) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="col-span-2">
              <Label>{t("备注")}</Label>
              <Input value={payForm.note} onChange={(e) => setPayForm((p: any) => ({ ...p, note: e.target.value }))} placeholder={t("可选，如：10 月分期")} />
            </div>
          </div>
          {payments.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-500">{(p.date || "").slice(0, 10)}</span>
                  <span className="font-medium">{rm(p.amount)}</span>
                  <span className="text-gray-400 text-xs truncate max-w-[120px]">{p.note || ""}</span>
                  <Button size="sm" variant="ghost" className="text-rose-600 h-7" onClick={() => delPay(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>{t("关闭")}</Button>
            <Button onClick={savePay} disabled={saving}>{t("记一笔还款")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
