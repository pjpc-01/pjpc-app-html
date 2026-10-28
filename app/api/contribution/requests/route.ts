import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { addContributionPoints } from '@/lib/contribution'
import { notify } from '@/lib/notify'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 老师/管理员审批兑换申请：approved / rejected / delivered。
 *
 * 批准：扣库存 + 扣学生贡献积分（写 contribution_point_logs）
 * 拒绝：不扣库存；如果之前批准过（已扣贡献积分），退回（写 refund 流水）
 * 已领（delivered）之后不能再改。
 */
export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const id = String(body.id || '')
  const status = String(body.status || '')
  if (!id) return NextResponse.json({ success: false, error: '没有指定申请' }, { status: 400 })
  if (!['approved', 'rejected', 'delivered'].includes(status)) {
    return NextResponse.json({ success: false, error: '状态不对' }, { status: 400 })
  }

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }

    const rRes = await fetch(`${PB_URL}/api/collections/reward_redemptions/records/${encodeURIComponent(id)}`, { headers: { Authorization: token }, cache: 'no-store' })
    if (!rRes.ok) return NextResponse.json({ success: false, error: '找不到这个申请' }, { status: 404 })
    const rec = await rRes.json()
    if (rec.status === 'delivered') return NextResponse.json({ success: false, error: '这个已经领走了' }, { status: 400 })

    const u = await fetch(`${PB_URL}/api/collections/reward_redemptions/records/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: H, body: JSON.stringify({ status }),
    })
    if (!u.ok) return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 })

    // 贡献积分：批准时扣，从已批改回拒绝时退
    const wasApproved = rec.status === 'approved'
    const cost = Number(rec.cost || rec.cost_points || 0)
    if (status === 'approved' && !wasApproved && cost > 0 && rec.student) {
      try {
        await addContributionPoints(token, {
          studentId: String(rec.student),
          studentName: rec.student_name || '',
          amount: -cost,
          kind: 'redeem',
          note: `兑换「${rec.item_name || '-'}」`,
          operator: gate.session.name || gate.session.role,
        })
      } catch { /* 扣不到就放过，管理端可在贡献积分流水里补 */ }
    }
    if (status === 'rejected' && wasApproved && cost > 0 && rec.student) {
      try {
        await addContributionPoints(token, {
          studentId: String(rec.student),
          studentName: rec.student_name || '',
          amount: cost,
          kind: 'refund',
          note: `退回兑换「${rec.item_name || '-'}」`,
          operator: gate.session.name || gate.session.role,
        })
      } catch { /* 同上 */ }
    }

    // 批准时扣库存
    if (status === 'approved' && rec.item) {
      const iRes = await fetch(`${PB_URL}/api/collections/reward_items/records/${encodeURIComponent(rec.item)}`, { headers: { Authorization: token }, cache: 'no-store' })
      if (iRes.ok) {
        const item = await iRes.json()
        if (item.stock !== undefined && item.stock !== null) {
          const next = Math.max(0, Number(item.stock) - 1)
          await fetch(`${PB_URL}/api/collections/reward_items/records/${encodeURIComponent(rec.item)}`, {
            method: 'PATCH', headers: H, body: JSON.stringify({ stock: next }),
          }).catch(() => {})
        }
      }
    }

    // 结果通知学生（站内铃铛）
    await notify(token, {
      studentId: String(rec.student || ''),
      title: status === 'approved' ? '兑换申请已批准' : status === 'rejected' ? '兑换申请被拒绝' : '兑换已领取',
      body: `${rec.item_name || '物品'}${status === 'rejected' ? '：贡献积分已退回' : status === 'approved' ? '：可以来领取了' : '：已记录领取'}`,
      kind: 'redemption',
      link: '/my/contribution',
      actor: gate.session.name || gate.session.role || '',
    })

    return NextResponse.json({ success: true, id, status })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '操作失败' }, { status: 500 })
  }
}
