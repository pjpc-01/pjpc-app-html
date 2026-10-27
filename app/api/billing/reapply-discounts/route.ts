import { round2, sumLines, subtotalOf, discountValueOf, isDiscountLine as _isDiscountLine } from '@/lib/finance-calc'
import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

export const dynamic = 'force-dynamic'

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 把「学生费用」里的月折扣重新算进已开的发票。
 *
 * 为什么需要：学生费用页改折扣只写 student_fees，不动已开的发票，
 * 于是发票还是原价、折扣看不到（用户 2026-10-26 反馈「discount 又没算进 invoice」）。
 *
 * 只对**未缴清**的发票动手（paid 的一律跳过），而且只重算折扣行，
 * 其它手工加的/结转的行原样保留，不会把老师改过的东西冲掉。
 *
 * POST body: { period?: "2026-11", studentIds?: string[], dryRun?: boolean }
 */
export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'office_admin', 'teacher'])
  if ('error' in gate) return gate.error

  try {
    const token = await getAdminToken()
    if (!token) return NextResponse.json({ success: false, error: '无法取得管理员权限' }, { status: 500 })
    const headers = { Authorization: token }

    const body = await request.json().catch(() => ({}))
    const period: string = String(body?.period || '').slice(0, 7)
    const studentIds: string[] = Array.isArray(body?.studentIds) ? body.studentIds : []
    const dryRun = body?.dryRun === true

    // 未删除发票（只处理未缴清的）
    let filter = 'deleted=false'
    if (period) filter += ` && period = "${period}"`
    const invRes = await fetch(`${PB_URL}/api/collections/invoices/records?perPage=500&filter=${encodeURIComponent(filter)}`, { headers })
    const invoices = invRes.ok ? (await invRes.json()).items || [] : []

    // 学生费用（含折扣）
    const sfRes = await fetch(`${PB_URL}/api/collections/student_fees/records?perPage=500`, { headers })
    const assignments = sfRes.ok ? (await sfRes.json()).items || [] : []
    const byStudent = new Map<string, any>()
    for (const a of assignments) {
      if (!a.students) continue
      const prev = byStudent.get(a.students)
      // 一条学生多条时取有折扣的那条（老数据里折扣可能只挂在其中一条）
      if (!prev || (Number(a.discount || 0) > 0 && Number(prev.discount || 0) === 0)) byStudent.set(a.students, a)
    }

    const isDiscountLine = (it: any) => _isDiscountLine(it)
    const isPaid = (i: any) => String(i.status || '') === 'paid'

    const plan: any[] = []
    for (const inv of invoices) {
      if (isPaid(inv)) continue
      const sid = inv.studentId
      if (!sid) continue
      if (studentIds.length > 0 && !studentIds.includes(sid)) continue

      const adj = byStudent.get(sid)
      const discount = Number(adj?.discount || 0)
      const discountType = String(adj?.discount_type || 'amount')

      const items: any[] = Array.isArray(inv.items) ? inv.items : []
      const keptItems = items.filter(it => !isDiscountLine(it))
      const base = subtotalOf(keptItems)
      const hadDiscountLine = items.some(isDiscountLine)
      const oldDiscount = hadDiscountLine
        ? Math.abs(items.filter(isDiscountLine).reduce((s, it) => s + (Number(it.amount) || 0), 0))
        : 0

      const newDiscount = discountValueOf(base, discount, discountType)

      // 一致就不用动
      if (Math.abs(newDiscount - oldDiscount) < 0.01) continue

      const newItems = [...keptItems]
      if (newDiscount > 0) {
        newItems.push({
          name: discountType === 'percent' ? `学生折扣 (${discount}%)` : '学生折扣',
          amount: -newDiscount,
        })
      }
      const newTotal = Math.max(0, sumLines(newItems))

      plan.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentId: sid,
        studentName: inv.studentName || '',
        period: inv.period || '',
        oldTotal: Number(inv.totalAmount || 0),
        newTotal,
        oldDiscount,
        newDiscount,
        discount,
        discountType,
        items: newItems,
      })
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        count: plan.length,
        delta: Math.round(plan.reduce((s, p) => s + (p.newTotal - p.oldTotal), 0) * 100) / 100,
        plan: plan.map(p => ({ invoiceNumber: p.invoiceNumber, studentName: p.studentName, period: p.period, oldTotal: p.oldTotal, newTotal: p.newTotal, oldDiscount: p.oldDiscount, newDiscount: p.newDiscount })),
      })
    }

    let updated = 0
    const failed: any[] = []
    for (const p of plan) {
      const r = await fetch(`${PB_URL}/api/collections/invoices/records/${p.invoiceId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: p.items,
          totalAmount: p.newTotal,
          amount: p.newTotal,
          discount: p.newDiscount,
          discountType: p.discountType,
        }),
      })
      if (r.ok) updated++
      else failed.push({ invoiceNumber: p.invoiceNumber, status: r.status })
    }

    return NextResponse.json({
      success: true,
      updated,
      failed,
      count: plan.length,
      delta: Math.round(plan.reduce((s, p) => s + (p.newTotal - p.oldTotal), 0) * 100) / 100,
    })
  } catch (err: any) {
    console.error('[reapply-discounts] 失败:', err)
    return NextResponse.json({ success: false, error: err?.message || '重算折扣失败' }, { status: 500 })
  }
}
