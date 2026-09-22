// 积分守卫 — 所有改积分的入口在写入前必须调用 assertPointsEnabled()
// 防止 points_enabled=false（积分系统已关闭）的学生仍被扣分/加分
// 即使查询 filter 有 bug，写入前这一层也能拦住

// 单次积分变动上限 —— 防止误输入/浮点异常写出天文数字
// （曾发生：amount=1e53 使 120 分被浮点精度吸收打成 0，无法还原）
export const MAX_POINTS_DELTA = 100000

/**
 * 校验积分变动值。通过返回 null，否则返回错误信息。
 * 拒绝：非数字 / NaN / Infinity / 超过 ±MAX_POINTS_DELTA
 */
export function validatePointsDelta(value: any): string | null {
  // ⚠️ 必须显式挡 null/undefined/空串：Number(null)===0 会骗过下面的有限性检查
  // （JSON 无法表示 Infinity，传 Infinity 会被序列化成 null）
  if (value === null || value === undefined || value === '') return '积分变动值无效'
  if (typeof value === 'boolean' || Array.isArray(value) || typeof value === 'object') return '积分变动值无效'
  const n = Number(value)
  if (!Number.isFinite(n)) return '积分变动值无效'
  if (n === 0) return '积分变动不能为 0'
  if (Math.abs(n) > MAX_POINTS_DELTA) return `积分变动不得超过 ±${MAX_POINTS_DELTA}`
  return null
}

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
// ⚠️ 不要硬编码凭据；走环境变量（.env.local 不入库）
const PB_ADMIN = {
  email: process.env.POCKETBASE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'final_admin@test.com',
  password: process.env.POCKETBASE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '',
}

let cachedToken: string | null = null
let tokenExpiry = 0

async function pbAuth(): Promise<string> {
  // 缓存 token 60 秒，避免每次调用都认证
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error('积分守卫: PB auth failed')
  const data = await res.json()
  cachedToken = data.token as string
  tokenExpiry = Date.now() + 60_000
  return cachedToken
}

/**
 * 检查学生积分系统是否启用。
 * @returns { enabled: true } 允许积分操作
 * @returns { enabled: false } 已关闭，拒绝
 */
export async function assertPointsEnabled(studentId: string): Promise<{ enabled: boolean; student?: any; message?: string }> {
  if (!studentId) return { enabled: false, message: '缺少 student_id' }
  try {
    const token = await pbAuth()
    const res = await fetch(`${PB_URL}/api/collections/students/records/${studentId}`, {
      headers: { Authorization: token },
    })
    if (!res.ok) return { enabled: false, message: `学生不存在 (${res.status})` }
    const student = await res.json()
    if (student.points_enabled === false) {
      return { enabled: false, student, message: '该学生积分系统已关闭，无法加分/扣分' }
    }
    return { enabled: true, student }
  } catch (e: any) {
    return { enabled: false, message: `积分守卫异常: ${e.message}` }
  }
}
