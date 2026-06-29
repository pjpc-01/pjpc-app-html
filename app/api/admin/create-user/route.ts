import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, name, role, password } = await request.json()

    if (!email) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 })
    }

    // 从请求头获取管理员 token（由前端登录后的 authStore 提供）
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const pbToken = authHeader.slice(7)

    // 使用 PocketBase 服务端 API 创建用户
    const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
    
    // 先验证 token 是否有效且有管理员权限
    const authCheck = await fetch(`${pbUrl}/api/collections/users/auth-refresh`, {
      headers: {
        'Authorization': `Bearer ${pbToken}`,
      },
    })

    if (!authCheck.ok) {
      return NextResponse.json({ error: '认证失效，请重新登录' }, { status: 401 })
    }

    const authData = await authCheck.json()
    const userRole = authData?.record?.role

    if (userRole !== 'admin') {
      return NextResponse.json({ error: '仅管理员可创建用户' }, { status: 403 })
    }

    // 创建新用户
    const userData: Record<string, unknown> = {
      email,
      password: password || generateTempPassword(),
      passwordConfirm: password || generateTempPassword(),
      name: name || email.split('@')[0],
      role: role || 'teacher',
      status: 'approved',
      emailVerified: true,
      loginAttempts: 0,
    }

    const createRes = await fetch(`${pbUrl}/api/collections/users/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pbToken}`,
      },
      body: JSON.stringify(userData),
    })

    if (!createRes.ok) {
      const errData = await createRes.json()
      const message = errData?.message || errData?.data?.email?.message || '创建用户失败'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const newUser = await createRes.json()

    return NextResponse.json({
      success: true,
      message: `用户 ${email} 创建成功`,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      tempPassword: password ? undefined : userData.password,
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let pwd = 'Pjpc'
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  pwd += '1!'
  return pwd
}
