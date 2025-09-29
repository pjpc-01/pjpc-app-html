import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'
import { TeacherLeaveRecord } from '@/lib/pocketbase-schema'

// 获取教师请假记录
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const status = searchParams.get('status')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let filter = '1=1'
    if (teacherId) {
      filter += ` && teacher_id = "${teacherId}"`
    }
    if (status) {
      filter += ` && status = "${status}"`
    }
    if (year) {
      filter += ` && start_date >= "${year}-01-01" && start_date <= "${year}-12-31"`
    }
    if (month) {
      const monthStart = `${year || new Date().getFullYear()}-${month.padStart(2, '0')}-01`
      const monthEnd = `${year || new Date().getFullYear()}-${month.padStart(2, '0')}-31`
      filter += ` && start_date >= "${monthStart}" && start_date <= "${monthEnd}"`
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const records = await pb.collection('teacher_leave_record').getList(page, limit, {
      filter,
      expand: 'teacher_id,approved_by,substitute_teacher',
      sort: '-applied_date'
    })

    return NextResponse.json({
      success: true,
      data: records.items,
      total: records.totalItems,
      page,
      totalPages: records.totalPages
    })
  } catch (error) {
    console.error('获取教师请假记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取教师请假记录失败' },
      { status: 500 }
    )
  }
}

// 创建请假申请
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const { teacher_id, leave_type, start_date, end_date, reason, substitute_teacher, notes } = body

    // 计算请假天数
    const start = new Date(start_date)
    const end = new Date(end_date)
    const timeDiff = end.getTime() - start.getTime()
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1

    const leaveRecord: Partial<TeacherLeaveRecord> = {
      teacher_id,
      leave_type,
      start_date,
      end_date,
      total_days: totalDays,
      reason,
      status: 'pending',
      applied_date: new Date().toISOString(),
      substitute_teacher,
      notes
    }

    const record = await pb.collection('teacher_leave_record').create(leaveRecord)

    return NextResponse.json({
      success: true,
      data: record,
      message: '请假申请提交成功'
    })
  } catch (error) {
    console.error('创建请假申请失败:', error)
    return NextResponse.json(
      { success: false, error: '创建请假申请失败' },
      { status: 500 }
    )
  }
}

// 更新请假记录（审批）
export async function PUT(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const { id, status, approved_by, rejection_reason, notes } = body

    const updateData: Partial<TeacherLeaveRecord> = {
      status,
      approved_by,
      approved_date: status === 'approved' || status === 'rejected' ? new Date().toISOString() : undefined,
      rejection_reason: status === 'rejected' ? rejection_reason : undefined,
      notes
    }

    const record = await pb.collection('teacher_leave_record').update(id, updateData)

    return NextResponse.json({
      success: true,
      data: record,
      message: status === 'approved' ? '请假申请已批准' : status === 'rejected' ? '请假申请已拒绝' : '请假记录已更新'
    })
  } catch (error) {
    console.error('更新请假记录失败:', error)
    return NextResponse.json(
      { success: false, error: '更新请假记录失败' },
      { status: 500 }
    )
  }
}

// 删除请假记录
export async function DELETE(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    await pb.collection('teacher_leave_record').delete(id)

    return NextResponse.json({
      success: true,
      message: '请假记录删除成功'
    })
  } catch (error) {
    console.error('删除请假记录失败:', error)
    return NextResponse.json(
      { success: false, error: '删除请假记录失败' },
      { status: 500 }
    )
  }
}
