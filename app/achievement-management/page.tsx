"use client"

/**
 * 成就管理（老师/管理员）。
 *
 * 自动解锁的成就是按数据算的，改不了；这里管「手动授予」：
 * 想表扬谁就发一个，学生那边立刻变成已解锁，可以拿它当称号。
 */
import { useCallback, useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, Award, Search, Trash2 } from "lucide-react"

type Ach = { code: string; name: string; icon: string; condition: string; earned: boolean }

export default function AchievementManagementPage() {
  const { t } = useLanguage()
  const [students, setStudents] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [sid, setSid] = useState("")
  const [list, setList] = useState<Ach[]>([])
  const [awards, setAwards] = useState<any[]>([])
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/students?limit=400")
      .then((r) => (r.ok ? r.json() : { students: [] }))
      .then((d) => setStudents(d.students || []))
      .catch(() => {})
  }, [])

  const loadStudent = useCallback(async (id: string) => {
    if (!id) { setList([]); setAwards([]); return }
    setLoading(true); setError("")
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/achievements?studentId=${id}`),
        fetch(`/api/achievements/award?studentId=${id}`),
      ])
      const [da, db] = await Promise.all([a.json().catch(() => ({})), b.json().catch(() => ({}))])
      if (a.ok && da?.success) setList((da.achievements || []).map((x: any) => ({ code: x.code, name: x.name, icon: x.icon || "", condition: x.condition || "", earned: !!x.earned })))
      if (b.ok && db?.success) setAwards(db.awards || [])
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStudent(sid) }, [sid, loadStudent])

  const award = async (code: string) => {
    if (!sid) { setMsg(t("先选学生")); return }
    setBusy(code); setMsg(""); setError("")
    try {
      const r = await fetch("/api/achievements/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: sid, code, note }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `授予失败（HTTP ${r.status}）`)
      setMsg(`${t("已授予")}：${d.achievement?.icon || ""} ${d.achievement?.name || ""}`)
      setNote("")
      await loadStudent(sid)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setBusy("")
    }
  }

  const revoke = async (id: string) => {
    if (!window.confirm(t("撤销这个手动授予的成就？"))) return
    setBusy(id); setError("")
    try {
      const r = await fetch(`/api/achievements/award?id=${id}`, { method: "DELETE" })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `撤销失败（HTTP ${r.status}）`)
      await loadStudent(sid)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setBusy("")
    }
  }

  const filtered = students.filter((s) => {
    if (!q.trim()) return false
    const k = q.trim().toLowerCase()
    return String(s.name || "").toLowerCase().includes(k) || String(s.student_id || "").toLowerCase().includes(k)
  }).slice(0, 12)

  const picked = students.find((s) => s.id === sid)

  return (
    <PageLayout title={t("成就管理")} description={t("自动解锁的是系统算的；这里可以手动授予和撤销")}>
      <div className="p-4 md:p-6 max-w-4xl space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Search className="h-4 w-4" />{t("选学生")}</CardTitle>
            <CardDescription>{t("打名字或学号找，选中后下面列他的成就")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input className="h-9" placeholder={t("搜学生名字或学号")} value={q} onChange={(e) => setQ(e.target.value)} />
            {q.trim() && (
              <div className="max-h-48 space-y-1 overflow-auto rounded border p-1">
                {filtered.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-gray-500">{t("没找到")}</p>
                ) : filtered.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSid(s.id); setQ("") }}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50"
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-gray-400">{s.student_id} {s.center ? `· ${s.center}` : ""}</span>
                  </button>
                ))}
              </div>
            )}
            {picked && (
              <p className="text-sm text-gray-700">
                {t("当前")}{t("：")}<span className="font-medium">{picked.name}</span>
                <span className="text-xs text-gray-400"> {picked.student_id} {picked.center ? `· ${picked.center}` : ""}</span>
              </p>
            )}
            <div className="grid gap-1.5">
              <Label className="text-xs">{t("授予原因（可选，会记下来）")}</Label>
              <Input className="h-9" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("例如：这个月主动帮同学补习")} />
            </div>
          </CardContent>
        </Card>

        {msg && <p className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">{msg}</p>}
        {error && <p className="flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}

        {!sid ? (
          <Card><CardContent className="py-10 text-center text-sm text-gray-500">{t("先搜一个学生")}</CardContent></Card>
        ) : loading ? (
          <p className="py-10 text-center text-gray-500">{t("加载中...")}</p>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4" />{t("全部成就")}</CardTitle>
                <CardDescription>{t("已解锁")} {list.filter((x) => x.earned).length} / {list.length} · {t("灰底的可以手动授予")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.map((x) => (
                  <div key={x.code} className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${x.earned ? "bg-amber-50 border-amber-200" : ""}`}>
                    <span className="text-xl">{x.icon || "🏅"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t(x.name)}</p>
                      <p className="text-[11px] text-gray-500">{t(x.condition)}</p>
                    </div>
                    <div className="ml-auto">
                      {x.earned ? (
                        <span className="rounded bg-white px-2 py-1 text-[11px] text-amber-700">{t("已解锁")}</span>
                      ) : (
                        <Button size="sm" disabled={busy === x.code} onClick={() => award(x.code)}>
                          {busy === x.code ? t("授予中…") : t("授予")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("手动授予记录")} <span className="text-gray-400">({awards.length})</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {awards.length === 0 ? (
                  <p className="py-2 text-sm text-gray-500">{t("还没有手动授予")}</p>
                ) : awards.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-2 rounded border px-3 py-2 text-sm">
                    <span className="text-lg">{a.icon || "🏅"}</span>
                    <span className="font-medium">{t(a.achievement_name)}</span>
                    <span className="text-xs text-gray-500">{a.awarded_by}{a.note ? ` · ${a.note}` : ""}</span>
                    <span className="ml-auto text-xs text-gray-400">{(a.created || "").slice(0, 16).replace("T", " ")}</span>
                    <button
                      className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      disabled={busy === a.id}
                      onClick={() => revoke(a.id)}
                    >
                      <Trash2 className="mr-1 inline h-3 w-3" />{t("撤销")}
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  )
}
