import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== 测试用户审核组件数据获取 ===')
    
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')
    
    // 1. 尝试登录管理员账户
    console.log('1. 尝试登录管理员账户...')
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
    
    // 2. 检查认证后的用户列表获取
    console.log('2. 检查认证后的用户列表获取...')
    let userListResult = { success: false, users: [], error: null }
    if (pb.authStore.isValid) {
      try {
        const records = await pb.collection('users').getList(1, 100, {
          sort: '-created'
        })
        
        const users = records.items.map(item => ({
          id: item.id,
          email: item.email,
          name: item.name,
          role: item.role,
          status: item.status,
          created: item.created,
          updated: item.updated,
          emailVerified: item.emailVerified,
          loginAttempts: item.loginAttempts
        }))
        
        userListResult = { 
          success: true, 
          users: users,
          error: null 
        }
        console.log('用户列表获取成功，用户数量:', users.length)
        console.log('用户详情:', users)
      } catch (error) {
        userListResult = { 
          success: false, 
          users: [], 
          error: error instanceof Error ? error.message : '未知错误'
        }
        console.log('用户列表获取失败:', error)
      }
    } else {
      userListResult = { 
        success: false, 
        users: [], 
        error: '未登录'
      }
    }
    
    // 3. 测试过滤逻辑
    console.log('3. 测试过滤逻辑...')
    let filterTest = { 
      totalUsers: 0,
      pendingUsers: 0,
      approvedUsers: 0,
      suspendedUsers: 0,
      adminUsers: 0,
      teacherUsers: 0,
      parentUsers: 0,
      accountantUsers: 0
    }
    
    if (userListResult.success) {
      const users = userListResult.users
      filterTest = {
        totalUsers: users.length,
        pendingUsers: users.filter(u => u.status === 'pending').length,
        approvedUsers: users.filter(u => u.status === 'approved').length,
        suspendedUsers: users.filter(u => u.status === 'suspended').length,
        adminUsers: users.filter(u => u.role === 'admin').length,
        teacherUsers: users.filter(u => u.role === 'teacher').length,
        parentUsers: users.filter(u => u.role === 'parent').length,
        accountantUsers: users.filter(u => u.role === 'accountant').length
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      authResult,
      userListResult,
      filterTest
    })
    
  } catch (error) {
    console.error('用户审核组件测试API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      errorDetails: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
