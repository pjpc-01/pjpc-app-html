import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { pbGet, refundItemContributions, releaseItemContributions } from '@/lib/contribution'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 删除贡献物品。
 *
 * DELETE ?type=upgrade|reward&id=xxx[&force=1]
 *
 * upgrade = 中心的升级物品（contribution_items）
 * reward  = 可兑换的私人物品（reward_items）
 *
 * 安全规则：
 *  - 升级物品已经有人投入过（current_points > 0 或有投入记录）→ 没带 force=1 就返回 409，
 *    让界面先告诉老师「这个物品已经有人投入 N 分，确定删吗」，确认后再带 force 删。
 *  - 私人物品还有待审批的兑换申请 → 同样要 force。
 *  - 投入记录（contribution_logs）不删，历史留着；物品没了那些记录仍能查到名字。
 */
export async function DELETE(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const type = String(searchParams.get('type') || '')
  const id = String(searchParams.get('id') || '')
  const force = ['1', 'true', 'yes'].includes(String(searchParams.get('force') || '').toLowerCase())

  if (!id) return NextResponse.json({ success: false, error: '要指定物品' }, { status: 400 })
  if (type !== 'upgrade' && type !== 'reward') {
    return NextResponse.json({ success: false, error: '类型只能是 upgrade 或 reward' }, { status: 400 })
  }

  const collection = type === 'upgrade' ? 'contribution_items' : 'reward_items'

  try {
    const token = await getAdminToken()
    const item = await pbGet(token, `${collection}/records/${id}`)
    if (!item?.id) return NextResponse.json({ success: false, error: '这个物品已经不存在' }, { status: 404 })

    // 有投入 / 有待批申请 → 要确认
    if (!force) {
      if (type === 'upgrade') {
        const donated = Number(item.current_points || 0)
        let donors = 0
        if (donated > 0) {
          const d = await pbGet(
            token,
            `contribution_logs/records?perPage=200&filter=${encodeURIComponent(`item="${id}" && kind="donate"`)}`
          )
          donors = new Set((d.items || []).map((x: any) => x.student)).size
        }
        if (donated > 0) {
          return NextResponse.json({
            success: false, need_confirm: true,
            error: donors > 0
              ? `这个物品已经有人投入 ${donated} 分（${donors} 人），删掉后这些投入不会退回`
              : `这个物品的进度已经有 ${donated} 分，删掉后不会退回`,
            donated, donors, name: item.name || '',
          }, { status: 409 })
        }
      } else {
        const d = await pbGet(
          token,
          `reward_redemptions/records?perPage=200&filter=${encodeURIComponent(`item="${id}" && status="pending"`)}`
        )
        const n = (d.items || []).length
        if (n > 0) {
          return NextResponse.json({
            success: false, need_confirm: true,
            error: `这个物品还有 ${n} 条待审批的兑换申请，删掉后这些申请会作废`,
            pending: n, name: item.name || '',
          }, { status: 409 })
        }
      }
    }

    // 升级物品在完成前被删除 → 投进去的积分全数退回学生（院长 2026-10-28 的规则）
    let refunded: any = null
    if (type === 'upgrade') {
      refunded = await refundItemContributions(token, id, `物品「${item.name || ''}」未完成已删除`, gate.session.name || 'system')
    }

    const r = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    })
    if (!r.ok && r.status !== 204) {
      const t = await r.text().catch(() => '')
      return NextResponse.json({ success: false, error: `删除失败（${r.status}）${t.slice(0, 80)}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: { id, name: item.name || '', type }, refunded })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '删除失败' }, { status: 500 })
  }
}

/**
 * 关掉或标记完成物品。
 *
 * PATCH ?type=upgrade&id=xxx   body { action: 'close' | 'complete' }
 *
 * close     = 下架：投进去的积分全数退回，进度清零（院长 2026-10-28 的规则）
 * complete  = 手动标记完成：把锁定的贡献积分发给投入的学生
 */
export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const type = String(searchParams.get('type') || 'upgrade')
  const id = String(searchParams.get('id') || '')
  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }
  const action = String(body.action || '')

  if (type !== 'upgrade') return NextResponse.json({ success: false, error: '只有中心物品需要这个操作' }, { status: 400 })
  if (!id) return NextResponse.json({ success: false, error: '要指定物品' }, { status: 400 })
  if (!['close', 'complete', 'received'].includes(action)) {
    return NextResponse.json({ success: false, error: 'action 只能是 close / complete / received' }, { status: 400 })
  }

  try {
    const token = await getAdminToken()
    const item = await pbGet(token, `contribution_items/records/${id}`)
    if (!item?.id) return NextResponse.json({ success: false, error: '这个物品已经不存在' }, { status: 404 })

    if (action === 'close') {
      const refunded = await refundItemContributions(token, id, `物品「${item.name || ''}」已下架`, gate.session.name || 'system')
      const r = await fetch(`${PB_URL}/api/collections/contribution_items/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ status: 'closed', current_points: 0 }),
      })
      if (!r.ok) throw new Error(`下架失败（${r.status}）`)
      return NextResponse.json({ success: true, action, refunded })
    }

    // received：物品达成后校长/老师领了回来，留一条记录（谁、什么时候、备注）
    if (action === 'received') {
      const payload = {
        received_at: new Date().toISOString(),
        received_by: gate.session.name || gate.session.role || '',
        received_note: String(body.note || '').slice(0, 300),
      }
      const rr = await fetch(`${PB_URL}/api/collections/contribution_items/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify(payload),
      })
      if (!rr.ok) throw new Error(`记录领取失败（${rr.status}）`)
      return NextResponse.json({ success: true, action, received: payload })
    }

    // complete
    const r = await fetch(`${PB_URL}/api/collections/contribution_items/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ status: 'achieved' }),
    })
    if (!r.ok) throw new Error(`标记完成失败（${r.status}）`)
    const released = await releaseItemContributions(token, id, gate.session.name || 'system')
    return NextResponse.json({ success: true, action, released })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '操作失败' }, { status: 500 })
  }
}
