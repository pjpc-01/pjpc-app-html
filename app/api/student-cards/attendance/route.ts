import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// Helper functions for student card operations
const getStudentByCardNumber = async (cardNumber: string) => {
  try {
    const pb = await getPocketBase()
    const record = await pb.collection('students').getFirstListItem(
      `cardNumber = "${cardNumber}"`
    )
    return record
  } catch (error) {
    console.error('根据卡号获取学生失败:', error)
    return null
  }
}

const updateStudentUsage = async (id: string, usageCount: number) => {
  try {
    const pb = await getPocketBase()
    const record = await pb.collection('students').update(id, {
      lastUsed: new Date().toISOString(),
      usageCount: usageCount + 1
    })
    return record
  } catch (error) {
    console.error('更新学生使用记录失败:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cardNumber, deviceId, deviceName, location } = await request.json()

    if (!cardNumber) {
      return NextResponse.json(
        { error: '卡号是必需的' },
        { status: 400 }
      )
    }

    // 根据卡号查找学生
    const student = await getStudentByCardNumber(cardNumber)

    if (!student) {
      return NextResponse.json(
        { error: '未找到对应的学生' },
        { status: 404 }
      )
    }

    // 检查学生状态
    if (student.status !== 'active') {
      return NextResponse.json(
        { 
          error: '学生状态异常',
          status: student.status,
          studentName: student.student_name,
          studentId: student.student_id
        },
        { status: 400 }
      )
    }

    // 更新使用记录
    const updatedStudent = await updateStudentUsage(student.id, student.usageCount || 0)

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '考勤成功',
      data: {
        studentId: student.student_id,
        studentName: student.student_name,
        level: student.level,
        cardNumber: student.cardNumber,
        usageCount: updatedStudent.usageCount,
        lastUsed: updatedStudent.lastUsed,
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

    // 根据卡号查找学生
    const student = await getStudentByCardNumber(cardNumber)

    if (!student) {
      return NextResponse.json(
        { error: '未找到对应的学生' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        studentId: student.student_id,
        studentName: student.student_name,
        level: student.level,
        cardNumber: student.cardNumber,
        status: student.status,
        usageCount: student.usageCount,
        lastUsed: student.lastUsed
      }
    })

  } catch (error) {
    console.error('获取学生信息失败:', error)
    return NextResponse.json(
      { error: '获取学生信息失败' },
      { status: 500 }
    )
  }
}
