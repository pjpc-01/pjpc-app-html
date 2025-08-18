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
    
    // 3. 尝试获取用户列表
    console.log('3. 尝试获取用户列表...')
    const records = await pb.collection('users').getList(1, 50, {
      sort: '-created'
    })
    
    console.log('获取到的用户数量:', records.items.length)
    console.log('用户数据:', records.items.map(item => ({
      id: item.id,
      email: item.email,
      name: item.name,
      role: item.role,
      status: item.status,
      created: item.created
    })))
    
    // 4. 检查集合信息
    console.log('4. 检查集合信息...')
    const collections = await pb.collections.getList()
    const usersCollection = collections.items.find(col => col.name === 'users')
    console.log('users集合信息:', usersCollection)
    
    // 5. 检查权限
    console.log('5. 检查权限...')
    if (usersCollection) {
      console.log('List权限:', usersCollection.listRule)
      console.log('View权限:', usersCollection.viewRule)
      console.log('Create权限:', usersCollection.createRule)
      console.log('Update权限:', usersCollection.updateRule)
      console.log('Delete权限:', usersCollection.deleteRule)
    }
    
    return NextResponse.json({
      success: true,
      pocketbaseUrl: pb.baseUrl,
      authStatus: pb.authStore.isValid,
      currentUser: pb.authStore.model,
      userCount: records.items.length,
      users: records.items.map(item => ({
        id: item.id,
        email: item.email,
        name: item.name,
        role: item.role,
        status: item.status,
        created: item.created,
        emailVerified: item.emailVerified,
        loginAttempts: item.loginAttempts
      })),
      collectionInfo: usersCollection,
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
