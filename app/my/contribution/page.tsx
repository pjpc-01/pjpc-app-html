"use client"

/**
 * 我的贡献（学生）—— 货架式排版（类似 Shopee/Lazada 的商品列表）。
 *
 * 规则：中心放升级物品标目标积分；学生把普通积分投进去（总积分真的扣，
 * 排行榜会掉），投多少 1:1 攒贡献积分；贡献积分只能换私人物品。
 */
import { useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, Gift, Heart, Trophy, Lightbulb, History, Camera } from "lucide-react"

type Any_ = Record<string, any>

function Thumb({ url, alt, badge }: { url?: string; alt: string; badge?: string }) {
  const { t } = useLanguage()
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
      {url
        ? <img src={url} alt={alt} className="h-full w-full object-cover" />
        : <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">{t("无图")}</div>}
      {badge && (
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">{badge}</span>
      )}
    </div>
  )
}

export default function MyContributionPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<Any_ | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 投入弹窗
  const [donateItem, setDonateItem] = useState<Any_ | null>(null)
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  // 我要提议物品
  const [propType, setPropType] = useState<"upgrade" | "reward">("upgrade")
  const [propName, setPropName] = useState("")
  const [propDesc, setPropDesc] = useState("")
  const [propImg, setPropImg] = useState<File | null>(null)
  const [myReqs, setMyReqs] = useState<any[]>([])
  const [proposing, setProposing] = useState(false)

  const load = async () => {
    try {
      const r = await fetch("/api/contribution/summary")
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setData(d)
      setError("")
      try {
        const r2 = await fetch("/api/contribution/item-requests")
        const d2 = await r2.json().catch(() => ({}))
        if (r2.ok && d2?.success) setMyReqs(d2.requests || [])
      } catch { /* 提议列表拉不到不影响主内容 */ }
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const donate = async () => {
    const n = Math.floor(Number(amount || 0))
    if (!donateItem) return
    if (!n || n <= 0) { setMsg(t("请输入要投入的积分")); return }
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/contribution/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: donateItem.id, points: n }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `投入失败（HTTP ${r.status}）`)
      setDonateItem(null); setAmount("")
      await load()
      const got = Number(d.earned_contribution_points ?? n)
      setMsg(`${t("已投入")} ${n} ${t("分")}，${t("贡献积分")} +${got}</b>`.replace("</b>", ""))
    } catch (e: any) {
      setMsg(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const redeem = async (x: Any_) => {
    if (!window.confirm(`${t("确定用")} ${x.cost_points} ${t("贡献积分换")}「${x.name}」？`)) return
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/contribution/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: x.id }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `兑换失败（HTTP ${r.status}）`)
      await load()
      setMsg(`${t("已申请兑换")}：${x.name}，${t("等老师审批")}`)
    } catch (e: any) {
      setMsg(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const submitProposal = async () => {
    if (propName.trim().length < 2) { setMsg(t("写上物品名称")); return }
    if (propDesc.trim().length < 2) { setMsg(t("说说想要什么")); return }
    setProposing(true); setMsg("")
    try {
      const fd = new FormData()
      fd.append("type", propType)
      fd.append("name", propName.trim())
      fd.append("description", propDesc.trim())
      if (propImg) fd.append("image", propImg)
      const r = await fetch("/api/contribution/item-requests", { method: "POST", body: fd })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `提交失败（HTTP ${r.status}）`)
      setPropName(""); setPropDesc(""); setPropImg(null)
      setMsg(t("已提交，等老师审批"))
      await load()
    } catch (e: any) {
      setMsg(String(e?.message || e))
    } finally {
      setProposing(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <PageLayout title={t("我的贡献")} description={t("为中心出力，攒贡献积分换自己的东西")}>
      <div className="p-4 md:p-6 max-w-6xl space-y-6">{children}</div>
    </PageLayout>
  )

  if (loading) return shell(<p className="text-gray-500 py-10 text-center">{t("加载中...")}</p>)
  if (error || !data) {
    return shell(
      <div className="rounded-xl border bg-white py-10 text-center">
        <p className="text-red-600 flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" />{error || t("加载失败")}</p>
        <button className="mt-3 rounded border px-3 py-1.5 text-sm" onClick={load}>{t("重新加载")}</button>
      </div>
    )
  }

  const b = data.balance || { contributed: 0, spent: 0, available: 0, points_now: 0 }
  const items = (data.items || []).filter((x: Any_) => x.status === "active")
  const achieved = (data.items || []).filter((x: Any_) => x.status === "achieved")
  const rewards = (data.rewards || []).filter((x: Any_) => x.status === "active")

  return shell(
    <>
      {/* 余额条 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white px-4 py-3">
          <p className="text-xs text-gray-500">{t("可用贡献积分")}</p>
          <p className="mt-1 text-2xl font-semibold text-orange-600">{b.available}</p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3">
          <p className="text-xs text-gray-500">{t("累计贡献")}</p>
          <p className="mt-1 text-2xl font-semibold">{b.contributed}</p>
          <p className="mt-1 text-[11px] text-gray-500">
            {t("占本中心贡献")} {(data.community?.my_center_percent ?? 0)}%
            {" · "}{t("全校")} {(data.community?.my_percent ?? 0)}%
          </p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3">
          <p className="text-xs text-gray-500">{t("我的总积分")}</p>
          <p className="mt-1 text-2xl font-semibold">{b.points_now}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {t("现在的比率")}{t("：")}{t("每投入 1 分得")} {data.rate ?? 1} {t("贡献积分")}
        {" · "}{t("余额")} {b.balance ?? b.available}{t("（")}{t("待批占用")} {b.held ?? 0}{t("）")}
      </p>

      {msg && <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-700">{msg}</div>}

      {/* 中心升级物品 */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Heart className="h-4 w-4 text-orange-500" />{t("中心要升级的东西")}</h2>
          <p className="text-xs text-gray-500">{t("投进去的积分先从总积分扣掉并锁着，物品完成才发放贡献积分；物品下架会全数退回")}</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border bg-white py-8 text-center text-sm text-gray-500">{t("中心还没有放物品")}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((x: Any_) => (
              <div key={x.id} className="flex flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md">
                <Thumb url={x.image_url} alt={x.name} />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{x.name}</p>
                  <div>
                    <p className="text-sm font-semibold text-orange-600">
                      {x.current_points} <span className="text-xs font-normal text-gray-500">/ {x.target_points}</span>
                    </p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-gray-100">
                      <div className="h-full bg-orange-500" style={{ width: `${x.progress}%` }} />
                    </div>
                  </div>
                  <button
                    className="mt-auto w-full rounded-md bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => { setDonateItem(x); setAmount(""); setMsg("") }}
                  >{t("贡献积分")}</button>
                </div>
              </div>
            ))}
            {achieved.map((x: Any_) => (
              <div key={x.id} className="flex flex-col overflow-hidden rounded-xl border bg-white">
                <Thumb url={x.image_url} alt={x.name} badge={t("已完成")} />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{x.name}</p>
                  <p className="text-xs text-gray-500">{t("已经筹集够了")}</p>
                  <div className="mt-auto w-full rounded-md bg-gray-100 py-2 text-center text-sm text-gray-500">{t("已完成")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 兑换商店 */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Gift className="h-4 w-4 text-orange-500" />{t("可以兑换的东西")}</h2>
          <p className="text-xs text-gray-500">{t("只能用贡献积分，不能加回总积分")}</p>
        </div>

        {rewards.length === 0 ? (
          <div className="rounded-xl border bg-white py-8 text-center text-sm text-gray-500">{t("暂时没有可以兑换的东西")}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rewards.map((x: Any_) => {
              const short = b.available < x.cost_points
              return (
                <div key={x.id} className="flex flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md">
                  <Thumb url={x.image_url} alt={x.name} />
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{x.name}</p>
                    {x.description && <p className="line-clamp-1 text-xs text-gray-500">{x.description}</p>}
                    <p className="text-base font-semibold text-orange-600">
                      {x.cost_points} <span className="text-xs font-normal text-gray-500">{t("贡献积分")}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {x.stock === null || x.stock === undefined ? t("不限量") : `${t("剩")} ${x.stock}`}
                    </p>
                    <button
                      className="mt-auto w-full rounded-md bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-500"
                      disabled={busy || short}
                      onClick={() => redeem(x)}
                    >{short ? `${t("还差")} ${x.cost_points - b.available}` : t("兑换")}</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 我要提议物品 */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Lightbulb className="h-4 w-4 text-orange-500" />{t("我想提议物品")}</h2>
          <p className="text-xs text-gray-500">{t("想要中心买什么，或想要什么私人物品，写下来给老师看")}</p>
        </div>
        <div className="rounded-xl border bg-white p-3 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setPropType("upgrade")}
              className={`rounded-md px-3 py-1.5 text-sm ${propType === "upgrade" ? "bg-gray-900 text-white" : "border text-gray-600"}`}
            >{t("中心升级物品")}</button>
            <button
              onClick={() => setPropType("reward")}
              className={`rounded-md px-3 py-1.5 text-sm ${propType === "reward" ? "bg-gray-900 text-white" : "border text-gray-600"}`}
            >{t("私人物品")}</button>
          </div>
          <Input className="h-9" placeholder={t("物品名称，例如：电子琴")} value={propName} onChange={(e) => setPropName(e.target.value)} />
          <textarea
            className="min-h-[70px] w-full resize-y rounded-md border px-3 py-2 text-sm"
            placeholder={t("为什么想要它？想拿来做什么？")}
            value={propDesc}
            onChange={(e) => setPropDesc(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              <Camera className="h-4 w-4" />
              {propImg ? propImg.name.slice(0, 18) : t("加照片（可选）")}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPropImg(e.target.files?.[0] || null)} />
            </label>
            <button
              className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              disabled={proposing}
              onClick={submitProposal}
            >{proposing ? t("提交中…") : t("提交提议")}</button>
          </div>
          {myReqs.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-gray-600">{t("我提过的")}</p>
              {myReqs.map((rc: any) => (
                <div key={rc.id} className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 text-sm">
                  <span className="text-[11px] text-gray-400">{rc.type === "reward" ? t("私人物品") : t("中心升级")}</span>
                  <span className="font-medium">{rc.name}</span>
                  <span className={`ml-auto rounded px-2 py-0.5 text-[11px] ${
                    rc.status === "approved" ? "bg-green-50 text-green-700" : rc.status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                  }`}>
                    {rc.status === "approved" ? t("已通过") : rc.status === "rejected" ? t("已拒绝") : t("待审批")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 我投过的物品（按物品汇总） */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Heart className="h-4 w-4 text-orange-500" />{t("我投过的物品")}</h2>
        {(data.my_donations || []).length === 0 ? (
          <div className="rounded-xl border bg-white py-6 text-center text-sm text-gray-500">{t("还没有投过积分")}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-3 py-2">{t("物品")}</th>
                  <th className="px-3 py-2 text-right">{t("我投入")}</th>
                  <th className="px-3 py-2 text-right">{t("贡献积分")}</th>
                  <th className="px-3 py-2 text-right">{t("次数")}</th>
                  <th className="px-3 py-2">{t("状态")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.my_donations || []).map((x: any) => (
                  <tr key={x.itemId || x.itemName} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{x.itemName}</td>
                    <td className="px-3 py-2 text-right">{x.points}</td>
                    <td className="px-3 py-2 text-right">{x.earned}</td>
                    <td className="px-3 py-2 text-right text-xs text-gray-500">{x.times}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] ${
                        x.status === "released" ? "bg-green-50 text-green-700"
                        : x.status === "refunded" ? "bg-gray-100 text-gray-600"
                        : "bg-orange-50 text-orange-700"
                      }`}>
                        {x.status === "released" ? t("物品完成已入账") : x.status === "refunded" ? t("已退回") : t("等物品完成")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 我的贡献积分明细 */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold"><History className="h-4 w-4 text-orange-500" />{t("我的贡献积分明细")}</h2>
        {(data.my_point_logs || []).length === 0 ? (
          <div className="rounded-xl border bg-white py-6 text-center text-sm text-gray-500">{t("还没有明细")}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-3 py-2">{t("时间")}</th>
                  <th className="px-3 py-2">{t("类型")}</th>
                  <th className="px-3 py-2 text-right">{t("变动")}</th>
                  <th className="px-3 py-2 text-right">{t("余额")}</th>
                  <th className="px-3 py-2">{t("说明")}</th>
                </tr>
              </thead>
              <tbody>
                {(data.my_point_logs || []).map((x: any) => (
                  <tr key={x.id} className="border-b last:border-0">
                    <td className="px-3 py-2 text-xs text-gray-500">{(x.created || "").slice(0, 16).replace("T", " ")}</td>
                    <td className="px-3 py-2 text-xs">
                      {x.kind === "donate" ? t("投入") : x.kind === "redeem" ? t("兑换") : x.kind === "refund" ? t("退回") : t("手动调整")}
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold ${Number(x.amount) > 0 ? "text-green-600" : "text-red-600"}`}>
                      {Number(x.amount) > 0 ? "+" : ""}{x.amount}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{x.balance_after}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{x.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 记录 */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white">
          <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold"><Trophy className="h-4 w-4 text-gray-500" />{t("我的贡献记录")}</div>
          <div className="px-4 py-2">
            {(data.my_logs || []).length === 0 ? <p className="py-3 text-sm text-gray-500">{t("还没有贡献记录")}</p> : (
              <ul className="divide-y">
                {(data.my_logs || []).map((x: Any_) => (
                  <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p>{x.item_name || "-"}</p>
                      <p className="text-xs text-gray-400">{String(x.created || "").slice(0, 10)}</p>
                    </div>
                    <span className="font-medium text-orange-600">+{x.points}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white">
          <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold"><Gift className="h-4 w-4 text-gray-500" />{t("我的兑换记录")}</div>
          <div className="px-4 py-2">
            {(data.my_redemptions || []).length === 0 ? <p className="py-3 text-sm text-gray-500">{t("还没有兑换记录")}</p> : (
              <ul className="divide-y">
                {(data.my_redemptions || []).map((x: Any_) => (
                  <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p>{x.item_name || "-"}</p>
                      <p className="text-xs text-gray-400">{String(x.created || "").slice(0, 10)} · {x.cost} {t("分")}</p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-[11px] ${
                      x.status === "rejected" ? "bg-red-50 text-red-600"
                        : x.status === "pending" ? "bg-gray-100 text-gray-600"
                          : "bg-green-50 text-green-700"
                    }`}>
                      {t(x.status === "approved" ? "已批准" : x.status === "rejected" ? "被拒绝" : x.status === "delivered" ? "已领取" : "待审批")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 投入弹窗 */}
      {donateItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDonateItem(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-semibold">{donateItem.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {t("已筹")} {donateItem.current_points} / {donateItem.target_points} · {t("我的总积分")} {b.points_now}
            </p>
            <div className="mt-4">
              <Input
                type="number" min={1} step={1} value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("投入多少分")}
                autoFocus
              />
              <div className="mt-2 flex gap-2">
                {[10, 20, 50].map((n) => (
                  <button key={n} className="rounded border px-3 py-1 text-xs hover:bg-gray-50" onClick={() => setAmount(String(n))}>+{n}</button>
                ))}
                <button className="rounded border px-3 py-1 text-xs hover:bg-gray-50" onClick={() => setAmount(String(Math.max(0, b.points_now)))}>{t("全部")}</button>
              </div>
              {msg && <p className="mt-2 text-xs text-red-600">{msg}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setDonateItem(null)}>{t("取消")}</button>
              <button className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={busy} onClick={donate}>
                {busy ? t("处理中…") : t("确定投入")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
