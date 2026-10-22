import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

// 保存当前登录用户的自定义侧边栏菜单顺序（服务器权威，换电脑也保留）
// body: { order: { top: string[], groups: Record<string, string[]> } | null }
//   null / 空 = 恢复默认（清空自定义）
// 身份：用调用者自带的 PB user token 校验（不信任 body 里的 userId）

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

// 读取当前登录用户的自定义菜单顺序
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  try {
    const auth = request.headers.get('Authorization') || ''
    if (!auth) return NextResponse.json({ success: false, order: null }, { status: 401 })
    const refresh = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { Authorization: auth },
    })
    if (!refresh.ok) return NextResponse.json({ success: false, order: null }, { status: 401 })
    const me = (await refresh.json().catch(() => null))?.record
    return NextResponse.json({ success: true, order: me?.nav_order ?? null })
  } catch (error) {
    return NextResponse.json(
      { success: false, order: null, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  try {
    const auth = request.headers.get('Authorization') || ''
    if (!auth) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // 1) 验证调用者身份（PB 的 auth-refresh 会用该 token 换回本人记录）
    const refresh = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { Authorization: auth },
    })
    if (!refresh.ok) {
      return NextResponse.json({ success: false, error: '登录已失效' }, { status: 401 })
    }
    const me = (await refresh.json().catch(() => null))?.record
    if (!me?.id) {
      return NextResponse.json({ success: false, error: '登录已失效' }, { status: 401 })
    }

    // 2) 用超管把顺序写回该用户记录
    const body = await request.json().catch(() => ({} as any))
    const order = body?.order ?? null

    const token = await getAdminToken()
    const res = await fetch(`${PB_URL}/api/collections/users/records/${me.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ nav_order: order }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return NextResponse.json(
        { success: false, error: `PB 拒绝（${res.status}）`, detail: detail.slice(0, 200) },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
