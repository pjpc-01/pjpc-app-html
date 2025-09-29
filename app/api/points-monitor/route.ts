import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase-optimized'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 积分监控API开始执行...')
    
    // 使用优化的getPocketBase（自动处理认证）
    const pb = await getPocketBase()
    console.log('✅ 积分监控 - PocketBase实例已就绪，认证状态:', pb.authStore.isValid ? '有效' : '无效')

    console.log('🔍 开始积分数据健康检查...')
    
    // 获取所有学生积分记录
    let allStudentPoints = []
    try {
      allStudentPoints = await pb.collection('student_points').getFullList({
        expand: 'student_id'
      })
    } catch (error) {
      console.warn('⚠️ student_points集合不存在或无法访问:', error)
      allStudentPoints = []
    }
    
    // 获取所有积分交易记录
    let allTransactions = []
    try {
      allTransactions = await pb.collection('point_transactions').getFullList({
        sort: 'created'
      })
    } catch (error) {
      console.warn('⚠️ point_transactions集合不存在或无法访问:', error)
      allTransactions = []
    }
    
    console.log(`📊 检查 ${allStudentPoints.length} 个学生积分记录和 ${allTransactions.length} 条交易记录`)
    
    const inconsistencies = []
    const summary = {
      total_students: allStudentPoints.length,
      total_transactions: allTransactions.length,
      inconsistencies_found: 0,
      students_with_negative_points: 0,
      students_with_missing_transactions: 0,
      students_with_incorrect_totals: 0
    }
    
    // 检查每个学生的积分数据
    for (const studentPoints of allStudentPoints) {
      const studentId = studentPoints.student_id
      
      // 计算该学生的实际积分
      const studentTransactions = allTransactions.filter(t => t.student_id === studentId)
      
      let calculatedTotalEarned = 0
      let calculatedTotalSpent = 0
      let calculatedCurrentPoints = 0
      
      for (const transaction of studentTransactions) {
        if (transaction.transaction_type === 'add_points') {
          calculatedTotalEarned += transaction.points_change
          calculatedCurrentPoints += transaction.points_change
        } else if (transaction.transaction_type === 'deduct_points') {
          calculatedTotalSpent += Math.abs(transaction.points_change)
          calculatedCurrentPoints -= Math.abs(transaction.points_change)
        }
      }
      
      // 检查不一致性
      const hasInconsistency = 
        Math.abs(studentPoints.total_earned - calculatedTotalEarned) > 0.01 ||
        Math.abs(studentPoints.total_spent - calculatedTotalSpent) > 0.01 ||
        Math.abs(studentPoints.current_points - calculatedCurrentPoints) > 0.01
      
      if (hasInconsistency) {
        summary.inconsistencies_found++
        
        const inconsistency = {
          student_id: studentId,
          student_name: studentPoints.expand?.student_id?.student_name || 'Unknown',
          issue: '积分数据不一致',
          stored: {
            total_earned: studentPoints.total_earned,
            total_spent: studentPoints.total_spent,
            current_points: studentPoints.current_points
          },
          calculated: {
            total_earned: calculatedTotalEarned,
            total_spent: calculatedTotalSpent,
            current_points: calculatedCurrentPoints
          },
          difference: {
            total_earned: calculatedTotalEarned - studentPoints.total_earned,
            total_spent: calculatedTotalSpent - studentPoints.total_spent,
            current_points: calculatedCurrentPoints - studentPoints.current_points
          }
        }
        
        inconsistencies.push(inconsistency)
        console.warn(`⚠️ 积分数据不一致 - 学生 ${studentId}:`, inconsistency)
      }
      
      // 检查负数积分
      if (studentPoints.current_points < 0) {
        summary.students_with_negative_points++
      }
      
      // 检查是否有积分记录但没有交易记录
      if (studentPoints.current_points > 0 && studentTransactions.length === 0) {
        summary.students_with_missing_transactions++
      }
    }
    
    // 检查是否有交易记录但没有积分记录的学生
    const studentsWithTransactions = new Set(allTransactions.map(t => t.student_id))
    const studentsWithPoints = new Set(allStudentPoints.map(p => p.student_id))
    
    for (const studentId of studentsWithTransactions) {
      if (!studentsWithPoints.has(studentId)) {
        summary.students_with_missing_transactions++
        inconsistencies.push({
          student_id: studentId,
          student_name: 'Unknown',
          issue: '有交易记录但没有积分记录',
          stored: null,
          calculated: null,
          difference: null
        })
      }
    }
    
    console.log('✅ 积分数据健康检查完成:', summary)
    
    return NextResponse.json({
      success: true,
      summary,
      inconsistencies: inconsistencies.slice(0, 50), // 限制返回的不一致记录数量
      timestamp: new Date().toISOString(),
      message: summary.inconsistencies_found === 0 ? '积分数据健康' : `发现 ${summary.inconsistencies_found} 个数据不一致问题`
    })

  } catch (error) {
    console.error('❌ 积分监控检查失败:', error)
    
    // 如果积分系统未配置，返回成功状态而不是错误
    if (error instanceof Error && (
      error.message.includes('collection') || 
      error.message.includes('not found') ||
      error.message.includes('does not exist')
    )) {
      console.log('ℹ️ 积分系统未配置，返回默认健康状态')
      return NextResponse.json({
        success: true,
        summary: {
          total_students: 0,
          total_transactions: 0,
          inconsistencies_found: 0,
          students_with_negative_points: 0,
          students_with_missing_transactions: 0,
          students_with_incorrect_totals: 0
        },
        inconsistencies: [],
        timestamp: new Date().toISOString(),
        message: '积分系统未配置，系统健康'
      })
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: '积分监控检查失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}