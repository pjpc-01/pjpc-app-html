// 共享 PB 管理员 token 获取（服务端）
// 统一从环境变量读取凭证，替代各 API 硬编码的 pbAuth()
// 凭证只在 .env.local 维护一份

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'final_admin@test.com'
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'final_pass'

let cachedToken: string | null = null
let tokenExpiry = 0

/**
 * 获取 PB 管理员 token（60 秒缓存）。
 * 与各 API 原有的 pbAuth() 返回完全一致：裸 token 字符串。
 */
export async function getAdminToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error(`PB auth failed: ${res.status}`)
  const data = await res.json()
  cachedToken = data.token as string
  tokenExpiry = Date.now() + 60_000
  return cachedToken
}
