import { NextRequest, NextResponse } from 'next/server'
import { getStudentCardByCardNumber, updateCardUsage } from '@/lib/pocketbase-students-card'

// 静态导出配置
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    const { cardNumber, deviceId, deviceName, location } = await request.json()

    if (!cardNumber) {
      return NextResponse.json(
        { error: '卡号是必需的' },
        { status: 400 }
      )
    }

    // 根据卡号查找学生卡片
    const studentCard = await getStudentCardByCardNumber(cardNumber)

    if (!studentCard) {
      return NextResponse.json(
        { error: '未找到对应的学生卡片' },
        { status: 404 }
      )
    }

    // 检查卡片状态
    if (studentCard.status !== 'active') {
      return NextResponse.json(
        { 
          error: '卡片状态异常',
          status: studentCard.status,
          studentName: studentCard.studentName,
          studentId: studentCard.studentId
        },
        { status: 400 }
      )
    }

    // 更新使用记录
    const updatedCard = await updateCardUsage(studentCard.id, studentCard.usageCount || 0)

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '考勤成功',
      data: {
        studentId: studentCard.studentId,
        studentName: studentCard.studentName,
        level: studentCard.level,
        studentUrl: studentCard.studentUrl,
        cardNumber: studentCard.cardNumber,
        usageCount: updatedCard.usageCount,
        lastUsed: updatedCard.lastUsed,
        deviceId,
        deviceName,
        location,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('考勤处理失败:', error)
    return NextResponse.json(
      { error: '考勤处理失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardNumber = searchParams.get('cardNumber')

    if (!cardNumber) {
      return NextResponse.json(
        { error: '卡号是必需的' },
        { status: 400 }
      )
    }

    // 根据卡号查找学生卡片
    const studentCard = await getStudentCardByCardNumber(cardNumber)

    if (!studentCard) {
      return NextResponse.json(
        { error: '未找到对应的学生卡片' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        studentId: studentCard.studentId,
        studentName: studentCard.studentName,
        level: studentCard.level,
        studentUrl: studentCard.studentUrl,
        cardNumber: studentCard.cardNumber,
        status: studentCard.status,
        usageCount: studentCard.usageCount,
        lastUsed: studentCard.lastUsed
      }
    })

  } catch (error) {
    console.error('获取学生卡片信息失败:', error)
    return NextResponse.json(
      { error: '获取学生卡片信息失败' },
      { status: 500 }
    )
  }
}
