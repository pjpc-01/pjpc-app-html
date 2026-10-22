import { NextRequest, NextResponse } from 'next/server'

const POCKETBASE_URL = 'http://127.0.0.1:8090'

export type ApiSession = { id: string; role: string; studentId?: string; teacherId?: string; name?: string; internal?: boolean }

/**
 * 应用接口（/api/*）的登录校验。
 *
 * 为什么需要：代理层已经加了守门，但应用自己的接口（/api/students、/api/teacher-salary …）
 * 是直连 PocketBase 的，原来没有任何校验 → 公网不带登录就能拿工资、学生名册。
 *
 * 规则：
 *  - 服务端内部调用（带 x-pjpc-internal 且等于 PROXY_INTERNAL_KEY）→ 放行，标记 internal
 *  - 浏览器调用：Authorization 里带 PocketBase token（裸 token 或 Bearer 都认）
 *  - 角色不匹配 → 403
 *  - 没有/无效 token → 401
 */
export async function requireRoles(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ session: ApiSession } | { error: NextResponse }> {
  const internalKey = process.env.PROXY_INTERNAL_KEY || ''
  if (internalKey && request.headers.get('x-pjpc-internal') === internalKey) {
    return { session: { id: 'internal', role: 'admin', internal: true } }
  }

  const raw = request.headers.get('Authorization') || ''
  const m = raw.match(/^\s*(?:Bearer\s+)?(\S+)\s*$/i)
  if (!m) return { error: NextResponse.json({ success: false, error: '请先登录' }, { status: 401 }) }

  let role = ''
  let id = ''
  let studentId = ''
  let teacherId = ''
  let name = ''
  try {
    const r = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${m[1]}` },
    })
    if (!r.ok) {
      return { error: NextResponse.json({ success: false, error: '登录已过期，请重新登录' }, { status: 401 }) }
    }
    const d = await r.json()
    role = String(d?.record?.role || '')
    id = d?.record?.id || ''
    studentId = d?.record?.student_id || ''
    teacherId = d?.record?.teacher_id || ''
    name = String(d?.record?.name || d?.record?.username || '')
  } catch {
    return { error: NextResponse.json({ success: false, error: '鉴权失败' }, { status: 500 }) }
  }

  if (!allowedRoles.includes(role)) {
    return { error: NextResponse.json({ success: false, error: '没有权限' }, { status: 403 }) }
  }
  return { session: { id, role, studentId, teacherId, name } }
}
