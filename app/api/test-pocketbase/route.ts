import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  try {
    console.log('=== 服务器端PocketBase测试 ===')
    
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')
    
    // 1. 检查连接
    console.log('1. 检查PocketBase连接...')
    let healthStatus = 'unknown'
    try {
      const healthResponse = await fetch('http://pjpc.tplinkdns.com:8090/api/health')
      healthStatus = healthResponse.ok ? 'connected' : `error_${healthResponse.status}`
      console.log('健康检查状态:', healthResponse.status)
    } catch (error) {
      healthStatus = 'connection_failed'
      console.log('健康检查失败:', error)
    }
    
    // 2. 检查未认证状态下的访问
    console.log('2. 测试未认证状态下的访问...')
    let unauthenticatedAccess = { success: false, userCount: 0, error: null }
    try {
      const records = await pb.collection('users').getList(1, 10)
      unauthenticatedAccess = { success: true, userCount: records.items.length, error: null }
      console.log('未认证访问成功，用户数量:', records.items.length)
    } catch (error) {
      unauthenticatedAccess = { 
        success: false, 
        userCount: 0, 
        error: error instanceof Error ? error.message : '未知错误'
      }
      console.log('未认证访问失败:', error)
    }
    
    // 3. 尝试登录管理员账户
    console.log('3. 尝试登录管理员账户...')
    let authResult = { success: false, user: null, error: null }
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
    
    // 4. 检查认证后的访问
    console.log('4. 测试认证状态下的访问...')
    let authenticatedAccess = { success: false, userCount: 0, users: [], error: null }
    if (pb.authStore.isValid) {
      try {
        const records = await pb.collection('users').getList(1, 10)
        authenticatedAccess = { 
          success: true, 
          userCount: records.items.length, 
          users: records.items.map(item => ({
            id: item.id,
            email: item.email,
            name: item.name,
            role: item.role,
            status: item.status,
            created: item.created
          })),
          error: null 
        }
        console.log('认证访问成功，用户数量:', records.items.length)
      } catch (error) {
        authenticatedAccess = { 
          success: false, 
          userCount: 0, 
          users: [], 
          error: error instanceof Error ? error.message : '未知错误'
        }
        console.log('认证访问失败:', error)
      }
    } else {
      authenticatedAccess = { 
        success: false, 
        userCount: 0, 
        users: [], 
        error: '未登录'
      }
    }
    
    // 5. 检查集合信息
    console.log('5. 检查集合信息...')
    let collectionInfo = { success: false, info: null, error: null }
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
      timestamp: new Date().toISOString(),
      pocketbaseUrl: pb.baseUrl,
      healthStatus,
      unauthenticatedAccess,
      authResult,
      authenticatedAccess,
      collectionInfo
    })
    
  } catch (error) {
    console.error('PocketBase测试API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      errorDetails: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

