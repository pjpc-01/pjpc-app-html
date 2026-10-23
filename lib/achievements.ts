const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/** 成就计算单源 —— /api/achievements 和 /api/student/home 共用，避免两边算出不同结果。 */
export async function pbGet(token: string, path: string) {
  const r = await fetch(`${PB_URL}/api/collections/${path}`, { headers: { Authorization: token }, cache: 'no-store' })
  return r.ok ? r.json() : { items: [], totalItems: 0 }
}

export type AchievementDef = {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  condition?: string
  sort_order?: number
}

export async function getAchievementDefs(token: string): Promise<AchievementDef[]> {
  const d = await pbGet(token, 'achievements/records?perPage=100&sort=sort_order')
  return (d.items || []).filter((x: any) => x.active !== false)
}

/** 算出某个学生解锁了哪些成就（按真实数据算，不另存表） */
export async function computeEarned(token: string, sid: string) {
  const student = await pbGet(token, `students/records/${sid}`)
  if (!student?.id) return null

  const code = String(student.student_id || '')
  const earned = new Set<string>()

  const firstDonate = await pbGet(token, 'contribution_logs/records?perPage=1&sort=created&filter=' + encodeURIComponent('kind="donate"'))
  if (firstDonate.items?.[0]?.student === sid) earned.add('first_contributor')

  const firstRedeem = await pbGet(token, 'reward_redemptions/records?perPage=1&sort=created')
  if (firstRedeem.items?.[0]?.student === sid) earned.add('first_redeem')

  const logs = await pbGet(token, 'contribution_logs/records?perPage=500&filter=' + encodeURIComponent(`kind="donate" && student="${sid}"`))
  const contributed = (logs.items || []).reduce((a: number, x: any) => a + Number(x.points || 0), 0)
  if (contributed >= 100) earned.add('contributor_100')
  if (contributed >= 500) earned.add('contributor_500')

  if (Number(student.points || 0) >= 500) earned.add('points_500')

  let attendance = 0
  for (const key of [sid, code].filter(Boolean)) {
    const att = await pbGet(token, 'student_attendance/records?perPage=1&fields=id&filter=' + encodeURIComponent(`student_id="${key}" && status="present"`))
    attendance = Math.max(attendance, Number(att.totalItems || 0))
  }
  if (attendance >= 30) earned.add('attendance_30')

  const hw = await pbGet(token, 'homework_submissions/records?perPage=1&fields=id&filter=' + encodeURIComponent(`studentId="${sid}"`))
  const homework = Number(hw.totalItems || 0)
  if (homework >= 10) earned.add('homework_10')

  return { student, earned, contributed, attendance, homework, points: Number(student.points || 0) }
}

/** 已解锁但还没看过的（首页提示用） */
export async function getNewAchievements(token: string, sid: string) {
  const res = await computeEarned(token, sid)
  if (!res) return { earned: new Set<string>(), defs: [] as AchievementDef[], fresh: [] as AchievementDef[], total: 0 }

  const defs = await getAchievementDefs(token)
  let seen: string[] = []
  const raw = (res.student as any)?.achievements_seen
  if (Array.isArray(raw)) seen = raw.map(String)
  else if (typeof raw === 'string' && raw.trim()) {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) seen = p.map(String) } catch { /* 忽略坏的 */ }
  }
  const seenSet = new Set(seen)
  const fresh = defs.filter((d) => res.earned.has(String(d.code)) && !seenSet.has(String(d.code)))

  return { earned: res.earned, defs, fresh, total: defs.length, res }
}
