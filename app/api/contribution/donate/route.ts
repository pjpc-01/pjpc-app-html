import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { earnedFrom, getContributionRate, releaseItemContributions } from '@/lib/contribution'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 学生把普通积分投入中心的升级物品。
 *
 * 院长定的规则：投进去的积分从总积分里扣掉（排行榜会掉），同时按「比率」攒贡献积分
 * （比率在 contribution_settings.points_rate，默认 1:1，管理员可改）。
 * 贡献积分只能换私人物品，不能加回总积分。
 *
 * 安全性：学生只能投自己的（studentId 取登录态，不接受前端传的 id）；
 * 金额必须正整数且不超过当前总积分；物品必须是 active。
 */
export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['student', 'admin'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const isStaff = gate.session.role === 'admin'
  const sid = isStaff ? String(body.studentId || '') : String(gate.session.studentId || '')
  const itemId = String(body.itemId || '')
  const points = Math.floor(Number(body.points || 0))

  if (!sid) return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料，请联系老师' }, { status: 403 })
  if (!itemId) return NextResponse.json({ success: false, error: '没有指定物品' }, { status: 400 })
  if (!Number.isFinite(points) || points <= 0) return NextResponse.json({ success: false, error: '投入积分必须是大于 0 的整数' }, { status: 400 })

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }

    // 1) 学生
    const sRes = await fetch(`${PB_URL}/api/collections/students/records/${encodeURIComponent(sid)}`, { headers: { Authorization: token }, cache: 'no-store' })
    if (!sRes.ok) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })
    const student = await sRes.json()
    const before = Number(student.points || 0)

    if (points > before) {
      return NextResponse.json({ success: false, error: `你的积分只有 ${before}，不能投入 ${points}` }, { status: 400 })
    }

    // 2) 物品
    const iRes = await fetch(`${PB_URL}/api/collections/contribution_items/records/${encodeURIComponent(itemId)}`, { headers: { Authorization: token }, cache: 'no-store' })
    if (!iRes.ok) return NextResponse.json({ success: false, error: '找不到这个物品' }, { status: 404 })
    const item = await iRes.json()
    if ((item.status || 'active') !== 'active') {
      return NextResponse.json({ success: false, error: '这个物品已经结束了' }, { status: 400 })
    }
    const target = Number(item.target_points || 0)
    const current = Number(item.current_points || 0)
    if (target > 0 && current >= target) {
      return NextResponse.json({ success: false, error: '这个物品已经筹集够了' }, { status: 400 })
    }

    // 3) 扣总积分
    const after = before - points
    const uRes = await fetch(`${PB_URL}/api/collections/students/records/${encodeURIComponent(sid)}`, {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ points: after }),
    })
    if (!uRes.ok) return NextResponse.json({ success: false, error: '扣积分失败' }, { status: 500 })

    // 4) 积分流水（负数，留痕）
    await fetch(`${PB_URL}/api/collections/point_logs/records`, {
      method: 'POST', headers: H,
      body: JSON.stringify({
        student: sid, teacher: '', amount: -points,
        reason: `贡献中心物品：${item.name || '-'}`,
        points_before: before, points_after: after,
      }),
    }).catch(() => {})

    // 5) 物品进度 + 投入记录（积分先锁定，物品完成才发放贡献积分）
    const rate = await getContributionRate(token)
    const earned = earnedFrom(points, rate)
    const nextCurrent = current + points
    const reached = target > 0 && nextCurrent >= target

    await fetch(`${PB_URL}/api/collections/contribution_items/records/${encodeURIComponent(itemId)}`, {
      method: 'PATCH', headers: H,
      body: JSON.stringify({
        current_points: nextCurrent,
        ...(reached ? { status: 'achieved' } : {}),
      }),
    }).catch(() => {})

    const logRes = await fetch(`${PB_URL}/api/collections/contribution_logs/records`, {
      method: 'POST', headers: H,
      body: JSON.stringify({
        student: sid, student_name: student.name || '',
        item: itemId, item_name: item.name || '',
        points, kind: 'donate', center: student.center || '',
        note: String(body.note || '').slice(0, 200),
        // 锁定：物品完成前不发贡献积分，删/下架就把这 points 全数退回（lib/contribution.ts）
        status: 'pending',
        rate,
        earned,
      }),
    })
    if (!logRes.ok) {
      // 记录写不进去就把积分加回去，不能让学生的分数凭空少掉
      await fetch(`${PB_URL}/api/collections/students/records/${encodeURIComponent(sid)}`, {
        method: 'PATCH', headers: H, body: JSON.stringify({ points: before }),
      }).catch(() => {})
      return NextResponse.json({ success: false, error: '记录投入失败，积分已退回，请再试一次' }, { status: 500 })
    }

    // 6) 筹够了 → 把锁定的贡献积分发给所有投入的人
    let released: any = null
    if (reached) {
      released = await releaseItemContributions(token, itemId, student.name || 'system')
    }

    return NextResponse.json({
      success: true,
      points_before: before,
      points_after: after,
      contributed: points,
      rate,
      earned_pending: earned,          // 锁住的贡献积分（物品完成才入账）
      released_now: reached,
      released,                        // 本次触发的发放结果（rows/granted/students）
      item: { id: itemId, name: item.name, current_points: nextCurrent, target_points: target },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '操作失败' }, { status: 500 })
  }
}
