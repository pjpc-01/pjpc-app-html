"use client"

/**
 * 我的建议 —— 学生/老师在导航里直接写，看得到有没有回复。
 * 只是提意见，不影响成绩、积分。
 */
import { useCallback, useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, MessageSquarePlus, Send } from "lucide-react"

const STATUS_LABEL: Record<string, string> = { new: "待处理", reading: "处理中", done: "已完成" }
const STATUS_STYLE: Record<string, string> = {
  new: "bg-amber-50 text-amber-700",
  reading: "bg-blue-50 text-blue-700",
  done: "bg-gray-100 text-gray-600",
}

type Item = { id: string; target: string; content: string; status: string; reply: string; created: string; replied_by: string }

export default function MySuggestionsPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")
  const [target, setTarget] = useState("center")
  const [content, setContent] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const r = await fetch("/api/suggestions?mine=1")
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setItems(d.items || [])
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (content.trim().length < 2) { setError(t("请写下你的建议")); return }
    setBusy(true); setError(""); setMsg("")
    try {
      const r = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, content }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `提交失败（HTTP ${r.status}）`)
      setContent("")
      setMsg(t("已提交，谢谢你的建议"))
      await load()
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageLayout title={t("我的建议")} description={t("觉得中心或系统哪里可以做得更好，直接写下来")}>
      <div className="p-4 md:p-6 max-w-3xl space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquarePlus className="h-4 w-4" />{t("写建议")}</CardTitle>
            <CardDescription>{t("提的是改进意见，不会影响你的成绩和积分")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTarget("center")}
                className={`rounded-md px-3 py-1.5 text-sm ${target === "center" ? "bg-gray-900 text-white" : "border text-gray-600"}`}
              >{t("给中心")}</button>
              <button
                onClick={() => setTarget("app")}
                className={`rounded-md px-3 py-1.5 text-sm ${target === "app" ? "bg-gray-900 text-white" : "border text-gray-600"}`}
              >{t("给 PJPC 系统")}</button>
            </div>
            <textarea
              className="min-h-[110px] w-full resize-y rounded-md border px-3 py-2 text-sm"
              placeholder={target === "center" ? t("比如：希望中心多办点活动、桌椅太旧、想加什么科目") : t("比如：哪个页面不好用、想加什么功能")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button disabled={busy} onClick={submit}>
                <Send className="mr-2 h-4 w-4" />{busy ? t("提交中…") : t("提交")}
              </Button>
              {msg && <span className="text-sm text-green-600">{msg}</span>}
            </div>
            {error && <p className="flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">{t("我提过的")} <span className="text-gray-400">({items.length})</span></p>
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">{t("加载中...")}</p>
          ) : items.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-gray-500">{t("还没提过建议")}</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {items.map((x) => (
                <Card key={x.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-sm">{x.target === "app" ? t("PJPC 系统") : t("中心")}</CardTitle>
                      <span className={`rounded px-2 py-0.5 text-[11px] ${STATUS_STYLE[x.status] || STATUS_STYLE.new}`}>{t(STATUS_LABEL[x.status] || STATUS_LABEL.new)}</span>
                      <span className="ml-auto text-xs text-gray-400">{(x.created || "").slice(0, 16).replace("T", " ")}</span>
                    </div>
                    <CardDescription className="whitespace-pre-wrap pt-1 text-sm text-gray-700">{x.content}</CardDescription>
                  </CardHeader>
                  {x.reply && (
                    <CardContent>
                      <p className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <span className="text-xs text-gray-400">{t("回复")}{x.replied_by ? ` · ${x.replied_by}` : ""}{t("：")}</span>
                        <br />{x.reply}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
