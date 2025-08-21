import { NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { StudentCard } from '@/lib/pocketbase-students-card'

export async function GET() {
  try {
    console.log('获取学生卡片列表...')
    
    const pb = await getPocketBase()
    console.log('PocketBase 认证状态:', pb.authStore.isValid)
    
    // 检查认证状态，如果未认证则尝试使用默认管理员账户
    if (!pb.authStore.isValid) {
      console.log('PocketBase 未认证，尝试使用默认管理员账户...')
      try {
        const adminEmail = 'pjpcemerlang@gmail.com'
        const adminPassword = '0122270775Sw!'
        
        await pb.admins.authWithPassword(adminEmail, adminPassword)
        console.log('✅ PocketBase 认证成功')
      } catch (authError) {
        console.error('❌ PocketBase 认证失败:', authError)
        return NextResponse.json({
          error: 'PocketBase 认证失败，请检查管理员账户配置',
          details: authError instanceof Error ? authError.message : '未知错误'
        }, { status: 401 })
      }
    }
    
    const records = await pb.collection('students_card').getFullList({
      sort: 'studentId'
    })
    
    console.log(`成功获取 ${records.length} 个学生卡片`)
    
    return NextResponse.json({
      success: true,
      cards: records as StudentCard[],
      count: records.length
    })
    
  } catch (error) {
    console.error('获取学生卡片列表失败:', error)
    return NextResponse.json(
      { error: '获取学生卡片列表失败' },
      { status: 500 }
    )
  }
}
