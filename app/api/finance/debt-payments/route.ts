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

/** GET /api/finance/debt-payments?debtId=xxx */
export async function GET(req: NextRequest) {
  try {
    const debtId = new URL(req.url).searchParams.get("debtId")
    const filter = debtId ? `debtId = "${debtId}" && deleted != true` : "deleted != true"
    const r = await pb(`debt_payments/records?perPage=500&sort=-date&filter=${enc(filter)}`)
    return NextResponse.json({ success: true, data: r.items || [] })
  } catch (e) {
    console.error("[debt-payments] GET 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}

/** POST — 记一笔还款（⚠️ 只进 debt_payments，不进 expenses，避免污染经营成本） */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b?.debtId) return NextResponse.json({ success: false, error: "missing_debtId" }, { status: 400 })
    const amount = Number(b.amount) || 0
    if (amount <= 0) return NextResponse.json({ success: false, error: "amount must be > 0" }, { status: 400 })
    const payload = {
      debtId: b.debtId,
      date: b.date || new Date().toISOString().slice(0, 10),
      amount,
      note: b.note || "",
      deleted: false,
    }
    const r = await pb("debt_payments/records", { method: "POST", body: JSON.stringify(payload) })
    return NextResponse.json({ success: true, data: r })
  } catch (e) {
    console.error("[debt-payments] POST 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}

/** DELETE ?id=xxx — 软删除 */
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 })
    await pb(`debt_payments/records/${id}`, { method: "PATCH", body: JSON.stringify({ deleted: true }) })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[debt-payments] DELETE 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}
