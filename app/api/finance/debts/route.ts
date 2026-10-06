import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/pb-admin-token"

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
const enc = (s: string) => encodeURIComponent(s)

async function pb(path: string, init: RequestInit = {}) {
  const token = await getAdminToken()
  const res = await fetch(`${PB_URL}/api/collections/${path}`, {
    ...init,
    headers: { Authorization: token, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  })
  const raw = await res.text()
  const body = raw ? JSON.parse(raw) : {}
  if (!res.ok) throw new Error(`PB ${res.status}: ${raw.slice(0, 200)}`)
  return body
}

/** GET /api/finance/debts — 列出债务 + 已还/剩余 + 汇总 + 历史类型（供联想） */
export async function GET() {
  try {
    const [d, p] = await Promise.all([
      pb(`debts/records?perPage=200&sort=-created&filter=${enc("deleted != true")}`),
      pb(`debt_payments/records?perPage=1000&sort=-date&filter=${enc("deleted != true")}`),
    ])
    const payments: any[] = p.items || []
    const byDebt = new Map<string, { paid: number; count: number; last?: string }>()
    for (const pay of payments) {
      const key = pay.debtId || ""
      const cur = byDebt.get(key) || { paid: 0, count: 0 }
      cur.paid += Number(pay.amount) || 0
      cur.count += 1
      if (!cur.last || String(pay.date) > cur.last) cur.last = String(pay.date)
      byDebt.set(key, cur)
    }
    const debts = (d.items || []).map((x: any) => {
      const agg = byDebt.get(x.id) || { paid: 0, count: 0 }
      const principal = Number(x.principal) || 0
      const remaining = Math.max(0, principal - agg.paid)
      return {
        ...x,
        paid: agg.paid,
        paymentCount: agg.count,
        lastPayment: agg.last || "",
        remaining,
        progress: principal > 0 ? Math.min(100, Math.round((agg.paid / principal) * 100)) : 0,
      }
    })
    const rows: any[] = debts
    const summary = {
      count: rows.length,
      activeCount: rows.filter((x: any) => x.status !== "settled").length,
      totalPrincipal: rows.reduce((s: number, x: any) => s + (Number(x.principal) || 0), 0),
      totalPaid: rows.reduce((s: number, x: any) => s + (Number(x.paid) || 0), 0),
      totalRemaining: rows.reduce((s: number, x: any) => s + (Number(x.remaining) || 0), 0),
      monthlyTotal: rows.filter((x: any) => x.status !== "settled").reduce((s: number, x: any) => s + (Number(x.monthlyAmount) || 0), 0),
    }
    const types = [...new Set(debts.map((x: any) => x.type).filter(Boolean))]
    return NextResponse.json({ success: true, data: { debts, summary, types } })
  } catch (e) {
    console.error("[debts] GET 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}

/** POST /api/finance/debts — 新增 */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b?.name || String(b.name).trim() === "") {
      return NextResponse.json({ success: false, error: "missing_name" }, { status: 400 })
    }
    const payload = {
      name: String(b.name).trim(),
      type: b.type ? String(b.type).trim() : "",
      principal: Number(b.principal) || 0,
      monthlyAmount: Number(b.monthlyAmount) || 0,
      paymentDay: b.paymentDay ? Number(b.paymentDay) : null,
      startDate: b.startDate || null,
      dueDate: b.dueDate || null,
      status: b.status || "active",
      note: b.note || "",
      voucher_no: b.voucher_no || "",
      deleted: false,
    }
    const r = await pb("debts/records", { method: "POST", body: JSON.stringify(payload) })
    return NextResponse.json({ success: true, data: r })
  } catch (e) {
    console.error("[debts] POST 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}

/** PATCH /api/finance/debts?id=xxx — 修改 */
export async function PATCH(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 })
    const b = await req.json()
    const payload: any = {}
    for (const k of ["name", "type", "note", "voucher_no", "status"]) if (k in b) payload[k] = b[k]
    for (const k of ["principal", "monthlyAmount"]) if (k in b) payload[k] = Number(b[k]) || 0
    if ("paymentDay" in b) payload.paymentDay = b.paymentDay ? Number(b.paymentDay) : null
    for (const k of ["startDate", "dueDate"]) if (k in b) payload[k] = b[k] || null
    const r = await pb(`debts/records/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
    return NextResponse.json({ success: true, data: r })
  } catch (e) {
    console.error("[debts] PATCH 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}

/** DELETE /api/finance/debts?id=xxx — 软删除 */
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 })
    await pb(`debts/records/${id}`, { method: "PATCH", body: JSON.stringify({ deleted: true }) })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[debts] DELETE 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}
