import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 贡献积分总览。
 *
 * 规则（2026-10-23 院长定的）：
 *  - 中心放「升级物品」（电子琴、懒人椅…），标目标积分；
 *  - 学生拿自己的普通积分投入 → 总积分真的扣掉（排行榜会掉）；
 *  - 投入多少就攒多少「贡献积分」（1:1）；
 *  - 贡献积分只能拿去换私人物品，不能加回总积分。
 *
 * 贡献积分余额 = 累计投入 − 未被拒绝的兑换占用。
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['student', 'admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const isStaff = gate.session.role !== 'student'
  const sid = isStaff ? String(searchParams.get('studentId') || '') : String(gate.session.studentId || '')
  if (!isStaff && !sid) {
    return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料，请联系老师' }, { status: 403 })
  }

  try {
    const token = await getAdminToken()
    const H = { Authorization: token }
    const get = async (path: string) => {
      const r = await fetch(`${PB_URL}/api/collections/${path}`, { headers: H, cache: 'no-store' })
      return r.ok ? r.json() : { items: [] }
    }

    const [items, rewards, myLogs, myRedemptions] = await Promise.all([
      get('contribution_items/records?perPage=100&sort=sort_order,name'),
      get('reward_items/records?perPage=100&sort=sort_order,name'),
      sid ? get(`contribution_logs/records?perPage=100&sort=-created&filter=${encodeURIComponent(`student="${sid}"`)}`) : { items: [] },
      sid ? get(`reward_redemptions/records?perPage=100&sort=-created&filter=${encodeURIComponent(`student="${sid}"`)}`) : { items: [] },
    ])

    let student: any = null
    if (sid) {
      const r = await fetch(`${PB_URL}/api/collections/students/records/${encodeURIComponent(sid)}`, { headers: H, cache: 'no-store' })
      if (r.ok) student = await r.json()
    }

    const donated = (myLogs.items || []).filter((x: any) => x.kind === 'donate').reduce((a: number, x: any) => a + Number(x.points || 0), 0)
    const spent = (myRedemptions.items || [])
      .filter((x: any) => x.status !== 'rejected')
      .reduce((a: number, x: any) => a + Number(x.cost || 0), 0)

    // 员工看全部待审批兑换
    const allPending = isStaff ? await get(`reward_redemptions/records?perPage=100&sort=-created&filter=${encodeURIComponent('status="pending"')}`) : { items: [] }

    return NextResponse.json({
      success: true,
      student: student ? {
        id: student.id, name: student.name, student_id: student.student_id,
        grade: student.grade, center: student.center, points: Number(student.points || 0),
      } : null,
      balance: {
        contributed: donated,
        spent,
        available: donated - spent,
        points_now: Number(student?.points || 0),
      },
      items: (items.items || []).map((x: any) => ({
        id: x.id, name: x.name, description: x.description || '', center: x.center || '',
        image_url: x.image ? `/api/pocketbase-proxy/api/files/${x.collectionId}/${x.id}/${x.image}` : '',
        target_points: Number(x.target_points || 0),
        current_points: Number(x.current_points || 0),
        status: x.status || 'active',
        progress: Number(x.target_points || 0) > 0 ? Math.min(100, Math.round((Number(x.current_points || 0) / Number(x.target_points)) * 100)) : 0,
      })),
      rewards: (rewards.items || []).map((x: any) => ({
        id: x.id, name: x.name, description: x.description || '', cost_points: Number(x.cost_points || 0),
        image_url: x.image ? `/api/pocketbase-proxy/api/files/${x.collectionId}/${x.id}/${x.image}` : '',
        stock: x.stock === undefined || x.stock === null ? null : Number(x.stock), status: x.status || 'active',
      })),
      my_logs: myLogs.items || [],
      my_redemptions: myRedemptions.items || [],
      pending_redemptions: allPending.items || [],
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
