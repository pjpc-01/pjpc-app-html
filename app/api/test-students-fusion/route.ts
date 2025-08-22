import { NextResponse } from 'next/server'
import { getAllStudents } from '@/lib/pocketbase-students'

export async function GET() {
  try {
    console.log('=== 测试学生数据融合 ===')
    
    const students = await getAllStudents()
    
    console.log(`融合后获取到 ${students.length} 个学生`)
    
    if (students.length > 0) {
      console.log('第一个学生数据:', JSON.stringify(students[0], null, 2))
    }
    
    return NextResponse.json({
      success: true,
      count: students.length,
      sample: students.slice(0, 3)
    })
    
  } catch (error: any) {
    console.error('测试融合失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
