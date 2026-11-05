import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { voidCreditsForSource, reopenCreditsForSource, revertUsageForInvoice, applyCreditsToInvoice } from '@/lib/credits'

// 来源发票作废/删除时，把这笔多收余额封掉，防止「票都没了、钱还能抵」。
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'boss', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const body = await request.json()
    const sourceInvoiceId = String(body?.sourceInvoiceId || '')
    if (!sourceInvoiceId) return NextResponse.json({ success: false, error: '缺少 sourceInvoiceId' }, { status: 400 })

    // reason: void（作废/删除）| refunded（退款）| restore（从回收站恢复）
    if (body?.reason === 'restore') {
      const opened = await reopenCreditsForSource(sourceInvoiceId)
      // 恢复发票后重新抵扣一次：之前作废时退回去的额度，要再抵回这张票
      let reapplied = 0
      try {
        reapplied = (await applyCreditsToInvoice(sourceInvoiceId)).applied
      } catch (e) {
        console.warn('[credits] 恢复后重新抵扣失败:', e)
      }
      return NextResponse.json({ success: true, opened, reapplied })
    }
    const reason = body?.reason === 'refunded' ? 'refunded' : 'void'
    const note = String(body?.note || (reason === 'refunded' ? '来源发票已退款，余额作废' : '来源发票已作废，余额作废'))
    const closed = await voidCreditsForSource(sourceInvoiceId, reason as 'void' | 'refunded', note)
    // 这张票自己被抵扣过的额度也要退回（票没了，额度不能跟着没）
    let returned = 0
    try {
      returned = await revertUsageForInvoice(sourceInvoiceId)
    } catch (e) {
      console.warn('[credits] 退回已用额度失败:', e)
    }
    return NextResponse.json({ success: true, closed, returned })
  } catch (error: any) {
    console.error('POST /api/credits/void error:', error)
    return NextResponse.json({ success: false, error: error?.message || '作废余额失败' }, { status: 500 })
  }
}
