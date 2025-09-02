import { NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://192.168.0.59:8090')

export async function GET() {
  try {
    console.log('=== 学生数据调试 API ===')
    
    // 确保认证
    if (!pb.authStore.isValid) {
      console.log('尝试管理员认证...')
      try {
        await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('认证成功')
      } catch (authError) {
        console.error('认证失败:', authError)
        return NextResponse.json({ error: '认证失败' }, { status: 401 })
      }
    }
    
    // 获取 students 集合数据
    console.log('获取 students 集合数据...')
    let studentsData: any[] = []
    try {
      const studentsResponse = await pb.collection('students').getList(1, 10)
      studentsData = studentsResponse.items || []
      console.log(`获取到 ${studentsResponse.totalItems} 个 students 记录`)
      if (studentsData.length > 0) {
        console.log('第一个 students 记录:', JSON.stringify(studentsData[0], null, 2))
      }
    } catch (error) {
      console.error('获取 students 数据失败:', error)
    }
    
    // 获取 students 集合数据（重复检查）
    console.log('获取 students 集合数据（重复检查）...')
    let cardsData: any[] = []
    try {
      const cardsResponse = await pb.collection('students').getList(1, 10)
      cardsData = cardsResponse.items || []
      console.log(`获取到 ${cardsResponse.totalItems} 个 students 记录`)
      if (cardsData.length > 0) {
        console.log('第一个 students 记录:', JSON.stringify(cardsData[0], null, 2))
      }
    } catch (error) {
      console.error('获取 students 数据失败:', error)
    }
    
    return NextResponse.json({
      success: true,
      students: {
        total: studentsData.length,
        sample: studentsData.slice(0, 3)
      },
      students_duplicate: {
        count: cardsData.length,
        total: cardsData.length > 0 ? '更多数据' : 0,
        sample: cardsData.slice(0, 3)
      }
    })
    
  } catch (error: any) {
    console.error('调试 API 错误:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
