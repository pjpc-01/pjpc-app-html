"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/contexts/language-context"
import { Wallet, Plus, Trash2, AlertCircle, CheckCircle2, Clock, Camera, X } from "lucide-react"

/**
 * 老师报销单：提交 + 我的记录。
 *
 * 像请假单一样由老师自己在工作台填，提交后院长审批。
 * ⛔ 不牵涉账目 —— 只是留一张单 + 状态，不写任何会计集合、不自动记账。
 */

const CATEGORIES = ["教材", "文具", "活动", "交通", "餐饮", "其他"]

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  submitted: "待审批",
  supervisor_approved: "已批准",
  finance_approved: "已批准",
  rejected: "已驳回",
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-amber-100 text-amber-700",
  supervisor_approved: "bg-green-100 text-green-700",
  finance_approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

type Row = { date: string; category: string; desc: string; receipt_no: string; amount: string }

const emptyRow = (): Row => ({ date: "", category: "教材", desc: "", receipt_no: "", amount: "" })

const MAX_FILES = 10
const MAX_SIZE = 50 * 1024 * 1024

export default function TeacherClaimPanel({ teacherId }: { teacherId: string }) {
  const { t } = useLanguage()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [period, setPeriod] = useState("")
  const [center, setCenter] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<Row[]>([emptyRow()])
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState("")
  const [ok, setOk] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const r = await fetch("/api/teacher-claim", { cache: "no-store" })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d?.success === false) throw new Error(d?.error || `HTTP ${r.status}`)
      setRows(d?.data || [])
      setError("")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const now = new Date()
    setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    load()
  }, [teacherId])

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0)

  const setRow = (i: number, p: Partial<Row>) =>
    setItems(prev => prev.map((it, idx) => (idx === i ? { ...it, ...p } : it)))
  const addRow = () => setItems(prev => [...prev, emptyRow()])
  const delRow = (i: number) => setItems(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  const pickFiles = (list: FileList | null) => {
    if (!list) return
    const picked = Array.from(list)
    const tooBig = picked.find(f => f.size > MAX_SIZE)
    if (tooBig) { setMsg(`${tooBig.name} ${t("超过 50MB")}`); setOk(false); return }
    setFiles(prev => [...prev, ...picked].slice(0, MAX_FILES))
    setMsg("")
    if (fileRef.current) fileRef.current.value = ""
  }
  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const submit = async () => {
    const clean = items.filter(it => it.desc.trim() || Number(it.amount) > 0)
    if (!clean.length) { setMsg(t("至少要填一行支出")); setOk(false); return }
    if (clean.some(it => !it.desc.trim())) { setMsg(t("有一行没写说明")); setOk(false); return }
    setSubmitting(true); setMsg(""); setOk(false)
    try {
      const r = await fetch("/api/teacher-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period, center, notes,
          items: clean.map(it => ({
            date: it.date, category: it.category, desc: it.desc.trim(),
            receipt_no: it.receipt_no.trim(), amount: Number(it.amount) || 0, note: "",
          })),
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d?.success === false) throw new Error(d?.error || `HTTP ${r.status}`)

      // 先建单，再把收据挂上去
      const newId = d?.data?.id
      if (newId && files.length) {
        const fd = new FormData()
        fd.append("id", newId)
        files.forEach(f => fd.append("files", f, f.name))
        const ur = await fetch("/api/teacher-claim/upload", { method: "POST", body: fd })
        const ud = await ur.json().catch(() => ({}))
        if (!ur.ok || ud?.success === false) {
          throw new Error(t("单子已提交，但收据上传失败") + "：" + (ud?.error || ur.status))
        }
      }

      setMsg(t("已提交，等院长审批"))
      setOk(true)
      setItems([emptyRow()]); setNotes(""); setFiles([])
      await load()
    } catch (e: any) {
      setMsg(String(e?.message || e)); setOk(false)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />{t("申请报销")}
          </CardTitle>
          <CardDescription>{t("提交后由院长审批。这里只做记录，不牵涉账目。")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("报销月份")}</Label>
              <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("中心")}</Label>
              <select className="h-9 rounded-md border px-2 text-sm" value={center} onChange={e => setCenter(e.target.value)}>
                <option value="">{t("不指定")}</option>
                <option value="PU1">PU1</option>
                <option value="BATU14">BATU14</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="hidden md:grid grid-cols-[118px_96px_1fr_110px_100px_34px] gap-2 text-xs text-muted-foreground px-1">
              <span>{t("日期")}</span><span>{t("类别")}</span><span>{t("说明")}</span>
              <span>{t("收据号")}</span><span>{t("金额 RM")}</span><span />
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-[118px_96px_1fr_110px_100px_34px] gap-2 items-center">
                <Input type="date" value={it.date} onChange={e => setRow(i, { date: e.target.value })} />
                <select className="h-9 rounded-md border px-2 text-sm" value={it.category} onChange={e => setRow(i, { category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                </select>
                <Input placeholder={t("买什么 / 做什么用")} value={it.desc} onChange={e => setRow(i, { desc: e.target.value })} className="col-span-2 md:col-span-1" />
                <Input placeholder={t("收据号")} value={it.receipt_no} onChange={e => setRow(i, { receipt_no: e.target.value })} />
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={it.amount} onChange={e => setRow(i, { amount: e.target.value })} />
                <Button variant="ghost" size="icon" onClick={() => delRow(i)} disabled={items.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
              <Plus className="h-3.5 w-3.5" />{t("加一行")}
            </Button>
          </div>

          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" />{t("收据照片（最多 10 个，单个 ≤50MB）")}
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" multiple accept="image/*,application/pdf"
                     onChange={e => pickFiles(e.target.files)}
                     className="text-xs file:mr-2 file:rounded-md file:border file:bg-white file:px-3 file:py-1.5 file:text-xs" />
              {files.length > 0 && (
                <span className="text-xs text-muted-foreground">{t("已选")} {files.length} {t("个文件")}</span>
              )}
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {files.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md border bg-gray-50 px-2 py-1 text-xs">
                    {f.name.length > 26 ? f.name.slice(0, 24) + "…" : f.name}
                    <button type="button" onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>{t("备注（可不填）")}</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-sm">
              {t("合计：")}<span className="text-lg font-semibold">RM {total.toFixed(2)}</span>
            </div>
            <Button onClick={submit} disabled={submitting} className="gap-1">
              {submitting ? <Clock className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? t("提交中…") : t("提交")}
            </Button>
          </div>

          {msg && (
            <div className={`flex items-center gap-2 text-sm ${ok ? "text-green-600" : "text-red-600"}`}>
              {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{msg}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("我的报销记录")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{t("加载中…")}</div>
          ) : error ? (
            <div className="flex items-center gap-2 py-4 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>
          ) : rows.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{t("还没有提交过报销单")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3">{t("单号")}</th>
                    <th className="py-2 pr-3">{t("月份")}</th>
                    <th className="py-2 pr-3">{t("项目")}</th>
                    <th className="py-2 pr-3">{t("收据")}</th>
                    <th className="py-2 pr-3 text-right">{t("金额 RM")}</th>
                    <th className="py-2 pr-3">{t("状态")}</th>
                    <th className="py-2">{t("提交日")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{r.claim_no || "-"}</td>
                      <td className="py-2 pr-3">{r.period || "-"}</td>
                      <td className="py-2 pr-3">{Array.isArray(r.items) ? r.items.length : 0} {t("项")}</td>
                      <td className="py-2 pr-3 text-xs">{Array.isArray(r.receipts) && r.receipts.length ? `${r.receipts.length} ${t("张")}` : "-"}</td>
                      <td className="py-2 pr-3 text-right">{Number(r.total || 0).toFixed(2)}</td>
                      <td className="py-2 pr-3">
                        <Badge className={STATUS_STYLE[r.status] || ""}>{t(STATUS_LABEL[r.status] || r.status)}</Badge>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">{(r.fill_date || "").slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
