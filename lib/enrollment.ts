/**
 * 「这个学生算不算在读、要不要参加点名」的唯一判据。
 *
 * 为什么要有这个文件：点名名册、缺勤自动扣分、积分榜 各自写各的过滤条件，
 * 一处漏了就出事 —— 2026-11-20 实证：明年新生 许宸嫣 的 points_enabled 是 true，
 * 缺勤 cron 只按 status='active' && points_enabled=true 选人，结果她连扣 4 天 −3，
 * 而人根本还没入学。
 *
 * 规则：
 *  - status 必须是 active
 *  - 学号 MMA 开头 = 只上拳课，不参加安亲班点名、不参与积分
 *  - 年级「明年新生」= 预留学额，还没来，不点名也不扣分
 *  - points_enabled === false = 该学生不参与积分
 */

export const COURSE_ONLY_PREFIXES = ['MMA']

/** 只上课程（拳课）的学生：不点名、不积分 */
export function isCourseOnly(s: any): boolean {
  const sid = String(s?.student_id || '').toUpperCase()
  return COURSE_ONLY_PREFIXES.some((p) => sid.startsWith(p))
}

/** 明年新生：已建档但还没入学 */
export function isPreEnrolled(s: any): boolean {
  const g = String(s?.grade || '').trim()
  return g === '明年新生' || g.toLowerCase() === 'upcoming'
}

/** 该学生今天要不要被点名 / 被算缺勤 */
export function isAttendable(s: any): boolean {
  if (!s) return false
  if ((s.status || 'active') !== 'active') return false
  if (isCourseOnly(s)) return false
  if (isPreEnrolled(s)) return false
  return true
}

/** 该学生要不要参与积分（点名的加减分） */
export function participatesInPoints(s: any): boolean {
  return isAttendable(s) && s?.points_enabled !== false
}
