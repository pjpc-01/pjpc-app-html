import { NextRequest, NextResponse } from 'next/server'
import { pointsSyncService } from '../../tv-board/services/points-sync'

// 创建积分交易并同步更新学生积分
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[PointsSync API] 收到积分交易请求:', body)
    
    // 验证必需字段
    const requiredFields = ['student_id', 'teacher_id', 'points_change', 'transaction_type', 'reason']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `缺少必需字段: ${field}`
        }, { status: 400 })
      }
    }

    // 创建交易并更新积分
    const result = await pointsSyncService.createTransactionAndUpdatePoints({
      student_id: body.student_id,
      teacher_id: body.teacher_id,
      points_change: Number(body.points_change),
      transaction_type: body.transaction_type,
      reason: body.reason,
      gift_name: body.gift_name,
      gift_points: body.gift_points ? Number(body.gift_points) : undefined
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '积分交易创建成功',
        transaction: result.transaction,
        studentPoints: result.studentPoints
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || '创建积分交易失败'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[PointsSync API] 处理请求失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}

// 修复积分数据一致性
export async function PUT(request: NextRequest) {
  try {
    console.log('[PointsSync API] 开始修复积分一致性...')
    
    const result = await pointsSyncService.fixPointsConsistency()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '积分数据修复完成',
        summary: result.summary,
        details: result.details
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '修复积分数据失败'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[PointsSync API] 修复积分数据失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}

// 获取学生积分历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少student_id参数'
      }, { status: 400 })
    }

    const result = await pointsSyncService.getStudentPointsHistory(studentId, limit)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || '获取积分历史失败'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[PointsSync API] 获取积分历史失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}
