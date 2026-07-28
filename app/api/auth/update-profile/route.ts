import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'

/**
 * PATCH /api/auth/update-profile
 * Update the current user's email or password.
 * Requires PB auth cookie/token in request.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, oldPassword, password, passwordConfirm } = body

    // Get auth token from request cookies
    const authCookie = request.cookies.get('pb_auth')
    if (!authCookie?.value) {
      // Try Authorization header
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
      }
    }

    // Get the token value (from cookie or header)
    let token = ''
    if (authCookie?.value) {
      try {
        const parsed = JSON.parse(authCookie.value)
        token = parsed.token || ''
      } catch {
        token = authCookie.value
      }
    } else {
      token = request.headers.get('Authorization')?.replace('Bearer ', '') || ''
    }

    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // Verify the token by fetching current user
    const meRes = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
    })

    if (!meRes.ok) {
      return NextResponse.json({ success: false, error: '登录已过期，请重新登录' }, { status: 401 })
    }

    const meData = await meRes.json()
    const userId = meData.record?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: '无法获取用户信息' }, { status: 401 })
    }

    // Build update payload
    const updateBody: any = {}
    if (email) updateBody.email = email
    if (password) {
      updateBody.password = password
      updateBody.passwordConfirm = passwordConfirm
      if (oldPassword) updateBody.oldPassword = oldPassword
    }

    if (Object.keys(updateBody).length === 0) {
      return NextResponse.json({ success: false, error: '无更新内容' }, { status: 400 })
    }

    const updateRes = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(updateBody),
    })

    if (!updateRes.ok) {
      const errData = await updateRes.json()
      return NextResponse.json({ success: false, error: errData.message || '更新失败' }, { status: 400 })
    }

    const updated = await updateRes.json()

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
      },
    })
  } catch (error: any) {
    console.error('Update profile failed:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
