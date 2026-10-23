"use client"

/**
 * 我的成就 —— 达成条件自动解锁，可以把其中一个设成称号，像游戏那样。
 */
import { useCallback, useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, Award, Check } from "lucide-react"

type Ach = { id: string; code: string; name: string; description: string; icon: string; condition: string; earned: boolean }

export default function MyAchievementsPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<Ach[]>([])
  const [title, setTitle] = useState("")
  const [titleIcon, setTitleIcon] = useState("")
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const r = await fetch("/api/achievements")
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setItems(d.achievements || [])
      setTitle(d.student?.title || "")
      setTitleIcon(d.student?.title_icon || "")
      setStats(d.stats || {})
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const setAsTitle = async (a: Ach) => {
    setBusy(a.code); setError("")
    try {
      const isCurrent = title === a.name
      const r = await fetch("/api/achievements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: isCurrent ? "" : a.code }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `设置失败（HTTP ${r.status}）`)
      setTitle(d.title || ""); setTitleIcon(d.title_icon || "")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setBusy("")
    }
  }

  const earned = items.filter((x) => x.earned)
  const locked = items.filter((x) => !x.earned)

  return (
    <PageLayout title={t("我的成就")} description={t("达成条件自动解锁，可以挑一个当自己的称号")}>
      <div className="p-4 md:p-6 max-w-4xl space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-gray-500">{t("我现在的称号")}</p>
              <p className="text-lg font-semibold">{title ? `${titleIcon} ${title}` : t("还没设称号")}</p>
            </div>
            <div className="ml-auto flex gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold">{earned.length}/{items.length}</p>
                <p className="text-xs text-gray-500">{t("已解锁")}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{stats.contributed ?? 0}</p>
                <p className="text-xs text-gray-500">{t("累计贡献")}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{stats.points ?? 0}</p>
                <p className="text-xs text-gray-500">{t("总积分")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}

        {loading ? (
          <p className="py-10 text-center text-gray-500">{t("加载中...")}</p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">{t("已解锁")} ({earned.length})</p>
              {earned.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-sm text-gray-500">{t("还没解锁成就，继续努力")}</CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {earned.map((a) => (
                    <Card key={a.id} className="border-amber-200 bg-gradient-to-b from-amber-50 to-white">
                      <CardContent className="space-y-2 py-4 text-center">
                        <div className="text-3xl">{a.icon || "🏅"}</div>
                        <p className="font-semibold">{t(a.name)}</p>
                        <p className="text-[11px] text-gray-500">{t(a.condition)}</p>
                        <Button
                          size="sm"
                          variant={title === a.name ? "outline" : "default"}
                          className="w-full"
                          disabled={busy === a.code}
                          onClick={() => setAsTitle(a)}
                        >
                          {title === a.name ? <><Check className="mr-1.5 h-3.5 w-3.5" />{t("使用中")}</> : t("设为称号")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {locked.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">{t("还没解锁")} ({locked.length})</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {locked.map((a) => (
                    <Card key={a.id} className="bg-gray-50 opacity-80">
                      <CardContent className="space-y-1 py-4 text-center">
                        <div className="text-3xl grayscale">{a.icon || "🏅"}</div>
                        <p className="font-medium text-gray-600">{t(a.name)}</p>
                        <p className="text-[11px] text-gray-400">{t(a.condition)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}
