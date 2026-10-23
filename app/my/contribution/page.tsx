"use client"

/**
 * 我的贡献（学生）。
 *
 * 院长定的规则：
 *  - 中心放升级物品（电子琴、懒人椅…），标目标积分；
 *  - 学生把普通积分投进去，总积分真的扣（排行榜会掉）；
 *  - 投多少攒多少贡献积分（1:1）；
 *  - 贡献积分只能换私人物品，不能加回总积分。
 */
import { useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, Gift, Heart, Trophy } from "lucide-react"

type Any_ = Record<string, any>

export default function MyContributionPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<Any_ | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [openItem, setOpenItem] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  const load = async () => {
    try {
      const r = await fetch("/api/contribution/summary")
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setData(d)
      setError("")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const donate = async (itemId: string) => {
    const n = Math.floor(Number(amount || 0))
    if (!n || n <= 0) { setMsg(t("请输入要投入的积分")); return }
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/contribution/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, points: n }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `投入失败（HTTP ${r.status}）`)
      setMsg(`${t("已投入")} ${n} ${t("分")}，${t("贡献积分")} +${n}`)
      setAmount(""); setOpenItem("")
      await load()
    } catch (e: any) {
      setMsg(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const redeem = async (itemId: string, name: string) => {
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/contribution/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `兑换失败（HTTP ${r.status}）`)
      setMsg(`${t("已申请兑换")}：${name}，${t("等老师审批")}`)
      await load()
    } catch (e: any) {
      setMsg(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <PageLayout title={t("我的贡献")} description={t("为中心出力，攒贡献积分换自己的东西")}>
      <div className="p-4 md:p-6 max-w-4xl space-y-4">{children}</div>
    </PageLayout>
  )

  if (loading) return shell(<p className="text-gray-500 py-10 text-center">{t("加载中...")}</p>)
  if (error || !data) {
    return shell(
      <Card><CardContent className="py-10 text-center">
        <p className="text-red-600 flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" />{error || t("加载失败")}</p>
        <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={load}>{t("重新加载")}</button>
      </CardContent></Card>
    )
  }

  const b = data.balance || { contributed: 0, spent: 0, available: 0, points_now: 0 }
  const items = (data.items || []).filter((x: Any_) => x.status === "active")
  const achieved = (data.items || []).filter((x: Any_) => x.status === "achieved")
  const rewards = (data.rewards || []).filter((x: Any_) => x.status === "active")

  return shell(
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("可用贡献积分")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{b.available}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("累计贡献")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{b.contributed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{t("我的总积分")}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{b.points_now}</div></CardContent>
        </Card>
      </div>

      {msg && <p className="text-sm text-gray-700 bg-gray-50 border rounded px-3 py-2">{msg}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-4 w-4" />{t("中心的升级物品")}</CardTitle>
          <CardDescription>{t("投进去的积分会从总积分扣掉，同时 1:1 攒贡献积分")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 && achieved.length === 0 && <p className="text-sm text-gray-500 py-2">{t("中心还没有放物品")}</p>}
          {items.map((x: Any_) => (
            <div key={x.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{x.name}</p>
                  {x.description && <p className="text-xs text-gray-500 mt-0.5">{x.description}</p>}
                </div>
                <span className="text-xs text-gray-500 shrink-0">{x.current_points} / {x.target_points}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded bg-gray-100 overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${x.progress}%` }} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                {openItem === x.id ? (
                  <>
                    <Input
                      type="number" min={1} step={1} className="h-8 w-28"
                      value={amount} onChange={(e) => setAmount(e.target.value)}
                      placeholder={t("投入多少分")}
                    />
                    <Button size="sm" disabled={busy} onClick={() => donate(x.id)}>{t("确定投入")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setOpenItem(""); setAmount("") }}>{t("取消")}</Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setOpenItem(x.id); setAmount(""); setMsg("") }}>{t("贡献积分")}</Button>
                )}
              </div>
            </div>
          ))}
          {achieved.map((x: Any_) => (
            <div key={x.id} className="rounded-lg border bg-green-50/50 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{x.name}</p>
                <p className="text-xs text-gray-500">{t("已经筹集够了")}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{t("已完成")}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Gift className="h-4 w-4" />{t("用贡献积分兑换")}</CardTitle>
          <CardDescription>{t("只能用贡献积分，不能加回总积分")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? <p className="text-sm text-gray-500 py-2">{t("暂时没有可以兑换的东西")}</p> : (
            <ul className="divide-y">
              {rewards.map((x: Any_) => (
                <li key={x.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{x.name}</p>
                    {x.description && <p className="text-xs text-gray-500">{x.description}</p>}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {x.cost_points} {t("贡献积分")}
                      {x.stock !== null && <> · {t("剩")} {x.stock} {t("个")}</>}
                    </p>
                  </div>
                  <Button size="sm" disabled={busy || b.available < x.cost_points} onClick={() => redeem(x.id, x.name)}>
                    {b.available < x.cost_points ? `${t("还差")} ${x.cost_points - b.available}` : t("兑换")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4" />{t("我的贡献记录")}</CardTitle>
        </CardHeader>
        <CardContent>
          {(data.my_logs || []).length === 0 ? <p className="text-sm text-gray-500 py-2">{t("还没有贡献记录")}</p> : (
            <ul className="divide-y">
              {(data.my_logs || []).map((x: Any_) => (
                <li key={x.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p>{x.item_name || "-"}</p>
                    <p className="text-xs text-gray-400">{String(x.created || "").slice(0, 10)}</p>
                  </div>
                  <span className="text-blue-600 font-medium">+{x.points}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("我的兑换记录")}</CardTitle></CardHeader>
        <CardContent>
          {(data.my_redemptions || []).length === 0 ? <p className="text-sm text-gray-500 py-2">{t("还没有兑换记录")}</p> : (
            <ul className="divide-y">
              {(data.my_redemptions || []).map((x: Any_) => (
                <li key={x.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p>{x.item_name || "-"}</p>
                    <p className="text-xs text-gray-400">{String(x.created || "").slice(0, 10)} · {x.cost} {t("分")}</p>
                  </div>
                  <Badge variant={x.status === "rejected" ? "destructive" : x.status === "pending" ? "secondary" : "default"} className="text-[10px]">
                    {t(x.status === "approved" ? "已批准" : x.status === "rejected" ? "被拒绝" : x.status === "delivered" ? "已领取" : "待审批")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
