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
import { useCompanyProfile } from "@/lib/company-profile"
import { useLanguage } from "@/contexts/language-context"

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
  const { t } = useLanguage()
  const role = userProfile?.role || ""
  const isMgmt = ["admin", "accountant", "supervisor"].includes(role)
  const { claims, loading, error, create, update, remove, setStatus, fetchClaims } = useClaimForms()
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
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const [view, setView] = useState<ClaimForm | null>(null)
  const [printHtml, setPrintHtml] = useState("")
  const printRef = useRef<HTMLIFrameElement>(null)
  const [memoId, setMemoId] = useState<string | null>(null)
  const [comment, setComment] = useState("")

  const { profile: company } = useCompanyProfile()
  useEffect(() => { if (view) setPrintHtml(generateClaimFormHTML(view, company)) }, [view, company])

  const tot = (form.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0)

  const openNew = () => {
    setEditId(null)
    setForm({ claimant: userProfile?.name || "", position: "", center: "", claim_no: "", fill_date: new Date().toISOString().split("T")[0], period: "", items: [emptyItem()], total: 0, notes: "", status: "draft", created_by: user?.id || "", created_by_name: userProfile?.name || "", supervisor_comment: "", finance_comment: "", supervisor_at: "", finance_at: "" })
    setFiles([])
    setOpen(true)
  }
  const openEdit = (c: ClaimForm) => {
    setEditId(c.id)
    setFiles([])
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

  /** 依 B21 要求：编号/No. 自动生成，收据可直接上传图片或 PDF */
  const save = async (submit: boolean) => {
    setSaving(true)
    try {
      // No. 自动 1,2,3…
      const items = (form.items || []).map((it, i) => ({ ...it, no: String(i + 1) }))

      // 报销编号自动生成：CLM-YYYYMM-流水
      let claim_no = form.claim_no
      if (!editId && !claim_no) {
        const ym = String(form.fill_date || new Date().toISOString().split("T")[0]).slice(0, 7).replace("-", "")
        const used = claims
          .filter(c => String(c.claim_no || "").startsWith(`CLM-${ym}-`))
          .map(c => Number(String(c.claim_no).split("-").pop()) || 0)
        const seq = (used.length ? Math.max(...used) : 0) + 1
        claim_no = `CLM-${ym}-${String(seq).padStart(3, "0")}`
      }

      const payload = { ...form, items, claim_no, total: tot, status: submit ? ("submitted" as ClaimStatus) : form.status }
      const rec: any = editId ? await update(editId, payload as any) : await create(payload as any)

      // 收据上传（有选文件才做）
      if (files.length && rec?.id) {
        setUploading(true)
        const fd = new FormData()
        fd.append("id", rec.id)
        files.forEach(f => fd.append("files", f, f.name))
        const ur = await fetch("/api/teacher-claim/upload", { method: "POST", body: fd })
        const ud = await ur.json().catch(() => ({}))
        if (!ur.ok || ud?.success === false) {
          alert(t("单子已保存，但收据上传失败") + "：" + (ud?.error || ur.status))
        }
        setFiles([])
        // 关键：重新拉一次列表，否则「查看」还是上传前的旧数据（看不到收据）
        await fetchClaims()
      }
      await fetchClaims()
      setOpen(false)
    } catch (e: any) { alert(t("保存失败") + ": " + (e?.message || e)) } finally { setSaving(false); setUploading(false) }
  }

  const openView = (c: ClaimForm) => { setView(c); setComment(""); setMemoId(null) }
  const print = () => {
    const iframe = printRef.current
    try {
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        return
      }
    } catch { /* 落到下面的兜底 */ }
    // 兜底：开新窗口打印（iframe 被浏览器挡时用）
    const w = window.open("", "_blank")
    if (!w) { alert(t("浏览器拦了弹窗，请允许后再按一次")); return }
    w.document.write(printHtml)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }
  const doApprove = async (status: ClaimStatus, role2: "supervisor" | "finance") => {
    if (!view) return
    await setStatus(view.id, status, comment, role2)
    setView({ ...view, status, [role2 === "supervisor" ? "supervisor_comment" : "finance_comment"]: comment })
    setComment("")
  }

  return (
    <PageLayout title={t("员工费用报销单")} description={t("报销单管理与审批，提交后经主管、财务审批")} userRole={role as any} status={t("系统正常")} background="bg-gray-50">
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-sm text-gray-600">{t("共")} <b>{visible.length}</b> {t("份报销单")} · {isMgmt ? t("管理全部") : t("查看自己提交的")}</div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />{t("新增报销单")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-gray-500">{t("暂无报销单，点击右上角「新增」开始")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("报销人")}</TableHead><TableHead>{t("编号")}</TableHead><TableHead>{t("中心")}</TableHead>
                  <TableHead className="text-right">{t("金额")}</TableHead><TableHead>{t("状态")}</TableHead><TableHead className="text-right">{t("操作")}</TableHead>
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
                      <Button size="sm" variant="outline" onClick={() => openView(c)}><Eye className="h-3.5 w-3.5 mr-1" />{t("查看")}</Button>
                      {isMgmt && <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pen className="h-3.5 w-3.5 mr-1" />{t("编辑")}</Button>}
                      {isMgmt && (<Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm(t("确定删除这份报销单？"))) remove(c.id) }}><Trash2 className="h-3.5 w-3.5" /></Button>)}
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
            <DialogTitle>{editId ? t("编辑报销单") : t("新增报销单")}</DialogTitle>
            <DialogDescription>{t("填妥信息与明细，可存草稿或直接提交审批")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("报销人")}</Label><Input value={form.claimant} onChange={e => upd({ claimant: e.target.value })} /></div>
              <div>
                <Label>{t("职位")}</Label>
                <select className="h-9 w-full rounded-md border px-2 text-sm" value={form.position} onChange={e => upd({ position: e.target.value })}>
                  <option value="">{t("选择职位")}</option>
                  {["院长", "主任", "老师", "行政", "会计", "其他"].map(x => <option key={x} value={x}>{t(x)}</option>)}
                </select>
              </div>
              <div>
                <Label>{t("中心 / 部门")}</Label>
                <select className="h-9 w-full rounded-md border px-2 text-sm" value={form.center} onChange={e => upd({ center: e.target.value })}>
                  <option value="">{t("选择中心")}</option>
                  <option value="PU1">PU1</option>
                  <option value="BATU14">BATU14</option>
                  <option value="办公室">{t("办公室")}</option>
                </select>
              </div>
              <div>
                <Label>{t("报销编号")}</Label>
                <Input value={form.claim_no} readOnly className="bg-gray-50" placeholder={t("提交时自动生成")} />
                <p className="mt-1 text-[11px] text-muted-foreground">{t("系统自动给号，不用自己填")}</p>
              </div>
              <div><Label>{t("填表日期")}</Label><Input type="date" value={form.fill_date} onChange={e => upd({ fill_date: e.target.value })} /></div>
              <div>
                <Label>{t("报销期间")}</Label>
                <Input value={form.period} onChange={e => upd({ period: e.target.value })} placeholder="7-10/2026" />
                <p className="mt-1 text-[11px] text-muted-foreground">{t("这张单涵盖哪段时间的支出。例：7-10/2026 = 7 月到 10 月")}</p>
              </div>
            </div>

            <div>
              <Label className="mb-1">{t("明细")}</Label>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-12">No.</TableHead><TableHead className="w-28">{t("日期")}</TableHead>
                    <TableHead>{t("项目/用途")}</TableHead><TableHead className="w-24">{t("金额")}</TableHead>
                    <TableHead className="w-20">{t("收据")}</TableHead><TableHead className="w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(form.items || []).map((it, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-center text-sm text-muted-foreground">{i + 1}</TableCell>
                        <TableCell><Input className="h-8" type="date" value={it.date} onChange={e => setItem(i, { date: e.target.value })} /></TableCell>
                        <TableCell><Input className="h-8" value={it.desc} onChange={e => setItem(i, { desc: e.target.value })} /></TableCell>
                        <TableCell><Input className="h-8" type="number" step="0.01" value={it.amount} onChange={e => setItem(i, { amount: Number(e.target.value) })} /></TableCell>
                        <TableCell className="text-center"><input type="checkbox" checked={!!it.receipt} onChange={e => setItem(i, { receipt: e.target.checked })} /></TableCell>
                        <TableCell><Button size="sm" variant="ghost" className="text-red-600 h-8" onClick={() => delItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />{t("加一行")}</Button>
              <div className="mt-2 text-right font-semibold text-blue-700">{t("合计")}{t("：RM")} {tot.toFixed(2)}</div>

              <div className="mt-3 rounded-lg border p-3">
                <Label className="mb-1 block">{t("收据照片 / PDF（最多 10 个，单个 ≤50MB）")}</Label>
                <input
                  type="file" multiple accept="image/*,application/pdf"
                  className="text-xs file:mr-2 file:rounded-md file:border file:bg-white file:px-3 file:py-1.5 file:text-xs"
                  onChange={e => {
                    const picked = Array.from(e.target.files || [])
                    const big = picked.find(f => f.size > 50 * 1024 * 1024)
                    if (big) { alert(big.name + " " + t("超过 50MB")); return }
                    setFiles(prev => [...prev, ...picked].slice(0, 10))
                    e.target.value = ""
                  }}
                />
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded border bg-gray-50 px-2 py-1 text-xs">
                        {f.name.length > 26 ? f.name.slice(0, 24) + "…" : f.name}
                        <button type="button" className="text-gray-500 hover:text-red-600" onClick={() => setFiles(prev => prev.filter((_, k) => k !== i))}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                {uploading && <div className="mt-1 text-xs text-blue-600">{t("上传中…")}</div>}
              </div>
            </div>

            <div><Label>{t("备注 / 附注")}</Label><Textarea value={form.notes} onChange={e => upd({ notes: e.target.value })} rows={2} /></div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{t("取消")}</Button>
              <Button variant="outline" disabled={saving} onClick={() => save(false)}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}{t("存草稿")}</Button>
              <Button disabled={saving} onClick={() => save(true)}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}{t("提交审批")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View / approve */}
      <Dialog open={!!view} onOpenChange={o => { if (!o) setView(null) }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("报销单")} #{view?.claim_no || ""}</DialogTitle>
            <DialogDescription>{t("预览 + 打印 + 审批")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button size="sm" onClick={print}><Printer className="h-3.5 w-3.5 mr-1" />{t("打印 / 存 PDF")}</Button>
          </div>
          <iframe ref={printRef as any} srcDoc={printHtml} className="w-full border rounded-lg bg-white" style={{ minHeight: "700px", height: "auto" }} title={t("报销单")} sandbox="allow-same-origin allow-modals" />

          {view && Array.isArray((view as any).receipts) && (view as any).receipts.length > 0 && (
            <div className="mt-3 rounded-lg border p-3">
              <Label className="mb-2 block">{t("收据")} ({(view as any).receipts.length})</Label>
              <div className="flex flex-wrap gap-2">
                {((view as any).receipts as string[]).map((fn: string) => {
                  const url = `/api/pocketbase-proxy/api/files/claim_forms/${view.id}/${encodeURIComponent(fn)}`
                  const isPdf = fn.toLowerCase().endsWith(".pdf")
                  return isPdf ? (
                    <a key={fn} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline break-all">{fn}</a>
                  ) : (
                    <a key={fn} href={url} target="_blank" rel="noreferrer" title={fn}>
                      <img src={url} alt={fn} className="h-24 w-24 rounded border object-cover" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {isMgmt && view && (
            <div className="mt-4 rounded-lg border p-3 space-y-2">
              <Label>{t("审批意见")}</Label>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder={t("输入批注意见（可选）")} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-blue-700" onClick={() => doApprove("supervisor_approved", "supervisor")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />{t("主管批准")}</Button>
                <Button size="sm" variant="outline" className="text-green-700" onClick={() => doApprove("finance_approved", "finance")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />{t("财务批准")}</Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => doApprove("rejected", view.status === "submitted" ? "supervisor" : "finance")}><XCircle className="h-3.5 w-3.5 mr-1" />{t("驳回")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}