import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 动态导出配置
export const dynamic = 'force-dynamic'

// 调试现有数据
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始检查现有数据...')
    const pb = await getPocketBase()
    
    // 确保认证状态有效
    if (!pb.authStore.isValid) {
      console.log('⚠️ 认证状态无效，重新认证...')
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    }
    
    const result: any = {}
    
    // 检查学生数据
    try {
      const students = await pb.collection('students').getList(1, 5)
      result.students = {
        count: students.totalItems,
        sample: students.items.map(s => ({
          id: s.id,
          name: s.name,
          student_name: s.student_name,
          student_id: s.student_id,
          center: s.center
        }))
      }
    } catch (error) {
      result.students = { error: error instanceof Error ? error.message : '获取失败' }
    }
    
    // 检查教师数据
    try {
      const teachers = await pb.collection('teachers').getList(1, 5)
      result.teachers = {
        count: teachers.totalItems,
        sample: teachers.items.map(t => ({
          id: t.id,
          name: t.name,
          teacher_name: t.teacher_name,
          email: t.email,
          nfc_card_number: t.nfc_card_number
        }))
      }
    } catch (error) {
      result.teachers = { error: error instanceof Error ? error.message : '获取失败' }
    }
    
    // 检查学生积分数据
    try {
      const studentPoints = await pb.collection('student_points').getList(1, 5)
      result.studentPoints = {
        count: studentPoints.totalItems,
        sample: studentPoints.items.map(sp => ({
          id: sp.id,
          student_id: sp.student_id,
          current_points: sp.current_points,
          total_earned: sp.total_earned,
          total_spent: sp.total_spent,
          season_number: sp.season_number
        }))
      }
    } catch (error) {
      result.studentPoints = { error: error instanceof Error ? error.message : '获取失败' }
    }
    
    // 检查积分交易数据
    try {
      const pointTransactions = await pb.collection('point_transactions').getList(1, 5)
      result.pointTransactions = {
        count: pointTransactions.totalItems,
        sample: pointTransactions.items.map(pt => ({
          id: pt.id,
          student_id: pt.student_id,
          teacher_id: pt.teacher_id,
          points_change: pt.points_change,
          transaction_type: pt.transaction_type,
          reason: pt.reason
        }))
      }
    } catch (error) {
      result.pointTransactions = { error: error instanceof Error ? error.message : '获取失败' }
    }
    
    console.log('📋 数据检查结果:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('❌ 检查数据失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
