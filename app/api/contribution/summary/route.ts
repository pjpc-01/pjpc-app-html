import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { getContributionRate, pendingRedeemCost, lockedPointsOf } from '@/lib/contribution'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 贡献积分总览。
 *
 * 规则（2026-10-23 院长定的）：
 *  - 中心放「升级物品」（电子琴、懒人椅…），标目标积分；
 *  - 学生拿自己的普通积分投入 → 总积分真的扣掉（排行榜会掉）；
 *  - 投入的分 × 比率 = 得到的「贡献积分」（比率在 contribution_settings，管理员可改）；
 *  - 贡献积分只能拿去换私人物品，不能加回总积分。
 *
 * 贡献积分余额 = students.contribution_points（每笔变动都在 contribution_point_logs）。
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

    const [items, rewards, myLogs, myRedemptions, allDonate, myPointLogs, rate] = await Promise.all([
      get('contribution_items/records?perPage=100&sort=sort_order,name'),
      get('reward_items/records?perPage=100&sort=sort_order,name'),
      sid ? get(`contribution_logs/records?perPage=100&sort=-created&filter=${encodeURIComponent(`student="${sid}"`)}`) : { items: [] },
      sid ? get(`reward_redemptions/records?perPage=100&sort=-created&filter=${encodeURIComponent(`student="${sid}"`)}`) : { items: [] },
      get(`contribution_logs/records?perPage=500&fields=student,points,kind,center&filter=${encodeURIComponent('kind="donate"')}`),
      sid ? get(`contribution_point_logs/records?perPage=100&sort=-created&filter=${encodeURIComponent(`student="${sid}"`)}`) : { items: [] },
      getContributionRate(token),
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
    const balanceNow = Number(student?.contribution_points || 0)
    const held = sid ? await pendingRedeemCost(token, sid) : 0
    const pointLogs = myPointLogs.items || []
    const earnedTotal = pointLogs.filter((x: any) => Number(x.amount) > 0).reduce((a: number, x: any) => a + Number(x.amount || 0), 0)

    // 全体贡献：算自己的占比（贡献程度）
    const communityTotal = (allDonate.items || []).reduce((a: number, x: any) => a + Number(x.points || 0), 0)
    const contributors = new Set((allDonate.items || []).map((x: any) => String(x.student || '')).filter(Boolean)).size
    const myPercent = communityTotal > 0 && donated > 0 ? Math.round((donated / communityTotal) * 1000) / 10 : 0
    const myCenter = String(student?.center || '').trim()
    const centerTotal = (allDonate.items || [])
      .filter((x: any) => String(x.center || '').trim() === myCenter)
      .reduce((a: number, x: any) => a + Number(x.points || 0), 0)
    const myCenterPercent = centerTotal > 0 && donated > 0 ? Math.round((donated / centerTotal) * 1000) / 10 : 0

    // 员工看全部待审批兑换
    const allPending = isStaff ? await get(`reward_redemptions/records?perPage=100&sort=-created&filter=${encodeURIComponent('status="pending"')}`) : { items: [] }

    return NextResponse.json({
      success: true,
      student: student ? {
        id: student.id, name: student.name, student_id: student.student_id,
        grade: student.grade, center: student.center, points: Number(student.points || 0),
      } : null,
      rate,
      balance: {
        contributed: donated,
        spent,
        earned: earnedTotal,
        balance: balanceNow,
        held,
        available: balanceNow - held,
        points_now: Number(student?.points || 0),
        // 还在锁定中的投入（物品完成才发放贡献积分，下架会全数退回）
        locked: student ? await lockedPointsOf(token, student.id) : { points: 0, willEarn: 0 },
      },
      my_point_logs: pointLogs.map((x: any) => ({
        id: x.id, amount: Number(x.amount || 0), kind: x.kind || '',
        donate_points: Number(x.donate_points || 0), rate: Number(x.rate || 0),
        balance_after: Number(x.balance_after || 0), note: x.note || '',
        operator: x.operator || '', center: x.center || '', created: x.created || '',
      })),
      community: {
        total_points: communityTotal,
        contributors,
        my_percent: myPercent,
        center: myCenter,
        center_total_points: centerTotal,
        my_center_percent: myCenterPercent,
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
      // 我给哪个物品投了多少（按物品汇总，带锁定/已发放/已退回状态）
      my_donations: await (async () => {
        if (!student?.id) return []
        const myDonationLogs = await get(
          `contribution_logs/records?perPage=200&sort=-created&filter=${encodeURIComponent(`student="${student.id}" && kind="donate"`)}`
        )
        const map = new Map<string, any>()
        for (const x of myDonationLogs.items || []) {
          const key = String(x.item || x.item_name || '')
          const cur = map.get(key) || {
            itemId: x.item || '', itemName: x.item_name || '-',
            points: 0, earned: 0, times: 0,
            pending: 0, released: 0, refunded: 0,
            status: 'pending', last: x.created || '',
          }
          cur.points += Number(x.points || 0)
          cur.earned += Number(x.earned || 0)
          cur.times += 1
          cur[String(x.status || 'pending')] += 1
          if (String(x.created || '') > String(cur.last || '')) cur.last = x.created
          map.set(key, cur)
        }
        return [...map.values()]
          .map(x => ({
            ...x,
            // 整件物品的状态：全退回 = refunded，全发放 = released，否则 pending（部分锁定）
            status: x.pending > 0 ? 'pending' : (x.refunded === x.times ? 'refunded' : 'released'),
          }))
          .sort((a, b) => String(b.last).localeCompare(String(a.last)))
      })(),
      my_redemptions: myRedemptions.items || [],
      pending_redemptions: allPending.items || [],
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
