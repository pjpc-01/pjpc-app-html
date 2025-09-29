export function normalizeCenter(value?: string | null) {
  if (!value) return ""
  return String(value).toLowerCase().replace(/\s+/g, "").replace(/-/g, "")
}

export function isSameCenter(a?: string | null, b?: string | null) {
  return normalizeCenter(a) === normalizeCenter(b)
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

export function slideName(type: "student_points" | "transactions" | "birthdays" | "announcements") {
  return type === 'student_points' ? '学生积分'
    : type === 'transactions' ? '交易记录'
    : type === 'birthdays' ? '生日'
    : '公告'
}
