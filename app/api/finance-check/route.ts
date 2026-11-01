import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

// 财务核对：只读接口
// 目的：① 系统「财务核对」页面自己用 ② 给 principal-agent 一个只读通道（x-pjpc-read-token）
// 铁律：这里永远只读，不写任何数据。

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
const READ_TOKEN = process.env.PJPC_READ_TOKEN || ''

export const dynamic = 'force-dynamic'

function tokenOk(req: NextRequest) {
  if (!READ_TOKEN) return false
  const h = req.headers.get('x-pjpc-read-token') || req.nextUrl.searchParams.get('token') || ''
  return !!h && h === READ_TOKEN
}

async function pb(path: string, token: string) {
  const res = await fetch(`${PB_URL}${path}`, {
    headers: { Authorization: token },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PocketBase ${res.status}`)
  return res.json()
}

async function allRecords(collection: string, token: string, filter?: string) {
  const out: any[] = []
  let page = 1
  for (;;) {
    const qs = new URLSearchParams({ page: String(page), perPage: '500' })
    if (filter) qs.set('filter', filter)
    const data = await pb(`/api/collections/${collection}/records?${qs.toString()}`, token)
    out.push(...(data.items || []))
    if (!data.items || data.items.length < 500 || page >= (data.totalPages || 1)) break
    page += 1
  }
  return out
}

function num(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function itemSum(items: any): number {
  let arr: any[] = []
  try {
    arr = typeof items === 'string' ? JSON.parse(items || '[]') : Array.isArray(items) ? items : []
  } catch {
    arr = []
  }
  return arr.reduce((s: number, it: any) => s + num(it?.amount) * (num(it?.quantity) || 1), 0)
}

const round2 = (n: number) => Math.round(n * 100) / 100

function buildIndex(invoices: any[], payments: any[]) {
  const paidByInvoice = new Map<string, number>()
  for (const p of payments) {
    const id = String(p.invoiceId || '')
    if (!id) continue
    paidByInvoice.set(id, round2((paidByInvoice.get(id) || 0) + num(p.amount)))
  }
  const live = invoices.filter((i) => i.deleted !== true && i.status !== 'cancelled')
  return { paidByInvoice, live }
}

function invoiceRow(i: any, paid: number) {
  const face = num(i.totalAmount)
  const detail = itemSum(i.items)
  return {
    id: i.id,
    number: i.invoiceNumber,
    student: i.studentName,
    studentId: i.studentId,
    grade: i.studentGrade,
    period: i.period,
    status: i.status,
    issueDate: String(i.issueDate || '').slice(0, 10),
    face: round2(face),
    detail: round2(detail),
    discount: num(i.discount),
    discountType: i.discountType || '',
    paid: round2(paid),
    faceVsDetail: round2(face - detail),
    faceVsPaid: round2(face - paid),
  }
}

export async function GET(request: NextRequest) {
  // 两条路：只读 token（principal-agent）或本系统财务角色会话
  if (!tokenOk(request)) {
    const gate = await requireRoles(request, ['admin', 'boss', 'office_admin'])
    if ('error' in gate) return gate.error
  }

  try {
    const { searchParams } = request.nextUrl
    const view = searchParams.get('view') || 'summary'
    const period = searchParams.get('period') || ''
    const no = searchParams.get('no') || ''
    const name = searchParams.get('name') || ''

    const token = await getAdminToken()

    // 单张发票查询：不用拉全库
    if (view === 'invoice') {
      if (!no) return NextResponse.json({ success: false, error: '缺少 no 参数（发票号）' }, { status: 400 })
      const found = await pb(
        `/api/collections/invoices/records?perPage=10&filter=${encodeURIComponent(`invoiceNumber="${no}"`)}`,
        token
      )
      const invs = found.items || []
      if (!invs.length) return NextResponse.json({ success: true, invoices: [], message: '没有这张发票' })
      const pays = await allRecords('payments', token, `invoiceId="${invs[0].id}"`)
      const paid = pays.filter((p) => p.deleted !== true).reduce((s, p) => s + num(p.amount), 0)
      return NextResponse.json({
        success: true,
        invoice: invoiceRow(invs[0], paid),
        payments: pays.map((p) => ({
          id: p.id,
          amount: num(p.amount),
          date: String(p.date || '').slice(0, 10),
          method: p.method || '',
          status: p.status || '',
          deleted: p.deleted === true,
          notes: p.notes || '',
        })),
      })
    }

    // 其余视图都要全库比对
    const [invoices, payments] = await Promise.all([
      allRecords('invoices', token),
      allRecords('payments', token),
    ])
    const { paidByInvoice, live } = buildIndex(invoices, payments)
    const scoped = period ? live.filter((i) => i.period === period) : live

    if (view === 'duplicates') {
      const groups = new Map<string, any[]>()
      for (const i of scoped) {
        const key = `${i.studentId}__${i.period}`
        const arr = groups.get(key) || []
        arr.push(i)
        groups.set(key, arr)
      }
      const rows: any[] = []
      for (const arr of groups.values()) {
        if (arr.length < 2) continue
        const total = round2(arr.reduce((s, i) => s + num(i.totalAmount), 0))
        rows.push({
          student: arr[0].studentName,
          studentId: arr[0].studentId,
          grade: arr[0].studentGrade,
          period: arr[0].period,
          count: arr.length,
          total,
          ids: arr.map((i) => i.invoiceNumber),
          amounts: arr.map((i) => round2(num(i.totalAmount))),
          paid: round2(arr.reduce((s, i) => s + (paidByInvoice.get(i.id) || 0), 0)),
        })
      }
      rows.sort((a, b) => b.count - a.count || b.total - a.total)
      return NextResponse.json({ success: true, view, period: period || '全部', rows, count: rows.length })
    }

    if (view === 'mismatch') {
      const detailDiff: any[] = []
      const paidDiff: any[] = []
      for (const i of scoped) {
        const row = invoiceRow(i, paidByInvoice.get(i.id) || 0)
        if (Math.abs(row.faceVsDetail) >= 0.01) detailDiff.push(row)
        if (row.paid > 0 && Math.abs(row.faceVsPaid) >= 0.01) paidDiff.push(row)
      }
      detailDiff.sort((a, b) => Math.abs(b.faceVsDetail) - Math.abs(a.faceVsDetail))
      paidDiff.sort((a, b) => Math.abs(b.faceVsPaid) - Math.abs(a.faceVsPaid))
      return NextResponse.json({
        success: true,
        view,
        period: period || '全部',
        faceVsDetail: detailDiff.slice(0, 200),
        faceVsDetailCount: detailDiff.length,
        faceVsPaid: paidDiff.slice(0, 200),
        faceVsPaidCount: paidDiff.length,
      })
    }

    if (view === 'student') {
      if (!name) return NextResponse.json({ success: false, error: '缺少 name 参数（学生名）' }, { status: 400 })
      const kw = name.trim()
      const hit = live.filter((i) => String(i.studentName || '').toLowerCase().includes(kw.toLowerCase()))
      const rows = hit
        .map((i) => invoiceRow(i, paidByInvoice.get(i.id) || 0))
        .sort((a, b) => String(a.period).localeCompare(String(b.period)) || a.number.localeCompare(b.number))
      const byPeriod = new Map<string, number>()
      for (const r of rows) byPeriod.set(r.period, round2((byPeriod.get(r.period) || 0) + r.face))
      return NextResponse.json({
        success: true,
        view,
        name: kw,
        rows,
        count: rows.length,
        facesByPeriod: Object.fromEntries([...byPeriod.entries()].sort()),
        totalFace: round2(rows.reduce((s, r) => s + r.face, 0)),
        totalPaid: round2(rows.reduce((s, r) => s + r.paid, 0)),
      })
    }

    // 默认：概览
    const periods = new Map<string, { period: string; invoices: number; face: number; paid: number; unpaid: number }>()
    for (const i of live) {
      const p = String(i.period || '(空)')
      const cur = periods.get(p) || { period: p, invoices: 0, face: 0, paid: 0, unpaid: 0 }
      const face = num(i.totalAmount)
      const paid = paidByInvoice.get(i.id) || 0
      cur.invoices += 1
      cur.face = round2(cur.face + face)
      cur.paid = round2(cur.paid + paid)
      cur.unpaid = round2(cur.unpaid + (face - paid))
      periods.set(p, cur)
    }
    const dupGroups = new Map<string, number>()
    for (const i of scoped) {
      const k = `${i.studentId}__${i.period}`
      dupGroups.set(k, (dupGroups.get(k) || 0) + 1)
    }
    let dupCount = 0
    for (const n of dupGroups.values()) if (n > 1) dupCount += 1

    let detailBad = 0
    let paidBad = 0
    for (const i of scoped) {
      const face = num(i.totalAmount)
      if (Math.abs(face - itemSum(i.items)) >= 0.01) detailBad += 1
      const paid = paidByInvoice.get(i.id) || 0
      if (paid > 0 && Math.abs(face - paid) >= 0.01) paidBad += 1
    }

    return NextResponse.json({
      success: true,
      view: 'summary',
      period: period || '全部',
      periods: [...periods.values()].sort((a, b) => a.period.localeCompare(b.period)),
      scoped: {
        period: period || '全部',
        invoices: scoped.length,
        face: round2(scoped.reduce((s, i) => s + num(i.totalAmount), 0)),
        paid: round2(scoped.reduce((s, i) => s + (paidByInvoice.get(i.id) || 0), 0)),
        duplicateGroups: dupCount,
        faceVsDetailCount: detailBad,
        faceVsPaidCount: paidBad,
      },
    })
  } catch (error: any) {
    console.error('[finance-check]', error)
    return NextResponse.json({ success: false, error: error?.message || '读取失败' }, { status: 500 })
  }
}
