import { STUDENT_ID_PREFIX_RANK } from '../constants'

// 学号解析工具
export function getIdParts(studentId?: string | null): { prefixRank: number; num: number; raw: string } {
  const raw = (studentId || '').toUpperCase().trim()
  const m = raw.match(/^([A-Z]+)\s*0*([0-9]+)/)
  const prefix = m?.[1] || ''
  const num = m?.[2] ? parseInt(m[2], 10) : Number.MAX_SAFE_INTEGER
  const prefixRank = STUDENT_ID_PREFIX_RANK[prefix as keyof typeof STUDENT_ID_PREFIX_RANK] ?? 99
  return { prefixRank, num, raw }
}

// 学号比较函数
export function compareStudentIds(a?: string | null, b?: string | null): number {
  const pa = getIdParts(a)
  const pb = getIdParts(b)
  if (pa.prefixRank !== pb.prefixRank) return pa.prefixRank - pb.prefixRank
  if (pa.num !== pb.num) return pa.num - pb.num
  return pa.raw.localeCompare(pb.raw)
}

// 积分排序函数（积分降序，同积分按学号排序）
export function sortByPointsThenId(a: any, b: any): number {
  // 首先按积分降序排序
  const pointsDiff = (b.current_points || 0) - (a.current_points || 0)
  if (pointsDiff !== 0) return pointsDiff
  
  // 积分相同时按学号排序
  const aid = a.student?.student_id
  const bid = b.student?.student_id
  if (aid && bid) {
    return compareStudentIds(aid, bid)
  }
  return 0
}

// 学号排序函数
export function sortByStudentId(a: any, b: any): number {
  const aid = a.student?.student_id
  const bid = b.student?.student_id
  if (aid && bid) {
    return compareStudentIds(aid, bid)
  }
  return 0
}
