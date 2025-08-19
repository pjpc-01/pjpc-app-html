import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function POST(request: NextRequest) {
  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090')
    
    // 登录管理员账户
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    
    // 获取所有学生记录
    const students = await pb.collection('students').getList(1, 1000, {
      sort: 'student_name',
      $autoCancel: false
    })
    
    let updatedCount = 0
    let skippedCount = 0
    const updates = []
    
    for (const student of students.items) {
      const studentId = student.student_id
      
      if (!studentId) {
        skippedCount++
        continue
      }
      
      // 根据学号前缀确定服务类型
      let serviceType = null
      if (studentId.startsWith('T')) {
        serviceType = 'tuition'
      } else if (studentId.startsWith('B') || studentId.startsWith('G')) {
        serviceType = 'afterschool'
      } else {
        skippedCount++
        continue
      }
      
      // 检查是否需要更新
      if (student.serviceType === serviceType) {
        skippedCount++
        continue
      }
      
      // 更新学生记录
      try {
        await pb.collection('students').update(student.id, {
          serviceType: serviceType
        })
        
        updates.push({
          name: student.student_name,
          studentId: studentId,
          serviceType: serviceType
        })
        updatedCount++
        
      } catch (error) {
        console.error(`更新学生 ${student.student_name} 失败:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '批量更新完成',
      stats: {
        updated: updatedCount,
        skipped: skippedCount,
        total: students.items.length
      },
      updates: updates
    })
    
  } catch (error: any) {
    console.error('批量更新失败:', error)
    return NextResponse.json({
      success: false,
      message: '批量更新失败',
      error: error.message
    }, { status: 500 })
  }
}
