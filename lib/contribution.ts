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
