import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const center = searchParams.get('center')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  console.log('🔍 API: 获取教师数据请求', { center, limit })
  
  try {
    // 使用IP地址连接PocketBase
    const pb = new PocketBase('http://175.143.222.30:8090')
    
    // 管理员认证
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ API: PocketBase管理员认证成功')
    
    // 暂时不过滤center，返回所有教师数据
    // TODO: 需要根据center ID进行关联查询
    const teachers = await pb.collection('teachers').getList(1, limit, {
      sort: 'name'
    })
    
    console.log('✅ API: 查询到教师数据', { 
      total: teachers.items.length,
      center,
      sampleTeachers: teachers.items.slice(0, 2).map(t => ({
        teacher_id: t.user_id,
        teacher_name: t.name,
        cardNumber: t.cardNumber,
        center: center
      }))
    })
    
    // 处理结果 - 匹配前端期望的字段格式
    const processedTeachers = teachers.items.map(teacher => ({
      id: teacher.id,
      teacher_id: teacher.user_id, // 使用teacher_id字段名
      teacher_name: teacher.name, // 使用teacher_name字段名
      name: teacher.name, // 保持name字段作为备用
      cardNumber: teacher.cardNumber,
      center: teacher.center_assignment || center, // 使用center字段名
      center_assignment: teacher.center_assignment || center, // 保持center_assignment字段
      position: teacher.position,
      department: teacher.department,
      created: teacher.created,
      updated: teacher.updated
    }))
    
    return NextResponse.json({
      success: true,
      data: processedTeachers,
      total: teachers.totalItems,
      page: teachers.page,
      perPage: teachers.perPage,
      totalPages: teachers.totalPages
    })
    
  } catch (error) {
    console.error('❌ API: 获取教师数据失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}