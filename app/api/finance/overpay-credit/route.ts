import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

/**
 * POST /api/finance/overpay-credit  { invoiceId }
 *
 * 家长多付了钱（应付 918，实收 1000），多出来的 82 必须有个落点，否则账永远对不上。
 * 做法：把「实收 − 票面」记成一条 student_credits（下期开票自动抵扣）。
 *
 * 幂等：同一个 sourceInvoiceId 只会有一条，金额每次重算覆盖（只要还没被用掉）。
 * 只在收款 / 改收款 / 删收款之后调用，调用方是 hooks/usePayments.resyncInvoiceStatus。
 */

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

async function pb(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: token, ...(init?.headers || {}) },
  })
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`)
  return data
}

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const body = await request.json().catch(() => ({}))
    const invoiceId = String(body?.invoiceId || '')
    if (!invoiceId) return NextResponse.json({ success: false, error: '要指定发票' }, { status: 400 })

    const token = await getAdminToken()
    const inv = await pb(`/api/collections/invoices/records/${invoiceId}`, token)
    if (!inv?.id) return NextResponse.json({ success: false, error: '发票不存在' }, { status: 404 })

    const face = Number(inv.totalAmount || 0)
    const pays = await pb(
      `/api/collections/payments/records?perPage=200&filter=${encodeURIComponent(
        `invoiceId="${invoiceId}" && deleted != true && status != "failed" && status != "refunded"`
      )}`,
      token
    )
    const paid = (pays?.items || []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
    const excess = Math.round((paid - face) * 100) / 100

    const existing = await pb(
      `/api/collections/student_credits/records?perPage=5&filter=${encodeURIComponent(
        `sourceInvoiceId="${invoiceId}" && deleted != true`
      )}`,
      token
    )
    const row = (existing?.items || [])[0]

    // 没多收：把之前记的、还没用掉的抵扣清掉（比如改了收款金额）
    if (excess <= 0.005) {
      if (row && Number(row.usedAmount || 0) === 0) {
        await pb(`/api/collections/student_credits/records/${row.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify({ deleted: true, note: '多收金额已不存在（收款被修改）' }),
        })
        return NextResponse.json({ success: true, excess: 0, removed: true })
      }
      return NextResponse.json({ success: true, excess: 0 })
    }

    if (row) {
      if (Number(row.usedAmount || 0) > 0) {
        return NextResponse.json({ success: true, excess, kept: true, note: '这条抵扣已经用掉一部分，不再重算' })
      }
      await pb(`/api/collections/student_credits/records/${row.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          amount: excess,
          remaining: excess,
          usedAmount: 0,
          status: 'available',
          studentName: inv.studentName || row.studentName || '',
          note: `多收转抵扣（发票 ${inv.invoiceNumber || invoiceId} 实收 ${paid.toFixed(2)} / 应付 ${face.toFixed(2)}）`,
        }),
      })
      return NextResponse.json({ success: true, excess, updated: true })
    }

    const created = await pb('/api/collections/student_credits/records', token, {
      method: 'POST',
      body: JSON.stringify({
        studentId: inv.studentId || '',
        studentName: inv.studentName || '',
        center: inv.center || '',
        amount: excess,
        remaining: excess,
        usedAmount: 0,
        status: 'available',
        sourceInvoiceId: invoiceId,
        sourceInvoiceNumber: inv.invoiceNumber || '',
        sourcePeriod: inv.period || '',
        usageLog: [],
        note: `多收转抵扣（发票 ${inv.invoiceNumber || invoiceId} 实收 ${paid.toFixed(2)} / 应付 ${face.toFixed(2)}）`,
      }),
    })

    return NextResponse.json({ success: true, excess, creditId: created?.id || '' })
  } catch (e: any) {
    console.error('[overpay-credit]', e)
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 })
  }
}
