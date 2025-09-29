import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { ensureAdminAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentName = searchParams.get('name') || 'VASUMITRA D/O THAYALAN'
    
    console.log(`[Debug] 开始查找学生: ${studentName}`)
    
    const pb = await getPocketBase()
    console.log(`[Debug] PocketBase实例获取成功`)
    
    await ensureAdminAuth(pb)
    console.log(`[Debug] 管理员认证成功`)
    
    // 查找学生记录
    const students = await pb.collection('students').getList(1, 10, {
      filter: `student_name ~ "${studentName}"`,
      expand: ''
    })
    
    console.log(`[Debug] 找到 ${students.items.length} 个学生记录`)
    
    return NextResponse.json({
      success: true,
      data: students.items.map(student => ({
        id: student.id,
        student_name: student.student_name,
        student_id: student.student_id,
        center: student.center || student.Center || student.centre || student.branch,
        allFields: Object.keys(student)
      })),
      total: students.items.length
    })
    
  } catch (error) {
    console.error('[Debug] 查询失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '查询失败',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
