import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { applyCreditsToInvoice } from '@/lib/credits'

// 开票后把学生手上的「上期多收抵扣」自动抵到这张票上。
// 只读自己库、只改 student_credits 和这张发票，钱不经过这里。
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'boss', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const body = await request.json()
    const invoiceId = String(body?.invoiceId || '')
    if (!invoiceId) return NextResponse.json({ success: false, error: '缺少 invoiceId' }, { status: 400 })

    const result = await applyCreditsToInvoice(invoiceId)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('POST /api/credits/apply error:', error)
    return NextResponse.json({ success: false, error: error?.message || '抵扣失败' }, { status: 500 })
  }
}
