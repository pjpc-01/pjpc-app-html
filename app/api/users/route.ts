import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090')

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始获取用户数据...')
    
    // 管理员认证
    try {
      await authenticateAdmin(pb)
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { error: '认证失败', details: authError instanceof Error ? authError.message : '未知错误' },
        { status: 401 }
      )
    }

    // 获取用户数据
    try {
      const usersResult = await pb.collection('users').getList(1, 100, {
        sort: '-created'
      })
      
      console.log(`✅ 获取到 ${usersResult.items.length} 个用户`)
      
      return NextResponse.json({
        success: true,
        users: usersResult.items,
        totalItems: usersResult.totalItems,
        page: usersResult.page,
        perPage: usersResult.perPage,
        totalPages: usersResult.totalPages
      })
    } catch (fetchError: any) {
      console.error('❌ 获取用户数据失败:', fetchError)
      
      // 如果集合不存在，返回空结果
      if (fetchError.status === 400 || fetchError.status === 404) {
        console.log('⚠️ users集合可能不存在，返回空结果')
        return NextResponse.json({
          success: true,
          users: [],
          totalItems: 0,
          page: 1,
          perPage: 100,
          totalPages: 0
        })
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: '获取用户数据失败', 
          details: fetchError.message || '未知错误' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ API错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}
