export const DISPLAY_MS = 5000

export function normalizeCenter(value?: string | null) {
  if (!value) return ""
  return String(value).toLowerCase().replace(/\s+/g, "").replace(/-/g, "")
}

export function isSameCenter(a?: string | null, b?: string | null) {
  return normalizeCenter(a) === normalizeCenter(b)
}

// ID 排序：B 前、G 次、T 后；同前缀按数字升序
export function getIdParts(studentId?: string | null): { prefixRank: number; num: number; raw: string } {
  const raw = (studentId || '').toUpperCase().trim()
  const m = raw.match(/^([A-Z]+)\s*0*([0-9]+)/)
  const prefix = m?.[1] || ''
  const num = m?.[2] ? parseInt(m[2], 10) : Number.MAX_SAFE_INTEGER
  const rankMap: Record<string, number> = { B: 0, G: 1, T: 2 }
  const prefixRank = rankMap[prefix] ?? 99
  return { prefixRank, num, raw }
}

export function compareStudentIds(a?: string | null, b?: string | null): number {
  const pa = getIdParts(a)
  const pb = getIdParts(b)
  if (pa.prefixRank !== pb.prefixRank) return pa.prefixRank - pb.prefixRank
  if (pa.num !== pb.num) return pa.num - pb.num
  return pa.raw.localeCompare(pb.raw)
}

// 解析 PocketBase dob 格式：兼容 "YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", "YYYY/MM/DD"
export function getDobDate(dob?: string | null): Date | null {
  if (!dob) return null
  const datePart = String(dob).split('T')[0].split(' ')[0]
  const d = new Date(datePart)
  return isNaN(d.getTime()) ? null : d
}

export function isToday(dateStr?: string) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const n = new Date()
  return d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export function slideName(type: "student_points" | "birthdays" | "announcements") {
  return type === 'student_points' ? '学生积分'
    : type === 'birthdays' ? '生日'
    : '公告'
}
