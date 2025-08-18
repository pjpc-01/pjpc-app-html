import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== 测试用户审核Hook逻辑 ===')
    
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')
    
    // 模拟hook中的fetchUsers逻辑
    console.log('1. 检查认证状态...')
    console.log('认证状态:', pb.authStore.isValid)
    console.log('当前用户:', pb.authStore.model)
    
    // 如果未认证，尝试使用管理员账户登录
    if (!pb.authStore.isValid) {
      console.log('2. 未认证，尝试使用管理员账户登录...')
      try {
        await pb.collection('users').authWithPassword(
          'pjpcemerlang@gmail.com',
          '0122270775Sw!'
        )
        console.log('管理员登录成功')
      } catch (loginError) {
        console.error('管理员登录失败:', loginError)
        return NextResponse.json({
          success: false,
          error: '需要管理员权限才能访问用户数据，请先登录',
          timestamp: new Date().toISOString()
        }, { status: 401 })
      }
    }
    
    // 获取用户列表
    console.log('3. 获取用户列表...')
    const records = await pb.collection('users').getList(1, 50, {
      sort: '-created'
    })
    
    console.log('获取到的记录数量:', records.items.length)
    console.log('原始数据:', records.items)
    
    // 模拟hook中的数据处理逻辑
    const userData = records.items.map((item: any) => ({
      id: item.id,
      email: item.email,
      name: item.name || item.email?.split('@')[0] || '未设置',
      role: item.role || 'user',
      status: item.status,
      created: item.created,
      updated: item.updated,
      emailVerified: item.emailVerified || false,
      loginAttempts: item.loginAttempts || 0,
      lockedUntil: item.lockedUntil,
      approvedBy: item.approvedBy || undefined,
      approvedAt: item.approvedAt || undefined
    }))
    
    console.log('处理后的用户数据:', userData)
    
    // 计算统计信息
    const total = userData.length
    const pending = userData.filter(u => u.status === 'pending').length
    const approved = userData.filter(u => u.status === 'approved').length
    const rejected = userData.filter(u => u.status === 'suspended').length
    
    const stats = {
      total,
      pending,
      approved,
      rejected,
      averageProcessingTime: Math.floor(Math.random() * 10) + 2
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pocketbaseUrl: pb.baseUrl,
      authStatus: pb.authStore.isValid,
      currentUser: pb.authStore.model,
      userCount: userData.length,
      users: userData,
      stats,
      rawData: records.items
    })
    
  } catch (error) {
    console.error('用户审核Hook测试错误:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      errorDetails: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
