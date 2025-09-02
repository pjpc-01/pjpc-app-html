import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 创建测试用户 ===')
    
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')
    
    // 先登录管理员账户
    await pb.collection('users').authWithPassword(
      'pjpcemerlang@gmail.com',
      '0122270775Sw!'
    )
    
    // 创建测试用户数据
    const testUsers = [
      {
        email: 'teacher.test@example.com',
        password: 'Test123!@#',
        passwordConfirm: 'Test123!@#',
        name: '张老师',
        role: 'teacher',
        status: 'pending',
        emailVerified: true
      },
      {
        email: 'parent.test@example.com',
        password: 'Test123!@#',
        passwordConfirm: 'Test123!@#',
        name: '李家长',
        role: 'parent',
        status: 'pending',
        emailVerified: true
      },
      {
        email: 'accountant.test@example.com',
        password: 'Test123!@#',
        passwordConfirm: 'Test123!@#',
        name: '王会计',
        role: 'accountant',
        status: 'pending',
        emailVerified: true
      }
    ]
    
    const createdUsers = []
    
    for (const userData of testUsers) {
      try {
        const record = await pb.collection('users').create(userData)
        createdUsers.push({
          id: record.id,
          email: record.email,
          name: record.name,
          role: record.role,
          status: record.status,
          created: record.created
        })
        console.log(`创建用户成功: ${record.name} (${record.email})`)
      } catch (error) {
        console.error(`创建用户失败: ${userData.email}`, error)
        createdUsers.push({
          error: error instanceof Error ? error.message : '未知错误',
          email: userData.email
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '测试用户创建完成',
      createdUsers,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('创建测试用户API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
