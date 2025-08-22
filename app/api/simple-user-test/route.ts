import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== 简单用户测试 ===')
    
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')
    
    // 1. 检查连接
    console.log('1. 检查连接...')
    const healthResponse = await fetch('http://pjpc.tplinkdns.com:8090/api/health')
    console.log('健康检查状态:', healthResponse.status)
    
    // 2. 尝试登录
    console.log('2. 尝试登录...')
    try {
      const authData = await pb.collection('users').authWithPassword(
        'pjpcemerlang@gmail.com',
        '0122270775Sw!'
      )
      console.log('登录成功:', authData.record.email)
    } catch (loginError) {
      console.error('登录失败:', loginError)
      return NextResponse.json({
        success: false,
        error: '登录失败',
        details: loginError instanceof Error ? loginError.message : '未知错误'
      }, { status: 401 })
    }
    
    // 3. 尝试获取用户列表（最简单的请求）
    console.log('3. 尝试获取用户列表...')
    try {
      const records = await pb.collection('users').getList(1, 10)
      console.log('获取用户成功，数量:', records.items.length)
      
      // 只返回基本信息
      const simpleUsers = records.items.map((item: any) => ({
        id: item.id,
        email: item.email,
        name: item.name || '未设置',
        role: item.role || 'user',
        status: item.status || 'pending'
      }))
      
      return NextResponse.json({
        success: true,
        userCount: records.items.length,
        users: simpleUsers,
        timestamp: new Date().toISOString()
      })
      
    } catch (fetchError) {
      console.error('获取用户失败:', fetchError)
      return NextResponse.json({
        success: false,
        error: '获取用户失败',
        details: fetchError instanceof Error ? fetchError.message : '未知错误'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('简单用户测试错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '测试失败',
      details: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

