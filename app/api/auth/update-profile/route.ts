import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * PATCH /api/auth/update-profile —— 改「自己」的邮箱或密码。
 *
 * 为什么不用用户自己的 token 直接 PATCH users/{id}：
 *   users 集合的 updateRule = null（只有超管能写），用户拿自己的 token 写自己的记录
 *   照样被 PB 拒：400 Only superusers can perform this action。
 * 所以流程是：
 *   1) requireRoles 先用调用者 token 做 auth-refresh 确认身份（id 就是唯一允许改的记录）
 *   2) 改密码时先用旧密码做一次 auth-with-password —— 这一步才是「旧密码验证」，
 *      因为第 3 步用超管 token 写入会绕过 PB 自带的 oldPassword 检查
 *   3) 用超管 token PATCH 这条记录
 * 只写 session.id 这一个 id，请求体里带别人的 id 也没用。
 */
export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error
  const { id: userId, role } = gate.session

  try {
    const body = await request.json().catch(() => ({}))
    const { email, oldPassword, password, passwordConfirm } = body || {}

    if (!userId) return NextResponse.json({ success: false, error: '无法识别账号' }, { status: 401 })

    if (!email && !password) {
      return NextResponse.json({ success: false, error: '没有要更新的内容' }, { status: 400 })
    }

    if (password) {
      if (String(password).length < 8) {
        return NextResponse.json({ success: false, error: '新密码至少 8 位' }, { status: 400 })
      }
      if (password !== passwordConfirm) {
        return NextResponse.json({ success: false, error: '两次输入的新密码不一样' }, { status: 400 })
      }
    }

    const adminToken = await getAdminToken()

    const meRes = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
      headers: { Authorization: adminToken },
    })
    if (!meRes.ok) {
      return NextResponse.json({ success: false, error: '账号不存在' }, { status: 404 })
    }
    const me = await meRes.json()

    // 旧密码验证：非管理员必须验；管理员在 /settings 给别的账号重设时可以不带
    if (password && role !== 'admin') {
      if (!oldPassword) {
        return NextResponse.json({ success: false, error: '请输入当前密码' }, { status: 400 })
      }
      const identity = me.username || me.email
      const check = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, password: oldPassword }),
      })
      if (!check.ok) {
        return NextResponse.json({ success: false, error: '当前密码不正确' }, { status: 400 })
      }
    }

    const updateBody: Record<string, unknown> = {}
    if (email) updateBody.email = String(email).trim()
    if (password) {
      updateBody.password = password
      updateBody.passwordConfirm = passwordConfirm
    }

    const updateRes = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: adminToken },
      body: JSON.stringify(updateBody),
    })

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({} as any))
      const fieldMsg = errData?.data
        ? Object.values(errData.data).map((f: any) => f?.message).filter(Boolean).join('；')
        : ''
      return NextResponse.json(
        { success: false, error: fieldMsg || errData?.message || '更新失败' },
        { status: 400 }
      )
    }

    const updated = await updateRes.json()
    return NextResponse.json({
      success: true,
      user: { id: updated.id, email: updated.email, name: updated.name },
    })
  } catch (error: any) {
    console.error('Update profile failed:', error)
    return NextResponse.json({ success: false, error: error?.message || '更新失败' }, { status: 500 })
  }
}
