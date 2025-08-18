import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== PocketBase Debug API ===')
    
    // 创建新的PocketBase实例用于调试
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')
    
    // 1. 检查PocketBase连接
    console.log('1. 检查PocketBase连接...')
    console.log('PocketBase URL:', pb.baseUrl)
    
    // 2. 检查认证状态
    console.log('2. 检查认证状态...')
    console.log('认证状态:', pb.authStore.isValid)
    console.log('当前用户:', pb.authStore.model)
    
    // 3. 尝试登录管理员账户
    console.log('3. 尝试登录管理员账户...')
    let authResult: { success: boolean, user: any, error: string | null } = { success: false, user: null, error: null }
    try {
      const authData = await pb.collection('users').authWithPassword(
        'pjpcemerlang@gmail.com',
        '0122270775Sw!'
      )
      authResult = { 
        success: true, 
        user: {
          id: authData.record.id,
          email: authData.record.email,
          name: authData.record.name,
          role: authData.record.role,
          status: authData.record.status
        }, 
        error: null 
      }
      console.log('登录成功:', authData.record.email)
    } catch (error) {
      authResult = { 
        success: false, 
        user: null, 
        error: error instanceof Error ? error.message : '未知错误'
      }
      console.log('登录失败:', error)
    }
    
    // 4. 尝试获取用户列表
    console.log('4. 尝试获取用户列表...')
    let userListResult: { success: boolean, users: any[], error: string | null, rawResponse: any } = { success: false, users: [], error: null, rawResponse: null }
    if (pb.authStore.isValid) {
      try {
        const records = await pb.collection('users').getList(1, 50, {
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
    
    // 5. 检查集合信息
    console.log('5. 检查集合信息...')
    let collectionInfo: { success: boolean, info: any, error: string | null } = { success: false, info: null, error: null }
    try {
      const collections = await pb.collections.getList()
      const usersCollection = collections.items.find(col => col.name === 'users')
      if (usersCollection) {
        collectionInfo = {
          success: true,
          info: {
            name: usersCollection.name,
            type: usersCollection.type,
            listRule: usersCollection.listRule,
            viewRule: usersCollection.viewRule,
            createRule: usersCollection.createRule,
            updateRule: usersCollection.updateRule,
            deleteRule: usersCollection.deleteRule
          },
          error: null
        }
      } else {
        collectionInfo = { success: false, info: null, error: '未找到users集合' }
      }
    } catch (error) {
      collectionInfo = { 
        success: false, 
        info: null, 
        error: error instanceof Error ? error.message : '未知错误'
      }
      console.log('获取集合信息失败:', error)
    }
    
    return NextResponse.json({
      success: true,
      pocketbaseUrl: pb.baseUrl,
      authStatus: pb.authStore.isValid,
      currentUser: pb.authStore.model,
      authResult,
      userListResult,
      collectionInfo,
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
