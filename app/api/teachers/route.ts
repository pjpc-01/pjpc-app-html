import { NextRequest, NextResponse } from 'next/server'
import { getAllTeachers } from '@/lib/pocketbase-teachers'

// 动态导出配置
export const dynamic = 'force-dynamic'

// 获取教师列表
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始处理 /api/teachers 请求')
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const teacherId = searchParams.get('teacher_id')
    const userId = searchParams.get('user_id')

    console.log('📋 请求参数:', { email, teacherId, userId })

    // 使用正确的 PocketBase 集成获取所有教师
    console.log('🔍 获取所有教师记录...')
    const allTeachers = await getAllTeachers()
    console.log('✅ 获取所有教师成功:', allTeachers.length, '个记录')
    
    // 在前端进行过滤
    let filteredTeachers = allTeachers
    
    if (userId) {
      console.log('🔍 在前端通过 user_id 过滤:', userId)
      filteredTeachers = allTeachers.filter(teacher => (teacher as any).user_id === userId)
      console.log('✅ 过滤后剩余:', filteredTeachers.length, '个记录')
    } else if (email) {
      console.log('🔍 在前端通过邮箱过滤:', email)
      filteredTeachers = allTeachers.filter(teacher => teacher.email === email)
      console.log('✅ 过滤后剩余:', filteredTeachers.length, '个记录')
    } else if (teacherId) {
      console.log('🔍 在前端通过教师ID过滤:', teacherId)
      filteredTeachers = allTeachers.filter(teacher => teacher.id === teacherId)
      console.log('✅ 过滤后剩余:', filteredTeachers.length, '个记录')
    }

    // 构造响应格式以匹配前端期望
    const response = {
      items: filteredTeachers,
      totalItems: filteredTeachers.length,
      totalPages: 1,
      page: 1,
      perPage: filteredTeachers.length
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('❌ 获取教师列表失败:', error)
    return NextResponse.json(
      { 
        error: '获取教师列表失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
