import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { Student } from '@/lib/pocketbase-students'

export async function POST(request: NextRequest) {
  try {
    const { cards } = await request.json()
    
    if (!Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'cards 必须是数组' },
        { status: 400 }
      )
    }
    
    console.log(`开始批量创建 ${cards.length} 个学生...`)
    
    const pb = await getPocketBase()
    
    // 认证
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ PocketBase 认证成功')
    
    const createdStudents: Student[] = []
    const errors: string[] = []
    
    for (const card of cards) {
      try {
        // 只包含必要字段，与简单测试保持一致（加入 center 支持）
        const cleanStudent = {
          student_id: card.studentId?.trim() || '',
          student_name: card.studentName?.trim() || '',
          standard: card.grade?.trim?.() || '',
          center: (card.center?.trim?.() || '').trim(),
          status: 'active'
        }
        
        // 验证必填字段
        if (!cleanStudent.student_id || !cleanStudent.student_name) {
          throw new Error(`缺少必填字段: student_id=${cleanStudent.student_id}, student_name=${cleanStudent.student_name}`)
        }
        
        console.log(`尝试创建学生: ${cleanStudent.student_id}`)
        
        const record = await pb.collection('students').create(cleanStudent)
        createdStudents.push(record as unknown as Student)
        console.log(`✅ 成功创建学生: ${cleanStudent.student_id}`)
        
      } catch (error) {
        const errorMsg = `创建学生失败 (${card.studentId}): ${error instanceof Error ? error.message : '未知错误'}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
        // 继续处理其他卡片，不中断整个批量操作
      }
    }
    
    console.log(`批量创建完成: 成功 ${createdStudents.length} 个，失败 ${errors.length} 个`)
    
    return NextResponse.json({
      success: true,
      created: createdStudents.length,
      failed: errors.length,
      errors: errors,
      cards: createdStudents
    })
    
  } catch (error) {
    console.error('批量创建学生失败:', error)
    return NextResponse.json(
      { error: '批量创建失败' },
      { status: 500 }
    )
  }
}
