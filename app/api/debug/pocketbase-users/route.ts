import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  try {
    console.log('=== PocketBase Debug API ===')
    
    // 获取智能PocketBase实例
    const pb = await getPocketBase()
    
    // 1. 检查PocketBase连接
    console.log('1. 检查PocketBase连接...')
    console.log('PocketBase URL:', pb.baseUrl)
    
    // 2. 检查认证状态
    console.log('2. 检查认证状态...')
    console.log('认证状态:', pb.authStore.isValid)
    console.log('当前用户:', pb.authStore.model)
    
    let authResult: { success: boolean, error: string | null } = { success: false, error: null }
    
    // 3. 尝试认证
    if (!pb.authStore.isValid) {
      console.log('3. 尝试认证...')
      try {
        await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        authResult = { success: true, error: null }
        console.log('✅ 认证成功')
      } catch (authError) {
        authResult = { success: false, error: authError instanceof Error ? authError.message : '认证失败' }
        console.log('❌ 认证失败:', authError)
      }
    } else {
      authResult = { success: true, error: null }
      console.log('✅ 已认证')
    }
    
    // 4. 获取用户列表
    console.log('4. 获取用户列表...')
    let userListResult: { success: boolean, users: any[], error: string | null, rawResponse: any } = { success: false, users: [], error: null, rawResponse: null }
    
    if (pb.authStore.isValid) {
      try {
        const records = await pb.collection('users').getList(1, 100, {
          sort: '-created'
        })
        
        console.log('原始响应:', records)
        console.log('响应类型:', typeof records)
        console.log('items类型:', typeof records.items)
        console.log('items长度:', records.items?.length)
        console.log('items内容:', records.items)
        
        const users = records.items?.map(item => ({
          id: item.id,
          email: item.email,
          name: item.name,
          role: item.role,
          status: item.status,
          created: item.created,
          emailVerified: item.emailVerified,
          loginAttempts: item.loginAttempts
        })) || []
        
        userListResult = { 
          success: true, 
          users: users,
          error: null,
          rawResponse: {
            totalItems: records.totalItems,
            page: records.page,
            perPage: records.perPage,
            totalPages: records.totalPages,
            itemsCount: records.items?.length || 0
          }
        }
        console.log('获取到的用户数量:', users.length)
        console.log('用户数据:', users)
      } catch (error) {
        userListResult = { 
          success: false, 
          users: [], 
          error: error instanceof Error ? error.message : '未知错误',
          rawResponse: null
        }
        console.log('获取用户列表失败:', error)
      }
    } else {
      userListResult = { 
        success: false, 
        users: [], 
        error: '未登录',
        rawResponse: null
      }
    }
    
    return NextResponse.json({
      success: true,
      pocketbaseUrl: pb.baseUrl,
      authStatus: pb.authStore.isValid,
      currentUser: pb.authStore.model,
      authResult,
      userListResult,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('PocketBase Debug API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      errorDetails: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
