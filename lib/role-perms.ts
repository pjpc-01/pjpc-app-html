import { NextRequest, NextResponse } from 'next/server'
import { requireRoles, type ApiSession } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

/**
 * 角色权限（单源 = role_permissions 表，跟侧边栏开关同一张表）。
 *
 * 为什么有这层：权限页上的开关原来只管侧边栏，接口层还是写死 role 名单，
 * 于是「关掉老师批请假」只是看不见按钮，老师照样能直接调 API 改数据。
 * 现在接口统一问这张表：开关关了，接口就真的 403。
 *
 * admin 永远放行（跟侧边栏一致），不查表。
 */

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

let cache: { at: number; map: Record<string, Record<string, boolean>> } | null = null
const TTL = 30_000

async function loadAll(): Promise<Record<string, Record<string, boolean>>> {
  if (cache && Date.now() - cache.at < TTL) return cache.map
  try {
    const token = await getAdminToken()
    const r = await fetch(`${PB_URL}/api/collections/role_permissions/records?perPage=100`, {
      headers: { Authorization: token },
      cache: 'no-store',
    })
    if (!r.ok) return cache?.map || {}
    const d = await r.json()
    const map: Record<string, Record<string, boolean>> = {}
    for (const item of d.items || []) map[String(item.role || '')] = item.permissions || {}
    cache = { at: Date.now(), map }
    return map
  } catch {
    return cache?.map || {}
  }
}

/** 某个角色有没有某个权限 key */
export async function roleHas(role: string, key: string): Promise<boolean> {
  if (role === 'admin') return true
  const map = await loadAll()
  return map[role]?.[key] === true
}

/** 权限改完立刻生效（不用等 30 秒缓存） */
export function clearRolePermCache() {
  cache = null
}

/**
 * 接口守门：先要求是这些角色之一，再要求该角色的权限开关是开的。
 * 返回 { session } 或 { error }。
 */
export async function requirePermission(
  request: NextRequest,
  key: string,
  roles: string[] = ['admin', 'teacher', 'office_admin']
): Promise<{ session: ApiSession } | { error: NextResponse }> {
  const gate = await requireRoles(request, roles)
  if ('error' in gate) return gate
  if (gate.session.internal) return gate

  if (!(await roleHas(gate.session.role, key))) {
    return {
      error: NextResponse.json(
        { success: false, error: `没有权限：${key}（请管理员到「用户管理 → 角色权限」开启）` },
        { status: 403 }
      ),
    }
  }
  return gate
}
