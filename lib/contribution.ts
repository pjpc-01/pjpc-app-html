import { notify } from '@/lib/notify'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 贡献积分的共用逻辑（单源）。
 *
 * 规则：
 *  - 学生把总积分投进中心物品 → 总积分扣掉（contribution_logs 记一笔）
 *  - 得到「贡献积分」= 投入分 × 比率（比率在 contribution_settings.points_rate，管理员可改）
 *  - 贡献积分只能换私人物品；每次加减都写 contribution_point_logs，余额存 students.contribution_points
 */

export async function pbGet(token: string, path: string) {
  const r = await fetch(`${PB_URL}/api/collections/${path}`, { headers: { Authorization: token }, cache: 'no-store' })
  return r.ok ? r.json() : { items: [], totalItems: 0 }
}

/** 现在的比率（没有设置就 1:1） */
export async function getContributionRate(token: string): Promise<number> {
  const d = await pbGet(token, `contribution_settings/records?perPage=1&sort=-updated`)
  const raw = d.items?.[0]?.points_rate
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : 1
}

/** 投入 100 分、比率 0.8 → 80 贡献积分（四舍五入） */
export const earnedFrom = (points: number, rate: number) => Math.round(Number(points || 0) * Number(rate ?? 1))

/**
 * 记一笔贡献积分流水并同步余额。
 * 传 baseBalance（调用方刚读到的余额）避免并发覆盖；不传就现查。
 */
