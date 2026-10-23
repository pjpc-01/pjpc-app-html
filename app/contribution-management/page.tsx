"use client"

/**
 * 贡献兑换（老师/管理员）。
 *
 * 这里做三件事：
 *  1. 中心的升级物品：新增、关闭（学生投入的对象）
 *  2. 可兑换的私人物品：新增、上下架、库存
 *  3. 兑换申请审批：批准 / 拒绝 / 已领取
 */
import { useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { AlertCircle, Gift, Heart, CheckCircle2, ImagePlus, Trophy } from "lucide-react"

const API = "/api/pocketbase-proxy/api/collections"

export default function ContributionManagementPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [rank, setRank] = useState<any>({ list: [], total_points: 0, students: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)

  // 新增表单
  const [iName, setIName] = useState("")
  const [iTarget, setITarget] = useState("")
  const [iCenter, setICenter] = useState("")
  const [iDesc, setIDesc] = useState("")
  const [iImg, setIImg] = useState<File | null>(null)
  const [rName, setRName] = useState("")
  const [rCost, setRCost] = useState("")
  const [rStock, setRStock] = useState("")
  const [rDesc, setRDesc] = useState("")
  const [rImg, setRImg] = useState<File | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [a, b, c, d] = await Promise.all([
        fetch(`${API}/contribution_items/records?perPage=100&sort=-created`),
        fetch(`${API}/reward_items/records?perPage=100&sort=-created`),
        fetch(`${API}/reward_redemptions/records?perPage=100&sort=-created`),
        fetch(`/api/contribution/ranking`),
      ])
      const [da, db, dc, dd] = await Promise.all([a.json(), b.json(), c.json(), d.json()])
      if (!a.ok || !b.ok || !c.ok) throw new Error("读取失败")
      setItems(da.items || [])
      setRewards(db.items || [])
      setPending(dc.items || [])
      if (d.ok && dd?.success) setRank({ list: dd.list || [], total_points: dd.total_points || 0, students: dd.students || 0 })
      setError("")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const post = async (col: string, body: any, file?: File | null) => {
    let r: Response
    if (file) {
      const fd = new FormData()
      Object.entries(body).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)) })
      fd.append("image", file)
      r = await fetch(`${API}/${col}/records`, { method: "POST", body: fd })
    } else {
      r = await fetch(`${API}/${col}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    }
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d?.message || `保存失败（${r.status}）`)
    return d
  }

  // 给已有物品换照片
  const changeImage = async (col: string, id: string, file: File) => {
    setBusy(true); setMsg("")
    try {
      const fd = new FormData()
      fd.append("image", file)
      const r = await fetch(`${API}/${col}/records/${id}`, { method: "PATCH", body: fd })
      if (!r.ok) throw new Error(`上传失败（${r.status}）`)
      setMsg(t("照片已更新"))
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  const patch = async (col: string, id: string, body: any) => {
    const r = await fetch(`${API}/${col}/records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(`更新失败（${r.status}）`)
  }

  const addItem = async () => {
    if (!iName.trim()) { setMsg(t("先填物品名称")); return }
    setBusy(true); setMsg("")
    try {
      await post("contribution_items", {
        name: iName.trim(),
        target_points: Number(iTarget || 0),
        current_points: 0,
        center: iCenter.trim(),
        description: iDesc.trim(),
        status: "active",
      }, iImg)
      setIName(""); setITarget(""); setICenter(""); setIDesc(""); setIImg(null)
      setMsg(t("已添加中心物品"))
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  const addReward = async () => {
    if (!rName.trim()) { setMsg(t("先填物品名称")); return }
    setBusy(true); setMsg("")
    try {
      await post("reward_items", {
        name: rName.trim(),
        cost_points: Number(rCost || 0),
        stock: rStock === "" ? null : Number(rStock),
        description: rDesc.trim(),
        status: "active",
      }, rImg)
      setRName(""); setRCost(""); setRStock(""); setRDesc(""); setRImg(null)
      setMsg(t("已添加可兑换物品"))
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  const setStatus = async (item: any, status: string) => {
    setBusy(true); setMsg("")
    try {
      await patch("contribution_items", item.id, { status })
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  const decide = async (rec: any, status: string) => {
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/contribution/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rec.id, status }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || "操作失败")
      setMsg(t("已处理"))
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  const label = (s: string) =>
    s === "approved" ? t("已批准") : s === "rejected" ? t("被拒绝") : s === "delivered" ? t("已领取") : t("待审批")

  return (
    <PageLayout title={t("贡献兑换")} description={t("中心升级物品、兑换物品和审批")} userRole="teacher">
      <div className="p-4 md:p-6 max-w-5xl space-y-4">
        {msg && <p className="text-sm bg-gray-50 border rounded px-3 py-2">{msg}</p>}
        {loading ? <p className="text-gray-500 py-10 text-center">{t("加载中...")}</p> : error ? (
          <Card><CardContent className="py-8 text-center">
            <p className="text-red-600 flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" />{error}</p>
            <button className="mt-3 px-3 py-1.5 border rounded text-sm" onClick={load}>{t("重新加载")}</button>
          </CardContent></Card>
        ) : (
          <>
            {/* 待审批 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" />{t("兑换申请")}</CardTitle>
                <CardDescription>{t("待审批")} {pending.filter((x: any) => x.status === "pending").length} {t("条")}</CardDescription>
              </CardHeader>
              <CardContent>
                {pending.length === 0 ? <p className="text-sm text-gray-500 py-2">{t("还没有兑换申请")}</p> : (
                  <ul className="divide-y">
                    {pending.map((x: any) => (
                      <li key={x.id} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{x.student_name || "-"} · {x.item_name || "-"}</p>
                          <p className="text-xs text-gray-500">{x.cost} {t("贡献积分")} · {String(x.created || "").slice(0, 10)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={x.status === "rejected" ? "destructive" : x.status === "pending" ? "secondary" : "default"} className="text-[10px]">{label(x.status)}</Badge>
                          {x.status === "pending" && (
                            <>
                              <Button size="sm" disabled={busy} onClick={() => decide(x, "approved")}>{t("批准")}</Button>
                              <Button size="sm" variant="outline" disabled={busy} onClick={() => decide(x, "rejected")}>{t("拒绝")}</Button>
                            </>
                          )}
                          {x.status === "approved" && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => decide(x, "delivered")}>{t("已领取")}</Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 学生贡献榜 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4" />{t("学生贡献榜")}</CardTitle>
                <CardDescription>
                  {t("共")} {rank.students} {t("人参与")} · {t("合计")} {rank.total_points} {t("分")} · {t("占比按全校贡献算")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rank.list.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">{t("还没有学生贡献积分")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-gray-500">
                          <th className="py-2 pr-2 w-10">#</th>
                          <th className="py-2 pr-2">{t("学生")}</th>
                          <th className="py-2 pr-2">{t("中心")}</th>
                          <th className="py-2 pr-2 text-right">{t("累计贡献")}</th>
                          <th className="py-2 pr-2 w-40">{t("占比")}</th>
                          <th className="py-2 text-right">{t("次数")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rank.list.map((x: any, i: number) => (
                          <tr key={x.student_id_record} className="border-b last:border-0">
                            <td className="py-2 pr-2 text-gray-400">{i + 1}</td>
                            <td className="py-2 pr-2 font-medium">{x.name}</td>
                            <td className="py-2 pr-2 text-gray-500">{x.center || "-"}</td>
                            <td className="py-2 pr-2 text-right font-semibold text-orange-600">{x.points}</td>
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded bg-gray-100">
                                  <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, x.percent)}%` }} />
                                </div>
                                <span className="w-12 text-right text-xs text-gray-600">{x.percent}%</span>
                              </div>
                            </td>
                            <td className="py-2 text-right text-gray-500">{x.times}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 中心升级物品 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-4 w-4" />{t("中心的升级物品")}</CardTitle>
                <CardDescription>{t("学生把积分投到这些物品上")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border bg-gray-50/60 p-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <div className="grid gap-1.5 md:col-span-2">
                      <Label>{t("名称")}</Label>
                      <Input value={iName} onChange={(e) => setIName(e.target.value)} placeholder={t("例如：电子琴")} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>{t("目标积分")}</Label>
                      <Input type="number" min={0} step={1} value={iTarget} onChange={(e) => setITarget(e.target.value)} placeholder="2000" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>{t("中心")}</Label>
                      <Input value={iCenter} onChange={(e) => setICenter(e.target.value)} placeholder="PU1 / BATU14" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <div className="grid gap-1.5 md:col-span-2">
                      <Label>{t("说明")}</Label>
                      <Input value={iDesc} onChange={(e) => setIDesc(e.target.value)} placeholder={t("一句话说明，可不填")} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>{t("照片")}</Label>
                      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-sm text-gray-600 hover:bg-gray-50">
                        <ImagePlus className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate">{iImg ? iImg.name : t("选择照片")}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setIImg(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full" disabled={busy} onClick={addItem}>{t("添加")}</Button>
                    </div>
                  </div>
                </div>
                {items.length === 0 ? <p className="text-sm text-gray-500">{t("还没有物品")}</p> : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((x: any) => (
                      <div key={x.id} className="flex flex-col overflow-hidden rounded-xl border bg-white">
                        <div className="relative aspect-square w-full bg-gray-100">
                          {x.image
                            ? <img src={`/api/pocketbase-proxy/api/files/${x.collectionId}/${x.id}/${x.image}`} alt={x.name} className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-gray-400"><ImagePlus className="h-5 w-5" />{t("无图")}</div>}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-3">
                          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{x.name}</p>
                          <p className="text-xs text-gray-500">{x.current_points || 0} / {x.target_points || 0}{x.center ? ` · ${x.center}` : ""}</p>
                          <span className={`w-fit rounded px-1.5 py-0.5 text-[11px] ${
                            x.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {x.status === "active" ? t("进行中") : x.status === "achieved" ? t("已完成") : t("已关闭")}
                          </span>
                          <div className="mt-auto flex items-center gap-2 pt-1">
                            <label className="flex-1 cursor-pointer rounded border px-2 py-1.5 text-center text-xs hover:bg-gray-50">
                              {t("换照片")}
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) changeImage("contribution_items", x.id, f) }} />
                            </label>
                            {x.status === "active" && (
                              <button className="flex-1 rounded border px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50" disabled={busy} onClick={() => setStatus(x, "closed")}>{t("关闭")}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Gift className="h-4 w-4" />{t("可兑换的私人物品")}</CardTitle>
                <CardDescription>{t("学生用贡献积分换这些")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border bg-gray-50/60 p-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <div className="grid gap-1.5 md:col-span-2">
                      <Label>{t("名称")}</Label>
                      <Input value={rName} onChange={(e) => setRName(e.target.value)} placeholder={t("例如：笔记本")} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>{t("需要贡献积分")}</Label>
                      <Input type="number" min={0} step={1} value={rCost} onChange={(e) => setRCost(e.target.value)} placeholder="120" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>{t("库存")}</Label>
                      <Input type="number" min={0} step={1} value={rStock} onChange={(e) => setRStock(e.target.value)} placeholder={t("留空=不限")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <div className="grid gap-1.5 md:col-span-2">
                      <Label>{t("说明")}</Label>
                      <Input value={rDesc} onChange={(e) => setRDesc(e.target.value)} placeholder={t("一句话说明，可不填")} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>{t("照片")}</Label>
                      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-sm text-gray-600 hover:bg-gray-50">
                        <ImagePlus className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate">{rImg ? rImg.name : t("选择照片")}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setRImg(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full" disabled={busy} onClick={addReward}>{t("添加")}</Button>
                    </div>
                  </div>
                </div>
                {rewards.length === 0 ? <p className="text-sm text-gray-500">{t("还没有物品")}</p> : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {rewards.map((x: any) => (
                      <div key={x.id} className="flex flex-col overflow-hidden rounded-xl border bg-white">
                        <div className="relative aspect-square w-full bg-gray-100">
                          {x.image
                            ? <img src={`/api/pocketbase-proxy/api/files/${x.collectionId}/${x.id}/${x.image}`} alt={x.name} className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-gray-400"><ImagePlus className="h-5 w-5" />{t("无图")}</div>}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-3">
                          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{x.name}</p>
                          <p className="text-sm font-semibold text-orange-600">{x.cost_points} <span className="text-xs font-normal text-gray-500">{t("贡献积分")}</span></p>
                          <p className="text-xs text-gray-500">{x.stock === null || x.stock === undefined ? t("不限量") : `${t("剩")} ${x.stock}`}{x.status !== "active" ? ` · ${t("已下架")}` : ""}</p>
                          <div className="mt-auto flex items-center gap-2 pt-1">
                            <label className="flex-1 cursor-pointer rounded border px-2 py-1.5 text-center text-xs hover:bg-gray-50">
                              {t("换照片")}
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) changeImage("reward_items", x.id, f) }} />
                            </label>
                            <button className="flex-1 rounded border px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50" disabled={busy}
                              onClick={async () => { await patch("reward_items", x.id, { status: x.status === "active" ? "closed" : "active" }); load() }}>
                              {x.status === "active" ? t("下架") : t("上架")}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  )
}
