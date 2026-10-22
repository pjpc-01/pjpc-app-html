import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/pb-admin-token'
import { requireRoles } from '@/lib/api-auth'

// 管理员重设用户密码（不依赖 SMTP）
// 用法：POST { userId, newPassword }
// 说明：与仓库其它 API 路由一致，走服务端 PB 超管凭据（authenticateAdmin 同源）。
//       区别是不需要邮箱/邮件服务，管理员直接把用户密码设成一个临时值，用户登录后再自己改。

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

export async function POST(request: NextRequest) {
  // ★ 只允许管理员：以前这个接口没鉴权，公网谁都能把任何人的密码改掉
  const gate = await requireRoles(request, ['admin'])
  if ('error' in gate) return gate.error
  try {
    const body = await request.json().catch(() => ({} as any))
    const userId: string | undefined = body?.userId
    const newPassword: string | undefined = body?.newPassword

    if (!userId || !newPassword) {
      return NextResponse.json({ success: false, error: '缺少参数：userId / newPassword' }, { status: 400 })
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      // PocketBase 自己就要求 ≥8，这里提前挡，别让用户看到「PB 拒绝（400）」这种天书
      return NextResponse.json({ success: false, error: '密码至少 8 位' }, { status: 400 })
    }

    const token = await getAdminToken()

    const res = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ password: newPassword, passwordConfirm: newPassword }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      // 把 PB 的字段级原因翻成人话（password: Must be at least 8 characters → 密码至少 8 位）
      let msg = ''
      try {
        const j = JSON.parse(detail)
        const first = j?.data ? Object.values(j.data)[0] as any : null
        msg = first?.message || j?.message || ''
      } catch { /* 不是 JSON 就算了 */ }
      return NextResponse.json(
        { success: false, error: msg || `PB 拒绝（${res.status}）`, detail: detail.slice(0, 300) },
        { status: res.status }
      )
    }

    const updated = await res.json()
    return NextResponse.json({
      success: true,
      message: '密码已重设',
      user: { id: updated?.id, email: updated?.email, username: updated?.username },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
