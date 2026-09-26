"use client"

import React, { useState, useRef, useEffect } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Printer, Eye, Pen, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useClaimForms, type ClaimForm, type ClaimItem, CLAIM_STATUS_LABEL, type ClaimStatus } from "@/hooks/useClaimForms"
import { generateClaimFormHTML } from "@/lib/claim-form-pdf"

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-200 text-gray-700",
  submitted: "bg-amber-100 text-amber-700",
  supervisor_approved: "bg-blue-100 text-blue-700",
  finance_approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

const emptyItem = (): ClaimItem => ({ no: "", date: "", desc: "", amount: 0, note: "", receipt: false })

export default function ClaimFormPage() {
  const { userProfile, user } = useAuth()
  const role = userProfile?.role || ""
  const isMgmt = ["admin", "accountant", "supervisor"].includes(role)
  const { claims, loading, error, create, update, remove, setStatus } = useClaimForms()
  const visible = isMgmt ? claims : claims.filter(c => c.created_by === (user?.id || ""))

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<ClaimForm, "id" | "created" | "updated"> & { items: ClaimItem[] }>({
    claimant: userProfile?.name || "", position: "", center: "", claim_no: "",
    fill_date: "", period: "", items: [emptyItem()], total: 0, notes: "",
    status: "draft", created_by: user?.id || "", created_by_name: userProfile?.name || "",
    supervisor_comment: "", finance_comment: "", supervisor_at: "", finance_at: "",
  })
  const [saving, setSaving] = useState(false)

  const [view, setView] = useState<ClaimForm | null>(null)
  const [printHtml, setPrintHtml] = useState("")
  const printRef = useRef<HTMLIFrameElement>(null)
  const [memoId, setMemoId] = useState<string | null>(null)
  const [comment, setComment] = useState("")

  useEffect(() => { if (view) setPrintHtml(generateClaimFormHTML(view)) }, [view])

  const tot = (form.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0)

  const openNew = () => {
    setEditId(null)
    setForm({ claimant: userProfile?.name || "", position: "", center: "", claim_no: "", fill_date: new Date().toISOString().split("T")[0], period: "", items: [emptyItem()], total: 0, notes: "", status: "draft", created_by: user?.id || "", created_by_name: userProfile?.name || "", supervisor_comment: "", finance_comment: "", supervisor_at: "", finance_at: "" })
    setOpen(true)
  }
  const openEdit = (c: ClaimForm) => {
    setEditId(c.id)
    setForm({ ...c, items: (Array.isArray(c.items) && c.items.length ? c.items : [emptyItem()]) })
    setOpen(true)
  }
  const upd = (p: Partial<typeof form>) => setForm(f => ({ ...f, ...p }))
  const setItem = (i: number, p: Partial<ClaimItem>) => {
    const items = form.items.map((it, idx) => idx === i ? { ...it, ...p } : it)
    upd({ items })
  }
  const addItem = () => upd({ items: [...form.items, emptyItem()] })
  const delItem = (i: number) => upd({ items: form.items.filter((_, idx) => idx !== i) })

  const save = async (submit: boolean) => {
    setSaving(true)
    try {
      const payload = { ...form, items: form.items, total: tot, status: submit ? ("submitted" as ClaimStatus) : form.status }
      if (editId) await update(editId, payload as any)
      else await create(payload as any)
      setOpen(false)
    } catch (e: any) { alert("保存失败: " + (e?.message || e)) } finally { setSaving(false) }
  }

  const openView = (c: ClaimForm) => { setView(c); setComment(""); setMemoId(null) }
  const print = () => {
    const iframe = printRef.current
    if (iframe?.contentWindow) iframe.contentWindow.print()
    else window.print()
  }
  const doApprove = async (status: ClaimStatus, role2: "supervisor" | "finance") => {
    if (!view) return
    await setStatus(view.id, status, comment, role2)
    setView({ ...view, status, [role2 === "supervisor" ? "supervisor_comment" : "finance_comment"]: comment })
    setComment("")
  }

  return (
    <PageLayout title="员工费用报销单" description="报销单管理与审批，提交后经主管、财务审批" userRole={role as any} status="系统正常" background="bg-gray-50">
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-sm text-gray-600">共 <b>{visible.length}</b> 份报销单 · {isMgmt ? "管理全部" : "查看自己提交的"}</div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />新增报销单</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-gray-500">暂无报销单，点击右上角「新增」开始</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报销人</TableHead><TableHead>编号</TableHead><TableHead>中心</TableHead>
                  <TableHead className="text-right">金额</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.claimant || "-"}</TableCell>
                    <TableCell>{c.claim_no || "-"}</TableCell>
                    <TableCell>{c.center || "-"}</TableCell>
                    <TableCell className="text-right">RM {Number(c.total || 0).toFixed(2)}</TableCell>
                    <TableCell><Badge className={STATUS_COLOR[c.status] || ""}>{CLAIM_STATUS_LABEL[c.status] || c.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => openView(c)}><Eye className="h-3.5 w-3.5 mr-1" />查看</Button>
                      {isMgmt && <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pen className="h-3.5 w-3.5 mr-1" />编辑</Button>}
                      {isMgmt && (<Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm("确定删除这份报销单？")) remove(c.id) }}><Trash2 className="h-3.5 w-3.5" /></Button>)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editId ? "编辑报销单" : "新增报销单"}</DialogTitle>
            <DialogDescription>填妥信息与明细，可存草稿或直接提交审批</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>报销人</Label><Input value={form.claimant} onChange={e => upd({ claimant: e.target.value })} /></div>
              <div><Label>职位</Label><Input value={form.position} onChange={e => upd({ position: e.target.value })} /></div>
              <div><Label>中心 / 部门</Label><Input value={form.center} onChange={e => upd({ center: e.target.value })} /></div>
              <div><Label>报销编号</Label><Input value={form.claim_no} onChange={e => upd({ claim_no: e.target.value })} placeholder="如 CL-0001" /></div>
              <div><Label>填表日期</Label><Input type="date" value={form.fill_date} onChange={e => upd({ fill_date: e.target.value })} /></div>
              <div><Label>报销期间</Label><Input value={form.period} onChange={e => upd({ period: e.target.value })} placeholder="如 2026年9月" /></div>
            </div>

            <div>
              <Label className="mb-1">明细</Label>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-12">No.</TableHead><TableHead className="w-28">日期</TableHead>
                    <TableHead>项目/用途</TableHead><TableHead className="w-24">金额</TableHead>
                    <TableHead className="w-20">收据</TableHead><TableHead className="w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(form.items || []).map((it, i) => (
                      <TableRow key={i}>
                        <TableCell><Input className="h-8" value={it.no} onChange={e => setItem(i, { no: e.target.value })} /></TableCell>
                        <TableCell><Input className="h-8" type="date" value={it.date} onChange={e => setItem(i, { date: e.target.value })} /></TableCell>
                        <TableCell><Input className="h-8" value={it.desc} onChange={e => setItem(i, { desc: e.target.value })} /></TableCell>
                        <TableCell><Input className="h-8" type="number" value={it.amount} onChange={e => setItem(i, { amount: Number(e.target.value) })} /></TableCell>
                        <TableCell className="text-center"><input type="checkbox" checked={!!it.receipt} onChange={e => setItem(i, { receipt: e.target.checked })} /></TableCell>
                        <TableCell><Button size="sm" variant="ghost" className="text-red-600 h-8" onClick={() => delItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />加一行</Button>
              <div className="mt-2 text-right font-semibold text-blue-700">合计：RM {tot.toFixed(2)}</div>
            </div>

            <div><Label>备注 / 附注</Label><Textarea value={form.notes} onChange={e => upd({ notes: e.target.value })} rows={2} /></div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button variant="outline" disabled={saving} onClick={() => save(false)}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}存草稿</Button>
              <Button disabled={saving} onClick={() => save(true)}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}提交审批</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View / approve */}
      <Dialog open={!!view} onOpenChange={o => { if (!o) setView(null) }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>报销单 #{view?.claim_no || ""}</DialogTitle>
            <DialogDescription>预览 + 打印 + 审批</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button size="sm" onClick={print}><Printer className="h-3.5 w-3.5 mr-1" />打印 / 存 PDF</Button>
          </div>
          <iframe ref={printRef as any} srcDoc={printHtml} className="w-full border rounded-lg bg-white" style={{ minHeight: "700px", height: "auto" }} title="报销单" sandbox="allow-same-origin" />

          {isMgmt && view && (
            <div className="mt-4 rounded-lg border p-3 space-y-2">
              <Label>审批意见</Label>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="输入批注意见（可选）" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-blue-700" onClick={() => doApprove("supervisor_approved", "supervisor")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />主管批准</Button>
                <Button size="sm" variant="outline" className="text-green-700" onClick={() => doApprove("finance_approved", "finance")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />财务批准</Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => doApprove("rejected", view.status === "submitted" ? "supervisor" : "finance")}><XCircle className="h-3.5 w-3.5 mr-1" />驳回</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}