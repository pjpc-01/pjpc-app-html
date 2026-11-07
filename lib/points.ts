/**
 * 学生积分（students.points）的唯一写入口。
 *
 * 以前每个入口各写一套「读 → 加 → 写回」，四个问题：
 *   1. 并发丢分：两个老师同时加分，后写覆盖前写，谁也不知道丢了多少。
 *   2. 写失败照样返回成功：PATCH 不看返回码，分数没改却报成功。
 *   3. 有的入口根本不写流水（/api/points 加分只改分数）→ 总分和流水对不上。
 *   4. 去重靠「先查后写」，窗口内并发能重复发。
 *
 * 这里统一：同一学生串行加锁 → 锁内重读最新分 → 写分数 → 写完回读校验 → 必须写流水，
 * 流水写失败就把分数回滚。任何一步失败都抛错，不许静默成功。
 *
 * 注意：不做「扣到 0 为止」这种业务决定。要不要允许负分由老板定，
 * 各入口用 floorAtZero 保持自己原来的语义，别在这里偷偷改规则。
 */
import { getAdminToken } from './pb-admin-token'
import { validatePointsDelta } from './points-guard'

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

async function pb(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...init,
    headers: { Authorization: token, 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  })
  const text = await res.text().catch(() => '')
  if (!res.ok) throw new Error(`PocketBase ${res.status} ${path} ${text.slice(0, 180)}`)
  return text ? JSON.parse(text) : {}
}

/** 同一学生串行，防止并发覆盖 */
const locks = new Map<string, Promise<unknown>>()
async function withStudentLock<T>(studentId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(studentId) || Promise.resolve()
  let release: () => void = () => {}
  const gate = new Promise<void>((r) => (release = r))
  const chained = prev.then(() => gate)
  locks.set(studentId, chained)
  await prev.catch(() => {})
  try {
    return await fn()
  } finally {
    release()
    if (locks.get(studentId) === chained) locks.delete(studentId)
  }
}

/** 本地「今天」的 UTC 区间（point_logs.created 是 UTC） */
function localDayRangeUtc(offsetHours = 8) {
  const now = new Date()
  const local = new Date(now.getTime() + offsetHours * 3600_000)
  const y = local.getUTCFullYear(), m = local.getUTCMonth(), d = local.getUTCDate()
  const startUtc = new Date(Date.UTC(y, m, d) - offsetHours * 3600_000)
  const endUtc = new Date(startUtc.getTime() + 86_400_000)
  const fmt = (x: Date) => x.toISOString().slice(0, 19).replace('T', ' ')
  return { start: fmt(startUtc), end: fmt(endUtc) }
}

export type PointsResult = {
  studentId: string
  studentName: string
  before: number
  after: number
  applied: number
  logId: string
  skipped?: string
}

export type ApplyPointsOptions = {
  studentId: string
  delta: number
  reason: string
  teacherId?: string
  /** 同一学生同一天、reason 命中这些关键词的，视为已发过（考勤用） */
  dedupeTerms?: string[]
  /** 扣分不允许低于 0（保持原入口语义） */
  floorAtZero?: boolean
  /** 已读到的学生资料，省一次查询；锁内会重读，不信任这份 */
  _hint?: any
  token?: string
}

/**
 * 给一个学生加/减分。要么完整成功（分数 + 流水都写进去），要么抛错。
 */
export async function applyPoints(opts: ApplyPointsOptions): Promise<PointsResult> {
  const err = validatePointsDelta(opts.delta)
  if (err) throw Object.assign(new Error(err), { httpStatus: 400 })
  if (!opts.reason || !String(opts.reason).trim()) {
    throw Object.assign(new Error('必须写原因（reason）'), { httpStatus: 400 })
  }

  const token = opts.token || (await getAdminToken())

  return withStudentLock(opts.studentId, async () => {
    // 锁内重读，永远基于最新值
    const student = await pb(`/api/collections/students/records/${opts.studentId}`, token)
    if (!student?.id) throw Object.assign(new Error('学生不存在'), { httpStatus: 404 })
    if (student.points_enabled === false) {
      throw Object.assign(new Error('这个学生的积分系统已关闭'), { httpStatus: 403 })
    }

    // 当日同类型去重：锁内查，避免两个并发请求都通过
    if (opts.dedupeTerms?.length) {
      const { start, end } = localDayRangeUtc()
      const termExpr = opts.dedupeTerms.map((t) => `reason ~ "${t}"`).join(' || ')
      const filter = `student="${opts.studentId}" && created >= "${start}" && created < "${end}" && (${termExpr})`
      const existing = await pb(`/api/collections/point_logs/records?perPage=1&filter=${encodeURIComponent(filter)}`, token)
      if ((existing.items || []).length > 0) {
        return {
          studentId: opts.studentId,
          studentName: student.name || '',
          before: Number(student.points || 0),
          after: Number(student.points || 0),
          applied: 0,
          logId: '',
          skipped: '今日同类积分已发放',
        }
      }
    }

    const before = round2(student.points || 0)
    let after = round2(before + Number(opts.delta))
    if (opts.floorAtZero) after = Math.max(0, after)
    const applied = round2(after - before)
    if (applied === 0) {
      // 例如已经在 0 分还想再扣，账上什么都没变，就别写假流水
      return {
        studentId: opts.studentId,
        studentName: student.name || '',
        before,
        after: before,
        applied: 0,
        logId: '',
        skipped: '积分未变化（已在下限）',
      }
    }

    await pb(`/api/collections/students/records/${opts.studentId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ points: after }),
    })

    // 写完回读：PB 没有原子加减，只能靠回读确认没被别的写入盖掉
    const check = await pb(`/api/collections/students/records/${opts.studentId}`, token)
    if (round2(check.points || 0) !== after) {
      throw Object.assign(
        new Error(`积分写入后校验不一致：期望 ${after}，实际 ${round2(check.points || 0)}`),
        { httpStatus: 409 }
      )
    }

    let log: any
    try {
      log = await pb('/api/collections/point_logs/records', token, {
        method: 'POST',
        body: JSON.stringify({
          student: opts.studentId,
          teacher: opts.teacherId || '',
          amount: applied,
          reason: String(opts.reason),
          points_before: before,
          points_after: after,
        }),
      })
    } catch (e: any) {
      // 流水没写进去就把分数退回去，绝不允许「分数变了、账上没有」
      await pb(`/api/collections/students/records/${opts.studentId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ points: before }),
      }).catch(() => {})
      throw Object.assign(new Error(`流水写入失败，已回滚：${e?.message || e}`), { httpStatus: 500 })
    }

    return {
      studentId: opts.studentId,
      studentName: student.name || '',
      before,
      after,
      applied,
      logId: log?.id || '',
    }
  })
}

/** 只要当前积分（锁外只读，用于展示） */
export async function readPoints(studentId: string, token?: string): Promise<number> {
  const tk = token || (await getAdminToken())
  const s = await pb(`/api/collections/students/records/${studentId}`, tk)
  return round2(s.points || 0)
}
