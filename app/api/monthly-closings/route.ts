import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'

// ─────────────────────────────────────────────────────────────
// 月度结账（月结 / 关账）
//   GET  ?month=2026-09&kind=invoice    → 预览本月汇总 + 是否已结账
//   GET  ?list=1                        → 所有存档记录
//   POST { month, kind, action:"close" }            → 生成月结存档
//   POST { month, kind, action:"reopen", reason }   → 反结账（留痕）
// ─────────────────────────────────────────────────────────────

const PB = 'http://127.0.0.1:8090'

async function pbToken(): Promise<string> {
  const res = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: process.env.POCKETBASE_ADMIN_EMAIL,
      password: process.env.POCKETBASE_ADMIN_PASSWORD,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('PocketBase 登录失败')
  return (await res.json()).token
}

async function pbGet(path: string, token: string) {
  const res = await fetch(`${PB}${path}`, { headers: { Authorization: token }, cache: 'no-store' })
  if (!res.ok) throw new Error(`PocketBase 读取失败 ${res.status}: ${path}`)
  return res.json()
}

async function fetchAll(collection: string, filter: string, token: string): Promise<any[]> {
  const out: any[] = []
  let page = 1
  for (;;) {
    const q = `?perPage=500&page=${page}&filter=${encodeURIComponent(filter)}`
    const d = await pbGet(`/api/collections/${collection}/records${q}`, token)
    out.push(...(d.items || []))
    if (out.length >= (d.totalItems || 0) || !(d.items || []).length) break
    page++
  }
  return out
}

const num = (v: any) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}
const r2 = (n: number) => Math.round(n * 100) / 100

// ── 发票月结 ──────────────────────────────────────────────
async function computeInvoiceMonth(month: string, token: string) {
  const allInvoices = await fetchAll('invoices', 'deleted != true', token)
  const payments = await fetchAll('payments', 'deleted != true', token)

  // 每张票已收多少
  const paidOf: Record<string, number> = {}
  for (const p of payments) {
    const inv = p.invoiceId || p.invoice
    if (!inv) continue
    paidOf[inv] = (paidOf[inv] || 0) + num(p.amount)
  }

  const thisMonth = allInvoices.filter(i => String(i.period) === month)
  const earlier = allInvoices.filter(i => String(i.period) < month)

  const rows = thisMonth.map(i => {
    const total = num(i.totalAmount) || num(i.amount)
    const paid = Math.min(paidOf[i.id] || 0, total)
    return {
      id: i.id,
      invoiceNumber: i.invoiceNumber || '',
      studentName: i.studentName || '',
      status: i.status || '',
      total: r2(total),
      paid: r2(paid),
      outstanding: r2(Math.max(0, total - paid)),
      dueDate: i.dueDate || '',
    }
  }).sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))

  // 更早月份仍未付清 = 结转（同时留明细，方便点开看是哪几张票）
  let carried = 0
  let carriedCount = 0
  const carriedRows: any[] = []
  for (const i of earlier) {
    const total = num(i.totalAmount) || num(i.amount)
    const paid = Math.min(paidOf[i.id] || 0, total)
    const out = Math.max(0, total - paid)
    if (out > 0.004) {
      carried += out
      carriedCount++
      carriedRows.push({
        id: i.id,
        invoiceNumber: i.invoiceNumber || '',
        studentName: i.studentName || '',
        period: String(i.period || ''),
        total: r2(total),
        paid: r2(paid),
        outstanding: r2(out),
        dueDate: i.dueDate || '',
      })
    }
  }
  carriedRows.sort((a, b) => String(a.period).localeCompare(String(b.period)) || a.invoiceNumber.localeCompare(b.invoiceNumber))

  // 本月现金流入（按收款日期）
  let cashIn = 0
  for (const p of payments) {
    const d = String(p.date || p.created || '')
    if (d.slice(0, 7) === month) cashIn += num(p.amount)
  }

  // 本月退款
  let refunded = 0
  let refundCount = 0
  try {
    const refunds = await fetchAll('refunds', 'deleted != true', token)
    for (const rf of refunds) {
      const d = String(rf.date || rf.created || '')
      if (d.slice(0, 7) === month) { refunded += num(rf.amount); refundCount++ }
    }
  } catch { /* 退款表读不到就当 0 */ }

  const invoiced = rows.reduce((s, r) => s + r.total, 0)
  const collectedOfMonth = rows.reduce((s, r) => s + r.paid, 0)
  const outstandingOfMonth = rows.reduce((s, r) => s + r.outstanding, 0)
  const unpaidRows = rows.filter(r => r.outstanding > 0.004)

  return {
    kind: 'invoice',
    month,
    summary: {
      invoiceCount: rows.length,
      invoiced: r2(invoiced),
      collected: r2(collectedOfMonth),
      outstanding: r2(outstandingOfMonth),
      paidCount: rows.length - unpaidRows.length,
      unpaidCount: unpaidRows.length,
      carriedForward: r2(carried),
      carriedForwardCount: carriedCount,
      cashIn: r2(cashIn),
      refunded: r2(refunded),
      refundCount,
    },
    details: {
      invoices: rows,
      unpaid: unpaidRows,
      carriedInvoices: carriedRows,
    },
  }
}

