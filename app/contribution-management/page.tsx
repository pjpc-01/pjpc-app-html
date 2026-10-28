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
import { AlertCircle, Gift, Heart, CheckCircle2, ImagePlus, Trophy,
  Percent,
  SlidersHorizontal,
  Lightbulb,
  History
} from "lucide-react"

const API = "/api/pocketbase-proxy/api/collections"

export default function ContributionManagementPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [rank, setRank] = useState<any>({ overall: { list: [], total_points: 0, students: 0 }, groups: [] })
  const [rankCenter, setRankCenter] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)
  // 单个物品的贡献排行（弹窗）
  const [itemRank, setItemRank] = useState<any>(null)
  const [rankLoading, setRankLoading] = useState(false)

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

  // 贡献积分：比率 / 手动调整 / 流水
  const [rate, setRate] = useState<number>(1)
  const [rateInput, setRateInput] = useState<string>("1")
  const [rateNote, setRateNote] = useState<string>("")
  const [rateBy, setRateBy] = useState<string>("")
  const [logs, setLogs] = useState<any[]>([])
  const [adjStudent, setAdjStudent] = useState<string>("")
  const [adjAmount, setAdjAmount] = useState<string>("")
  const [adjNote, setAdjNote] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])

  // 学生提议的物品
  const [reqs, setReqs] = useState<any[]>([])
  const [reqPoints, setReqPoints] = useState<Record<string, string>>({})
  const [reqCost, setReqCost] = useState<Record<string, string>>({})
  const [reqStock, setReqStock] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    try {
      const [a, b, c, d, e, f, g] = await Promise.all([
        fetch(`${API}/contribution_items/records?perPage=100&sort=-created`),
        fetch(`${API}/reward_items/records?perPage=100&sort=-created`),
        fetch(`${API}/reward_redemptions/records?perPage=100&sort=-created`),
        fetch(`/api/contribution/ranking`),
        fetch(`/api/contribution/admin?view=settings`),
        fetch(`/api/contribution/admin?view=logs&limit=100`),
        fetch(`/api/contribution/item-requests?status=pending`),
      ])
      const [da, db, dc, dd, de, df, dg] = await Promise.all([a.json(), b.json(), c.json(), d.json(), e.json(), f.json(), g.json()])
      if (!a.ok || !b.ok || !c.ok) throw new Error(t("读取失败"))
      setItems(da.items || [])
      setRewards(db.items || [])
      setPending(dc.items || [])
      if (d.ok && dd?.success) setRank({ overall: dd.overall || { list: [], total_points: 0, students: 0 }, groups: dd.groups || [] })
      if (e.ok && de?.success) { setRate(Number(de.rate ?? 1)); setRateInput(String(de.rate ?? 1)); setRateNote(de.note || ""); setRateBy(de.updated_by || "") }
      if (f.ok && df?.success) setLogs(df.logs || [])
      if (g.ok && dg?.success) setReqs(dg.requests || [])
      setError("")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // 手动调整要选学生：拉一次名单
  useEffect(() => {
    fetch(`/api/students?limit=400`)
      .then((r) => (r.ok ? r.json() : { students: [] }))
      .then((d) => setStudents(d.students || d.items || []))
      .catch(() => {})
  }, [])

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

  // 单个物品的贡献排行
  const openItemRank = async (it: any) => {
    setRankLoading(true); setMsg("")
    setItemRank({ item: it, rows: [], loading: true })
    try {
      const r = await fetch(`/api/contribution/item-ranking?itemId=${encodeURIComponent(it.id)}`)
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（${r.status}）`)
      setItemRank(d)
    } catch (e: any) {
      setMsg(String(e?.message || e)); setItemRank(null)
    } finally { setRankLoading(false) }
  }

  // 删除物品（中心物品 / 私人物品共用）
  const deleteItem = async (type: "upgrade" | "reward", x: any) => {
    if (!window.confirm(`${t("确定删除")}「${x.name}」？${t("删除后不能恢复")}`)) return
    setBusy(true); setMsg("")
    try {
      let r = await fetch(`/api/contribution/item?type=${type}&id=${encodeURIComponent(x.id)}`, { method: "DELETE" })
      let d = await r.json().catch(() => ({}))
      if (r.status === 409 && d?.need_confirm) {
        if (!window.confirm(String(d.error || ""))) return
        r = await fetch(`/api/contribution/item?type=${type}&id=${encodeURIComponent(x.id)}&force=1`, { method: "DELETE" })
        d = await r.json().catch(() => ({}))
      }
      if (!r.ok || !d?.success) throw new Error(d?.error || `删除失败（${r.status}）`)
      setMsg(`${t("已删除")}「${x.name}」`)
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  // 导出 CSV（Excel 打开不乱码，带 BOM）
  const downloadCsv = (filename: string, rows: (string | number)[][]) => {
    const esc = (v: any) => {
      const t2 = String(v ?? "")
      return /[",\n]/.test(t2) ? `"${t2.replace(/"/g, '""')}"` : t2
    }
    const csv = "\uFEFF" + rows.map(r => r.map(esc).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const today = () => new Date().toISOString().slice(0, 10)

  const exportRank = () => {
    const v = rankCenter ? (rank.groups || []).find((g: any) => g.center === rankCenter) : rank.overall
    const list = v?.list || []
    if (!list.length) { setMsg(t("没有数据可以导出")); return }
    const rows: (string | number)[][] = [
      [t("排名"), t("学生"), t("中心"), t("累计贡献"), t("占比"), t("次数")],
      ...list.map((x: any, i: number) => [i + 1, x.name || "", x.center || "", x.points || 0, (x.percent || 0) + "%", x.times || 0]),
    ]
    downloadCsv(`贡献榜_${rankCenter || t("全校")}_${today()}.csv`, rows)
    setMsg(t("已导出"))
  }

  const exportLogs = () => {
    if (!logs.length) { setMsg(t("没有数据可以导出")); return }
    const rows: (string | number)[][] = [
      [t("时间"), t("学生"), t("中心"), t("类型"), t("变动"), t("余额"), t("投入"), t("说明"), t("操作人")],
      ...logs.map((x: any) => [
        String(x.created || "").slice(0, 16).replace("T", " "),
        x.student_name || "", x.center || "", KIND_LABEL[x.kind] ? t(KIND_LABEL[x.kind]) : (x.kind || ""),
        x.amount || 0, x.balance_after || 0, x.donate_points || 0, x.note || "", x.operator || "",
      ]),
    ]
    downloadCsv(`贡献积分流水_${today()}.csv`, rows)
    setMsg(t("已导出"))
  }

  const exportItemRank = () => {
    const rowsRaw = itemRank?.rows || []
    if (!rowsRaw.length) { setMsg(t("没有数据可以导出")); return }
    const rows: (string | number)[][] = [
      [t("排名"), t("学生"), t("中心"), t("投入"), t("次数"), t("占比")],
      ...rowsRaw.map((r: any) => [r.rank, r.studentName || "", r.center || "", r.points || 0, r.times || 0, (r.share || 0) + "%"]),
    ]
    downloadCsv(`物品排行_${itemRank?.item?.name || ""}_${today()}.csv`, rows)
    setMsg(t("已导出"))
  }

  // 物品达成后记录谁领取了
  const markReceived = async (x: any) => {
    const note = window.prompt(`${t("谁去领取？写个备注（可留空）")}`, "")
    if (note === null) return
    setBusy(true); setMsg("")
    try {
      const r = await fetch(`/api/contribution/item?type=upgrade&id=${encodeURIComponent(x.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "received", note }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `记录失败（${r.status}）`)
      setMsg(`${t("已记录领取")}「${x.name}」`)
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
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

  // 下架 / 标记完成都走接口：下架会把投进去的积分全数退回，完成才发放贡献积分
  const setStatus = async (item: any, status: string) => {
    if (status === "closed" && !window.confirm(`${t("下架")}「${item.name}」？${t("已投入的")} ${item.current_points || 0} ${t("分会全数退回给学生")}`)) return
    setBusy(true); setMsg("")
    try {
      const r = await fetch(`/api/contribution/item?type=upgrade&id=${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: status === "closed" ? "close" : "complete" }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `操作失败（${r.status}）`)
      if (status === "closed") {
        setMsg(`${t("已下架")}「${item.name}」，${t("退回")} ${d.refunded?.refunded || 0} ${t("分")}`)
      } else {
        setMsg(`${t("已标记完成")}「${item.name}」，${t("发放")} ${d.released?.granted || 0} ${t("贡献积分")}`)
      }
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

  const saveRate = async () => {
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/contribution/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points_rate: Number(rateInput), note: rateNote }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `保存失败（${r.status}）`)
      setRate(Number(d.rate)); setMsg(t("贡献积分比率已更新"))
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  const adjustPoints = async () => {
    if (!adjStudent) { setMsg(t("先选学生")); return }
    setBusy(true); setMsg("")
    try {
      const r = await fetch("/api/contribution/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: adjStudent, amount: Number(adjAmount), note: adjNote }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `调整失败（${r.status}）`)
      setMsg(`${t("已调整")} ${d.student?.name || ""} → ${t("余额")} ${d.balance}`)
      setAdjAmount(""); setAdjNote("")
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  const reviewReq = async (rec: any, status: string) => {
    setBusy(true); setMsg("")
    try {
      const payload: any = { id: rec.id, status }
      if (status === "approved") {
        if (rec.type === "reward") {
          payload.cost_points = Number(reqCost[rec.id] || 0)
          payload.stock = Number(reqStock[rec.id] || 1)
        } else {
          payload.target_points = Number(reqPoints[rec.id] || 1000)
        }
      }
      const r = await fetch("/api/contribution/item-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `操作失败（${r.status}）`)
      setMsg(status === "approved" ? t("已通过，物品已建好") : t("已拒绝"))
      await load()
    } catch (e: any) { setMsg(String(e?.message || e)) } finally { setBusy(false) }
  }

  const KIND_LABEL: Record<string, string> = { donate: "投入", redeem: "兑换", refund: "退回", adjust: "手动调整" }

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
            {/* 贡献积分规则（比率） */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Percent className="h-4 w-4" />{t("贡献积分比率")}</CardTitle>
                <CardDescription>
                  {t("现在")}{t("：")}{t("每投入 1 分得")} {rate} {t("贡献积分")}{rateBy ? ` · ${t("最后修改")} ${rateBy}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("比率（1 = 1 分换 1 分）")}</Label>
                    <Input className="h-9 w-28" value={rateInput} onChange={(e) => setRateInput(e.target.value)} inputMode="decimal" />
                  </div>
                  <div className="grid flex-1 gap-1.5">
                    <Label className="text-xs">{t("说明（可选）")}</Label>
                    <Input className="h-9" value={rateNote} onChange={(e) => setRateNote(e.target.value)} placeholder={t("例如：本月双倍贡献")} />
                  </div>
                  <Button className="h-9" disabled={busy} onClick={saveRate}>{t("保存比率")}</Button>
                </div>
                <p className="text-[11px] text-gray-500">{t("改了只影响之后的投入，已经入账的不会重算。")}</p>
              </CardContent>
            </Card>

            {/* 手动调整贡献积分 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4" />{t("调整贡献积分")}</CardTitle>
                <CardDescription>{t("奖励或扣减某位学生的贡献积分，会记进流水")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2 md:grid-cols-4">
                  <div className="md:col-span-2 grid gap-1.5">
                    <Label className="text-xs">{t("学生")}</Label>
                    <select className="h-9 rounded-md border px-2 text-sm" value={adjStudent} onChange={(e) => setAdjStudent(e.target.value)}>
                      <option value="">{t("选学生")}</option>
                      {students.map((x: any) => (
                        <option key={x.id} value={x.id}>{x.name}{t("（")}{x.student_id || "-"}{x.center ? ` · ${x.center}` : ""}{t("）")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("加减（负数为扣）")}</Label>
                    <Input className="h-9" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} inputMode="numeric" placeholder="+50 / -20" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("原因")}</Label>
                    <Input className="h-9" value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder={t("例如：帮忙搬桌椅奖励")} />
                  </div>
                </div>
                <Button disabled={busy} onClick={adjustPoints}>{t("确定调整")}</Button>
              </CardContent>
            </Card>

            {/* 学生提议的物品 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4" />{t("学生提议的物品")}</CardTitle>
                <CardDescription>{t("待审")} {reqs.filter((x: any) => x.status === "pending").length} {t("条")} · {t("通过后自动建成正式物品")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reqs.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">{t("还没有学生提议")}</p>
                ) : reqs.map((rc: any) => (
                  <div key={rc.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[11px] ${rc.type === "reward" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                        {rc.type === "reward" ? t("私人物品") : t("中心升级")}
                      </span>
                      <span className="font-medium">{rc.name}</span>
                      <span className="text-xs text-gray-500">{rc.student_name}{rc.center ? ` · ${rc.center}` : ""}</span>
                      <span className="ml-auto text-xs text-gray-400">{(rc.created || "").slice(0, 16).replace("T", " ")}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{rc.description}</p>
                    {rc.image_url && (
                      <img src={rc.image_url} alt={rc.name} className="mt-2 h-24 w-24 rounded object-cover border" />
                    )}
                    {rc.status === "pending" ? (
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        {rc.type === "reward" ? (
                          <>
                            <div className="grid gap-1">
                              <Label className="text-[11px]">{t("要多少贡献积分")}</Label>
                              <Input className="h-8 w-24" inputMode="numeric" value={reqCost[rc.id] ?? ""} onChange={(e) => setReqCost((p2) => ({ ...p2, [rc.id]: e.target.value }))} />
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-[11px]">{t("库存")}</Label>
                              <Input className="h-8 w-20" inputMode="numeric" value={reqStock[rc.id] ?? "1"} onChange={(e) => setReqStock((p2) => ({ ...p2, [rc.id]: e.target.value }))} />
                            </div>
                          </>
                        ) : (
                          <div className="grid gap-1">
                            <Label className="text-[11px]">{t("目标积分")}</Label>
                            <Input className="h-8 w-28" inputMode="numeric" value={reqPoints[rc.id] ?? ""} onChange={(e) => setReqPoints((p2) => ({ ...p2, [rc.id]: e.target.value }))} />
                          </div>
                        )}
                        <Button size="sm" disabled={busy} onClick={() => reviewReq(rc, "approved")}>{t("通过并建物品")}</Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => reviewReq(rc, "rejected")}>{t("拒绝")}</Button>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">
                        {rc.status === "approved" ? t("已通过") : t("已拒绝")}{rc.review_note ? ` · ${rc.review_note}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

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

            {/* 学生贡献榜（按中心分） */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4" />{t("学生贡献榜")}</CardTitle>
                <CardDescription>
                  {(() => {
                    const v = rankCenter ? (rank.groups || []).find((g: any) => g.center === rankCenter) : rank.overall
                    const total = v?.total_points || 0
                    const count = v?.students || 0
                    return `${rankCenter ? rankCenter : t("全校")} · ${t("共")} ${count} ${t("人参与")} · ${t("合计")} ${total} ${t("分")}`
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setRankCenter("")}
                    className={`rounded-md px-3 py-1.5 text-sm ${rankCenter === "" ? "bg-gray-900 text-white" : "border text-gray-600 hover:bg-gray-50"}`}
                  >{t("全校")}</button>
                  {(rank.groups || []).map((g: any) => (
                    <button
                      key={g.center}
                      onClick={() => setRankCenter(g.center)}
                      className={`rounded-md px-3 py-1.5 text-sm ${rankCenter === g.center ? "bg-gray-900 text-white" : "border text-gray-600 hover:bg-gray-50"}`}
                    >{g.center} <span className="text-xs opacity-70">{g.total_points}</span></button>
                  ))}
                  <button
                    onClick={exportRank}
                    className="ml-auto rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >{t("导出")}</button>
                </div>

                {(() => {
                  const v = rankCenter ? (rank.groups || []).find((g: any) => g.center === rankCenter) : rank.overall
                  const list = v?.list || []
                  if (list.length === 0) return <p className="text-sm text-gray-500 py-2">{t("还没有学生贡献积分")}</p>
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-gray-500">
                            <th className="py-2 pr-2 w-10">#</th>
                            <th className="py-2 pr-2">{t("学生")}</th>
                            {!rankCenter && <th className="py-2 pr-2">{t("中心")}</th>}
                            <th className="py-2 pr-2 text-right">{t("累计贡献")}</th>
                            <th className="py-2 pr-2 w-40">{t("占比")}</th>
                            <th className="py-2 text-right">{t("次数")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((x: any, i: number) => (
                            <tr key={x.student_id_record} className="border-b last:border-0">
                              <td className="py-2 pr-2 text-gray-400">{i + 1}</td>
                              <td className="py-2 pr-2 font-medium">{x.name}</td>
                              {!rankCenter && <td className="py-2 pr-2 text-gray-500">{x.center || "-"}</td>}
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
                  )
                })()}
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
                          {x.status === "active" && Number(x.current_points || 0) > 0 && (
                            <p className="text-[11px] text-orange-600">{t("投进去的积分先锁着，物品完成才发放")}</p>
                          )}
                          <span className={`w-fit rounded px-1.5 py-0.5 text-[11px] ${
                            x.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {x.status === "active" ? t("进行中") : x.status === "achieved" ? t("已完成") : t("已关闭")}
                          </span>
                          {x.status === "achieved" && (
                            x.received_at ? (
                              <p className="text-[11px] text-gray-500">
                                {t("已领取")} {String(x.received_at).slice(0, 10)}{x.received_by ? ` · ${x.received_by}` : ""}
                                {x.received_note ? ` · ${x.received_note}` : ""}
                              </p>
                            ) : (
                              <button className="w-fit rounded border border-green-300 px-2 py-1 text-[11px] text-green-700 hover:bg-green-50" disabled={busy} onClick={() => markReceived(x)}>{t("标记已领取")}</button>
                            )
                          )}
                          <div className="mt-auto flex items-center gap-2 pt-1">
                            <label className="flex-1 cursor-pointer rounded border px-2 py-1.5 text-center text-xs hover:bg-gray-50">
                              {t("换照片")}
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) changeImage("contribution_items", x.id, f) }} />
                            </label>
                            {x.status === "active" && (
                              <>
                                <button className="rounded border px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50" disabled={busy} onClick={() => setStatus(x, "achieved")}>{t("标记完成")}</button>
                                <button className="rounded border px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50" disabled={busy} onClick={() => setStatus(x, "closed")}>{t("下架")}</button>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="flex-1 rounded border px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50" onClick={() => openItemRank(x)}>{t("贡献排行")}</button>
                            <button className="rounded border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50" disabled={busy} onClick={() => deleteItem("upgrade", x)}>{t("删除")}</button>
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
                            <button className="rounded border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50" disabled={busy} onClick={() => deleteItem("reward", x)}>{t("删除")}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* 贡献积分流水 */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" />{t("贡献积分流水")}</CardTitle>
                  <button onClick={exportLogs} className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">{t("导出")}</button>
                </div>
                <CardDescription>{t("最近")} {logs.length} {t("笔（投入按比率入账、兑换扣减、退回、手动调整）")}</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">{t("还没有记录")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-gray-500">
                          <th className="py-2 pr-2">{t("时间")}</th>
                          <th className="py-2 pr-2">{t("学生")}</th>
                          <th className="py-2 pr-2">{t("类型")}</th>
                          <th className="py-2 pr-2 text-right">{t("变动")}</th>
                          <th className="py-2 pr-2 text-right">{t("余额")}</th>
                          <th className="py-2 pr-2">{t("说明")}</th>
                          <th className="py-2">{t("操作人")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((x: any) => (
                          <tr key={x.id} className="border-b last:border-0">
                            <td className="py-2 pr-2 text-xs text-gray-500">{(x.created || "").slice(0, 16).replace("T", " ")}</td>
                            <td className="py-2 pr-2">
                              <div className="font-medium">{x.student_name || "-"}</div>
                              <div className="text-[11px] text-gray-400">{x.center || ""}</div>
                            </td>
                            <td className="py-2 pr-2 text-xs">{t(KIND_LABEL[x.kind] || x.kind)}</td>
                            <td className={`py-2 pr-2 text-right font-semibold ${Number(x.amount) > 0 ? "text-green-600" : "text-red-600"}`}>
                              {Number(x.amount) > 0 ? "+" : ""}{x.amount}
                              {x.donate_points ? <span className="ml-1 text-[11px] font-normal text-gray-400">{t("（投")} {x.donate_points}×{x.rate}{t("）")}</span> : null}
                            </td>
                            <td className="py-2 pr-2 text-right text-gray-600">{x.balance_after}</td>
                            <td className="py-2 pr-2 text-xs text-gray-600 max-w-[220px] truncate">{x.note || "-"}</td>
                            <td className="py-2 text-xs text-gray-500">{x.operator || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </>
        )}
      </div>
      {/* 单个物品的贡献排行 */}
      {itemRank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setItemRank(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div>
                <p className="text-sm font-semibold">{t("贡献排行")} · {itemRank.item?.name || ""}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {Number(itemRank.item?.current_points || 0)} / {Number(itemRank.item?.target_points || 0)} {t("分")}
                  {itemRank.donors ? ` · ${itemRank.donors} ${t("人")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50" onClick={exportItemRank}>{t("导出")}</button>
                <button className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50" onClick={() => setItemRank(null)}>{t("关闭")}</button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {itemRank.loading ? (
                <p className="py-6 text-center text-sm text-gray-500">{t("加载中...")}</p>
              ) : (itemRank.rows || []).length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">{t("还没有人投入")}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">{t("学生")}</th>
                      <th className="py-2 pr-2 text-right">{t("投入")}</th>
                      <th className="py-2 pr-2 text-right">{t("次数")}</th>
                      <th className="py-2 text-right">{t("占比")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(itemRank.rows || []).map((r: any) => (
                      <tr key={r.studentId} className="border-b last:border-0">
                        <td className="py-2 pr-2 text-xs text-gray-400">{r.rank}</td>
                        <td className="py-2 pr-2">
                          <div className="font-medium">{r.studentName || "-"}</div>
                          <div className="text-[11px] text-gray-400">{r.center || ""}</div>
                        </td>
                        <td className="py-2 pr-2 text-right font-semibold text-orange-600">{r.points}</td>
                        <td className="py-2 pr-2 text-right text-xs text-gray-500">{r.times}</td>
                        <td className="py-2 text-right text-xs text-gray-600">{r.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  )
}
