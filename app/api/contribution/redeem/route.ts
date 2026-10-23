import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 学生用「贡献积分」兑换私人物品。
 *
 * 贡献积分 = 累计投入中心物品的分数 − 已占用（待审批/已批/已领）。
 * 兑换先进待审批，由老师/管理员在「贡献兑换」页审批；被拒绝的会退回额度。
 */
export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['student', 'admin'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const isStaff = gate.session.role === 'admin'
  const sid = isStaff ? String(body.studentId || '') : String(gate.session.studentId || '')
  const itemId = String(body.itemId || '')
  if (!sid) return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料，请联系老师' }, { status: 403 })
  if (!itemId) return NextResponse.json({ success: false, error: '没有指定物品' }, { status: 400 })

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }
    const get = async (path: string) => {
      const r = await fetch(`${PB_URL}/api/collections/${path}`, { headers: { Authorization: token }, cache: 'no-store' })
      return r.ok ? r.json() : { items: [] }
    }

    const [student, item, logs, reds] = await Promise.all([
      (async () => {
        const r = await fetch(`${PB_URL}/api/collections/students/records/${encodeURIComponent(sid)}`, { headers: { Authorization: token }, cache: 'no-store' })
        return r.ok ? r.json() : null
      })(),
      (async () => {
        const r = await fetch(`${PB_URL}/api/collections/reward_items/records/${encodeURIComponent(itemId)}`, { headers: { Authorization: token }, cache: 'no-store' })
        return r.ok ? r.json() : null
      })(),
      get(`contribution_logs/records?perPage=200&filter=${encodeURIComponent(`student="${sid}" && kind="donate"`)}`),
      get(`reward_redemptions/records?perPage=200&filter=${encodeURIComponent(`student="${sid}"`)}`),
    ])

    if (!student) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })
    if (!item) return NextResponse.json({ success: false, error: '找不到这个物品' }, { status: 404 })
    if ((item.status || 'active') !== 'active') return NextResponse.json({ success: false, error: '这个物品已经下架了' }, { status: 400 })
    if (item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0) {
      return NextResponse.json({ success: false, error: '这个物品已经换完了' }, { status: 400 })
    }

    const donated = (logs.items || []).reduce((a: number, x: any) => a + Number(x.points || 0), 0)
    const spent = (reds.items || []).filter((x: any) => x.status !== 'rejected').reduce((a: number, x: any) => a + Number(x.cost || 0), 0)
    const available = donated - spent
    const cost = Number(item.cost_points || 0)

    if (cost <= 0) return NextResponse.json({ success: false, error: '这个物品没有标价，请联系老师' }, { status: 400 })
    if (cost > available) {
      return NextResponse.json({ success: false, error: `你的贡献积分只有 ${available}，不够换这个（要 ${cost}）` }, { status: 400 })
    }

    const rRes = await fetch(`${PB_URL}/api/collections/reward_redemptions/records`, {
      method: 'POST', headers: H,
      body: JSON.stringify({
        student: sid, student_name: student.name || '',
        item: itemId, item_name: item.name || '',
        cost, status: 'pending', note: String(body.note || '').slice(0, 200),
      }),
    })
    if (!rRes.ok) {
      const b = await rRes.json().catch(() => ({}))
      return NextResponse.json({ success: false, error: b?.message || '提交兑换失败' }, { status: 500 })
    }
    const rec = await rRes.json()

    return NextResponse.json({
      success: true,
      redemption: rec,
      balance: { contributed: donated, spent: spent + cost, available: available - cost },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '操作失败' }, { status: 500 })
  }
}