// ── 薪资月结 ──────────────────────────────────────────────
function monthOfSalary(rec: any): string {
  const y = String(rec.year || '').trim()
  const m = String(rec.month || '').trim()
  if (/^\d{4}$/.test(y) && /^\d{1,2}$/.test(m)) return `${y}-${m.padStart(2, '0')}`
  const sp = String(rec.salary_period || '')     // 形如 "2026年9月"
  const mm = sp.match(/(\d{4})\D+(\d{1,2})/)
  if (mm) return `${mm[1]}-${String(mm[2]).padStart(2, '0')}`
  return String(rec.payment_date || rec.created || '').slice(0, 7)
}

async function computeSalaryMonth(month: string, token: string) {
  const all = await fetchAll('teacher_salary_records', 'deleted != true', token)
  const recs = all.filter(r => monthOfSalary(r) === month)

  // 薪资记录只存 teacher_id，名字从 teachers 表对
  const nameOf: Record<string, string> = {}
  try {
    for (const t of await fetchAll('teachers', 'id != ""', token)) {
      nameOf[t.id] = t.name || t.teacher_name || t.full_name || ''
    }
  } catch { /* 取不到名字就显示 id */ }

  const rows = recs.map(r => ({
    id: r.id,
    teacherName: nameOf[r.teacher_id] || r.teacher_id || '',
    gross: r2(num(r.gross_salary)),
    epf: r2(num(r.epf_deduction)),
    socso: r2(num(r.socso_deduction)),
    eis: r2(num(r.eis_deduction)),
    pcb: r2(num(r.tax_deduction)),
    other: r2(num(r.other_deductions)),
    net: r2(num(r.net_salary)),
    status: r.status || '',
  })).sort((a, b) => String(a.teacherName).localeCompare(String(b.teacherName)))

  const sum = (k: string) => r2(rows.reduce((s: number, x: any) => s + num(x[k]), 0))
  return {
    kind: 'salary',
    month,
    summary: {
      headcount: rows.length,
      gross: sum('gross'),
      epf: sum('epf'),
      socso: sum('socso'),
      eis: sum('eis'),
      pcb: sum('pcb'),
      other: sum('other'),
      net: sum('net'),
      paidCount: rows.filter(r => r.status === 'paid').length,
      unpaidCount: rows.filter(r => r.status !== 'paid').length,
    },
    details: { records: rows },
  }
}

async function compute(month: string, kind: string, token: string) {
  return kind === 'salary' ? computeSalaryMonth(month, token) : computeInvoiceMonth(month, token)
}

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const sp = new URL(request.url).searchParams
    const token = await pbToken()

    if (sp.get('list') === '1') {
      const d = await pbGet('/api/collections/monthly_closings/records?perPage=200&sort=-month', token)
      return NextResponse.json({ success: true, closings: d.items || [] })
    }

    const month = sp.get('month') || ''
    const kind = sp.get('kind') || 'invoice'
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ success: false, error: '月份格式应为 YYYY-MM' }, { status: 400 })
    }

    const preview = await compute(month, kind, token)
    const q = `filter=${encodeURIComponent(`month="${month}" && kind="${kind}" && status="closed"`)}&perPage=1`
    const existing = await pbGet(`/api/collections/monthly_closings/records?${q}`, token)

    return NextResponse.json({
      success: true,
      preview,
      existing: (existing.items || [])[0] || null,
    })
  } catch (e: any) {
    console.error('[monthly-closings GET]', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const body = await request.json()
    const month = String(body.month || '')
    const kind = body.kind === 'salary' ? 'salary' : 'invoice'
    const action = body.action || 'close'
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ success: false, error: '月份格式应为 YYYY-MM' }, { status: 400 })
    }
    const token = await pbToken()
    const H = { Authorization: token, 'Content-Type': 'application/json' }

    const q = `filter=${encodeURIComponent(`month="${month}" && kind="${kind}"`)}&perPage=10&sort=-created`
    const ex = await pbGet(`/api/collections/monthly_closings/records?${q}`, token)
    const current = (ex.items || []).find((x: any) => x.status === 'closed')

    if (action === 'reopen') {
      if (!current) return NextResponse.json({ success: false, error: '这个月还没结账' }, { status: 400 })
      const res = await fetch(`${PB}/api/collections/monthly_closings/records/${current.id}`, {
        method: 'PATCH', headers: H,
        body: JSON.stringify({
          status: 'reopened',
          reopened_at: new Date().toISOString(),
          reopen_reason: String(body.reason || ''),
        }),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`反结账失败 ${res.status}`)
      return NextResponse.json({ success: true, reopened: await res.json() })
    }

    // 已结账就不要再生成一份
    if (current) {
      return NextResponse.json({ success: true, alreadyClosed: true, closing: current })
    }

    const snapshot = await compute(month, kind, token)
    const res = await fetch(`${PB}/api/collections/monthly_closings/records`, {
      method: 'POST', headers: H,
      body: JSON.stringify({
        month, kind, status: 'closed',
        summary: snapshot.summary,
        details: snapshot.details,
        closed_at: new Date().toISOString(),
        notes: String(body.notes || ''),
      }),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`生成月结失败 ${res.status}: ${await res.text()}`)
    return NextResponse.json({ success: true, closing: await res.json() })
  } catch (e: any) {
    console.error('[monthly-closings POST]', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
