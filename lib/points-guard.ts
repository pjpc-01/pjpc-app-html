// 积分守卫 — 所有改积分的入口在写入前必须调用 assertPointsEnabled()
// 防止 points_enabled=false（积分系统已关闭）的学生仍被扣分/加分
// 即使查询 filter 有 bug，写入前这一层也能拦住

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

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