export async function addContributionPoints(token: string, opts: {
  studentId: string
  studentName?: string
  amount: number
  kind: 'donate' | 'redeem' | 'refund' | 'adjust'
  donatePoints?: number
  rate?: number
  note?: string
  operator?: string
  center?: string
  baseBalance?: number
}): Promise<{ balance: number; logId: string }> {
  const H = { 'Content-Type': 'application/json', Authorization: token }
  const stu = await pbGet(token, `students/records/${opts.studentId}`)
  if (!stu?.id) throw new Error('找不到学生资料')

  const before = Number(opts.baseBalance ?? stu.contribution_points ?? 0)
  const after = before + Number(opts.amount || 0)

  const r = await fetch(`${PB_URL}/api/collections/contribution_point_logs/records`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      student: opts.studentId,
      student_name: opts.studentName || stu.name || '',
      amount: Number(opts.amount || 0),
      kind: opts.kind,
      donate_points: Number(opts.donatePoints || 0),
      rate: Number(opts.rate ?? 1),
      balance_after: after,
      note: opts.note || '',
      operator: opts.operator || '',
      center: opts.center || stu.center || '',
    }),
  })
  if (!r.ok) throw new Error('写贡献积分流水失败')
  const log = await r.json()

  await fetch(`${PB_URL}/api/collections/students/records/${opts.studentId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ contribution_points: after }),
  })

  return { balance: after, logId: log.id }
}

/** 待批兑换占用的贡献积分（防止超额申请） */
export async function pendingRedeemCost(token: string, studentId: string): Promise<number> {
  const d = await pbGet(token, `reward_redemptions/records?perPage=200&filter=${encodeURIComponent(`student="${studentId}" && status="pending"`)}`)
  return (d.items || []).reduce((a: number, x: any) => a + Number(x.cost || 0), 0)
}

// ── 投入积分的「锁定 → 发放 / 退回」 ──
//
// 院长 2026-10-28 定的规则：学生把积分投进中心物品时，积分先从总积分扣掉并**锁住**，
// 贡献积分要等物品完成（筹够）才发；物品在完成前被删除或下架，投进去的积分**全数退回**。
// 所有中间状态记在 contribution_logs.status：pending（锁定）/ released（已发放）/ refunded（已退回）。

/** 某个物品还没结算（还在锁定中）的投入记录 */
export async function pendingItemContributions(token: string, itemId: string): Promise<any[]> {
  const d = await pbGet(
    token,
    `contribution_logs/records?perPage=500&filter=${encodeURIComponent(`item="${itemId}" && kind="donate" && status="pending"`)}`
  )
  return d.items || []
}

/** 物品完成 → 把锁定的贡献积分按各自比率发给投入的学生 */
export async function releaseItemContributions(
  token: string,
  itemId: string,
  operator = 'system'
): Promise<{ rows: number; granted: number; students: number; failed: number }> {
  const rows = await pendingItemContributions(token, itemId)
  const H = { 'Content-Type': 'application/json', Authorization: token }
  let granted = 0, students = 0, failed = 0

  for (const r of rows) {
    const sid = String(r.student || '')
    const earned = Number(r.earned || 0)
    try {
      if (sid && earned > 0) {
        await addContributionPoints(token, {
          studentId: sid,
          studentName: r.student_name || '',
          amount: earned,
          kind: 'donate',
          donatePoints: Number(r.points || 0),
          rate: Number(r.rate ?? 1),
          note: `物品完成入账：「${r.item_name || '-'}」`,
          operator,
          center: r.center || '',
        })
        granted += earned
        students++
        await notify(token, {
          studentId: sid,
          title: '物品完成，贡献积分已入账',
          body: `「${r.item_name || '-'}」+${earned} 贡献积分`,
          kind: 'contribution',
          link: '/my/contribution',
          actor: operator,
          center: r.center || '',
        })
      }
      await fetch(`${PB_URL}/api/collections/contribution_logs/records/${r.id}`, {
        method: 'PATCH', headers: H,
        body: JSON.stringify({ status: 'released', settled_at: new Date().toISOString() }),
      })
    } catch {
      failed++
    }
  }
  return { rows: rows.length, granted, students, failed }
}

/** 物品完成前被删除 / 下架 → 投进去的普通积分全数退回 */
export async function refundItemContributions(
  token: string,
  itemId: string,
  reason = '物品未完成',
  operator = 'system'
): Promise<{ rows: number; refunded: number; students: number; failed: number }> {
  const rows = await pendingItemContributions(token, itemId)
  const H = { 'Content-Type': 'application/json', Authorization: token }
  let refunded = 0, students = 0, failed = 0

  for (const r of rows) {
    const sid = String(r.student || '')
    const pts = Number(r.points || 0)
    try {
      if (sid && pts > 0) {
        const stu = await pbGet(token, `students/records/${sid}`)
        if (stu?.id) {
          const before = Number(stu.points || 0)
          const after = before + pts
          await fetch(`${PB_URL}/api/collections/students/records/${sid}`, {
            method: 'PATCH', headers: H, body: JSON.stringify({ points: after }),
          })
          await fetch(`${PB_URL}/api/collections/point_logs/records`, {
            method: 'POST', headers: H,
            body: JSON.stringify({
              student: sid, teacher: '', amount: pts,
              reason: `${reason}：退回「${r.item_name || '-'}」投入的 ${pts} 分`,
              points_before: before, points_after: after,
            }),
          }).catch(() => {})
          refunded += pts
          students++
          await notify(token, {
            studentId: sid,
            title: '物品未完成，投入的积分已退回',
            body: `「${r.item_name || '-'}」退回 ${pts} 分${reason ? '（' + reason + '）' : ''}`,
            kind: 'contribution',
            link: '/my/contribution',
            actor: operator,
            center: r.center || '',
          })
        }
      }
      await fetch(`${PB_URL}/api/collections/contribution_logs/records/${r.id}`, {
        method: 'PATCH', headers: H,
        body: JSON.stringify({ status: 'refunded', settled_at: new Date().toISOString() }),
      })
    } catch {
      failed++
    }
  }
  return { rows: rows.length, refunded, students, failed }
}

/** 学生被锁住的投入分（还没结算）→ 用于学生页提示「X 分等物品完成才入账」 */
export async function lockedPointsOf(token: string, studentId: string): Promise<{ points: number; willEarn: number }> {
  const d = await pbGet(
    token,
    `contribution_logs/records?perPage=500&filter=${encodeURIComponent(`student="${studentId}" && kind="donate" && status="pending"`)}`
  )
  const rows = d.items || []
  return {
    points: rows.reduce((a: number, x: any) => a + Number(x.points || 0), 0),
    willEarn: rows.reduce((a: number, x: any) => a + Number(x.earned || 0), 0),
  }
}
