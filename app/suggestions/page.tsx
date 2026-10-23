"use client"

/**
 * 建议箱 —— 老师/管理员看所有人的建议，改状态、写回复。
 * 学生端是 /my/suggestions（只看自己的）。
 */
import { useCallback, useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, MessageSquare, Send } from "lucide-react"

const STATUS_LABEL: Record<string, string> = { new: "待处理", reading: "处理中", done: "已完成" }
const STATUS_STYLE: Record<string, string> = {
  new: "bg-amber-50 text-amber-700",
  reading: "bg-blue-50 text-blue-700",
  done: "bg-gray-100 text-gray-600",
}
const TARGET_LABEL: Record<string, string> = { center: "中心", app: "PJPC 系统" }

type Item = {
  id: string; target: string; content: string; status: string; reply: string
  submitter_name: string; submitter_role: string; center: string; created: string; replied_by: string
}

export default function SuggestionsPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [target, setTarget] = useState("")
  const [status, setStatus] = useState("")
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState("")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const qs = new URLSearchParams()
      if (target) qs.set("target", target)
      if (status) qs.set("status", status)
      const r = await fetch(`/api/suggestions?${qs.toString()}`)
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setItems(d.items || [])
    } catch (e: any) {
      setError(String(e?.message || e))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [target, status])

  useEffect(() => { load() }, [load])

  const update = async (id: string, payload: Record<string, any>) => {
    setBusy(id); setError("")
    try {
      const r = await fetch("/api/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `更新失败（HTTP ${r.status}）`)
      await load()
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setBusy("")
    }
  }

  const roleLabel = (r: string) => (r === "student" ? t("学生") : r === "teacher" ? t("老师") : t("职员"))

  return (
    <PageLayout title={t("建议箱")} description={t("老师、学生给中心和 PJPC 系统提的改进建议")}>
      <div className="p-4 md:p-6 max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-9 rounded-md border px-2 text-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">{t("全部对象")}</option>
            <option value="center">{t("中心")}</option>
            <option value="app">{t("PJPC 系统")}</option>
          </select>
          <select className="h-9 rounded-md border px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t("全部状态")}</option>
            <option value="new">{t("待处理")}</option>
            <option value="reading">{t("处理中")}</option>
            <option value="done">{t("已完成")}</option>
          </select>
          <span className="text-sm text-gray-500">{t("共")} {items.length} {t("条")}</span>
        </div>

        {error && <p className="flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}

        {loading ? (
          <p className="py-10 text-center text-gray-500">{t("加载中...")}</p>
        ) : items.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-sm text-gray-500">
            <MessageSquare className="h-6 w-6 text-gray-300" />{t("还没有建议")}
          </CardContent></Card>
        ) : (
          items.map((x) => (
            <Card key={x.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{TARGET_LABEL[x.target] ? t(TARGET_LABEL[x.target]) : t("中心")}</CardTitle>
                  <span className={`rounded px-2 py-0.5 text-[11px] ${STATUS_STYLE[x.status] || STATUS_STYLE.new}`}>{t(STATUS_LABEL[x.status] || STATUS_LABEL.new)}</span>
                  <span className="text-xs text-gray-500">{x.submitter_name || "-"} · {roleLabel(x.submitter_role)}{x.center ? ` · ${x.center}` : ""}</span>
                  <span className="ml-auto text-xs text-gray-400">{(x.created || "").slice(0, 16).replace("T", " ")}</span>
                </div>
                <CardDescription className="whitespace-pre-wrap pt-1 text-sm text-gray-700">{x.content}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {x.reply && (
                  <p className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <span className="text-xs text-gray-400">{t("回复")}{x.replied_by ? ` · ${x.replied_by}` : ""}{t("：")}</span>
                    <br />{x.reply}
                  </p>
                )}
                <div className="flex flex-col gap-2 md:flex-row">
                  <textarea
                    className="min-h-[38px] flex-1 resize-y rounded-md border px-2 py-1.5 text-sm"
                    placeholder={x.reply ? t("改回复内容") : t("写回复（可选）")}
                    value={draft[x.id] ?? ""}
                    onChange={(e) => setDraft((p) => ({ ...p, [x.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    {x.status !== "reading" && x.status !== "done" && (
                      <Button variant="outline" size="sm" disabled={busy === x.id} onClick={() => update(x.id, { status: "reading" })}>{t("处理中")}</Button>
                    )}
                    <Button
                      size="sm"
                      disabled={busy === x.id}
                      onClick={() => update(x.id, { status: "done", reply: (draft[x.id] ?? x.reply ?? "").trim() })}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />{busy === x.id ? t("保存中…") : t("回复并完成")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageLayout>
  )
}
