import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 积分数据完整性验证工具
export async function GET(request: NextRequest) {
  try {
    console.log('[PointsValidate] 开始积分数据完整性验证...')
    
    const pb = await getPocketBase()
    await authenticateAdmin(pb)
    
    // 获取所有积分交易记录
    const allTransactions = await pb.collection('point_transactions').getFullList({
      sort: 'created',
      expand: 'student_id'
    })
    
    // 获取所有学生积分记录
    const allStudentPoints = await pb.collection('student_points').getFullList({
      expand: 'student_id'
    })
    
    console.log(`[PointsValidate] 验证 ${allTransactions.length} 条交易记录和 ${allStudentPoints.length} 条积分记录`)
    
    // 按学生ID计算期望的积分
    const expectedPointsMap = new Map<string, {
      current_points: number
      total_earned: number
      total_spent: number
      transaction_count: number
      transactions: any[]
    }>()
    
    allTransactions.forEach((transaction: any) => {
      const studentId = String(transaction.student_id)
      const points = Number(transaction.points_change) || 0
      
      if (!expectedPointsMap.has(studentId)) {
        expectedPointsMap.set(studentId, {
          current_points: 0,
          total_earned: 0,
          total_spent: 0,
          transaction_count: 0,
          transactions: []
        })
      }
      
      const studentPoints = expectedPointsMap.get(studentId)!
      studentPoints.transaction_count++
      studentPoints.transactions.push(transaction)
      
      if (points > 0) {
        studentPoints.total_earned += points
        studentPoints.current_points += points
      } else if (points < 0) {
        studentPoints.total_spent += Math.abs(points)
        studentPoints.current_points += points
      }
    })
    
    // 验证数据完整性
    const validationResults = []
    let totalIssues = 0
    
    for (const studentPoint of allStudentPoints) {
      const studentId = String(studentPoint.student_id)
      const expected = expectedPointsMap.get(studentId)
      const studentName = studentPoint.expand?.student_id?.student_name || 'Unknown'
      
      const issues = []
      
      if (expected) {
        // 检查积分一致性
        if (studentPoint.current_points !== expected.current_points) {
          issues.push({
            type: 'current_points_mismatch',
            expected: expected.current_points,
            actual: studentPoint.current_points,
            difference: expected.current_points - studentPoint.current_points
          })
        }
        
        if (studentPoint.total_earned !== expected.total_earned) {
          issues.push({
            type: 'total_earned_mismatch',
            expected: expected.total_earned,
            actual: studentPoint.total_earned,
            difference: expected.total_earned - studentPoint.total_earned
          })
        }
        
        if (studentPoint.total_spent !== expected.total_spent) {
          issues.push({
            type: 'total_spent_mismatch',
            expected: expected.total_spent,
            actual: studentPoint.total_spent,
            difference: expected.total_spent - studentPoint.total_spent
          })
        }
        
        // 检查交易记录数量
        if (expected.transaction_count === 0) {
          issues.push({
            type: 'no_transactions',
            message: '有积分记录但没有交易记录'
          })
        }
      } else {
        // 有积分记录但没有交易记录
        if (studentPoint.current_points > 0) {
          issues.push({
            type: 'orphaned_points',
            message: '有积分记录但没有对应的交易记录',
            current_points: studentPoint.current_points
          })
        }
      }
      
      if (issues.length > 0) {
        totalIssues += issues.length
        validationResults.push({
          student_id: studentId,
          student_name: studentName,
          issues,
          severity: issues.some(i => i.type === 'current_points_mismatch') ? 'high' : 'medium'
        })
      }
    }
    
    // 检查孤立的交易记录（有交易但没有积分记录）
    const studentPointsIds = new Set(allStudentPoints.map(p => String(p.student_id)))
    const orphanedTransactions = allTransactions.filter(t => !studentPointsIds.has(String(t.student_id)))
    
    if (orphanedTransactions.length > 0) {
      totalIssues += orphanedTransactions.length
      validationResults.push({
        student_id: 'orphaned',
        student_name: '孤立交易记录',
        issues: [{
          type: 'orphaned_transactions',
          message: `有 ${orphanedTransactions.length} 条交易记录没有对应的积分记录`,
          transaction_ids: orphanedTransactions.map(t => t.id)
        }],
        severity: 'high'
      })
    }
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_transactions: allTransactions.length,
        total_student_points: allStudentPoints.length,
        total_issues: totalIssues,
        students_with_issues: validationResults.length,
        high_severity_issues: validationResults.filter(r => r.severity === 'high').length,
        medium_severity_issues: validationResults.filter(r => r.severity === 'medium').length
      },
      validation_results: validationResults,
      recommendations: [
        totalIssues === 0 ? '数据完整性良好，无需修复' : '建议运行积分修复工具',
        orphanedTransactions.length > 0 ? '发现孤立交易记录，需要清理' : '交易记录完整',
        validationResults.some(r => r.severity === 'high') ? '发现严重数据不一致，需要立即修复' : '数据质量良好'
      ]
    }
    
    console.log(`[PointsValidate] 验证完成: 发现 ${totalIssues} 个问题，涉及 ${validationResults.length} 个学生`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[PointsValidate] 验证失败:', error)
    return NextResponse.json({
      success: false,
      error: '积分数据完整性验证失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 手动触发验证
export async function POST(request: NextRequest) {
  return GET(request)
}

