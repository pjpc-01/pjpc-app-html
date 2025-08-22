import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '用户ID是必需的'
      }, { status: 400 })
    }

    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')
    
    // 先登录管理员账户
    await pb.collection('users').authWithPassword(
      'pjpcemerlang@gmail.com',
      '0122270775Sw!'
    )
    
    // 删除用户
    await pb.collection('users').delete(userId)
    
    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    })
    
  } catch (error) {
    console.error('删除用户失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '删除用户失败'
    }, { status: 500 })
  }
}
