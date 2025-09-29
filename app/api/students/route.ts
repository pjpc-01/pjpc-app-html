import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const center = searchParams.get('center')
  const limit = parseInt(searchParams.get('limit') || '500')
  
  console.log('🔍 API: 获取学生数据请求', { center, limit })
  
  try {
    // 使用IP地址连接PocketBase
    const pb = new PocketBase('http://175.143.222.30:8090')
    
    // 管理员认证
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ API: PocketBase管理员认证成功')
    
    // 构建查询过滤器
    let filter = ''
    if (center) {
      // 尝试多种center格式
      const normalizedCenter = center.trim().toUpperCase()
      filter = `center = "${center}" || center = "${normalizedCenter}" || center = "WX 01" || center = "WX 02"`
      console.log('🔍 API: 使用多格式过滤器:', filter)
    }
    
    // 查询学生数据
    const students = await pb.collection('students').getList(1, limit, {
      filter: filter || undefined,
      sort: 'student_name'
    })
    
    console.log('✅ API: 查询到学生数据', { 
      total: students.items.length,
      center,
      sampleStudents: students.items.slice(0, 2).map(s => ({
        student_id: s.student_id,
        student_name: s.student_name,
        cardNumber: s.cardNumber,
        center: s.center
      }))
    })
    
    // 处理结果
    const processedStudents = students.items.map(student => ({
      id: student.id,
      student_id: student.student_id,
      student_name: student.student_name,
      cardNumber: student.cardNumber,
      center: student.center || student.Center || student.centre || student.branch,
      created: student.created,
      updated: student.updated
    }))
    
    return NextResponse.json({
      success: true,
      data: processedStudents,
      total: students.totalItems,
      page: students.page,
      perPage: students.perPage,
      totalPages: students.totalPages
    })
    
  } catch (error) {
    console.error('❌ API: 获取学生数据失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}