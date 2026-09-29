import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

// 学生请假记录 —— 结构对齐教师请假（teacher_leave_record / /api/teacher-leave）
// 差别：① 无审批流，录入即生效（status 默认 approved，仍可改）
//       ② 无 substitute_teacher；approved_by 为文本（记录操作人）

export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const status = searchParams.get('status')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let filter = '1=1'
    if (studentId) filter += ` && student_id = "${studentId}"`
    if (status) filter += ` && status = "${status}"`
    if (year) filter += ` && start_date >= "${year}-01-01" && start_date <= "${year}-12-31"`
    if (month) {
      const y = year || String(new Date().getFullYear())
      const m = String(month).padStart(2, '0')
      filter += ` && start_date >= "${y}-${m}-01" && start_date <= "${y}-${m}-31"`
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const records = await pb.collection('student_leave_record').getList(page, limit, {
      filter,
      expand: 'student_id',
      sort: '-start_date',
    })

    return NextResponse.json({
      success: true,
      data: records.items,
      total: records.totalItems,
      page,
      totalPages: records.totalPages,
    })
  } catch (error) {
    console.error('获取学生请假记录失败:', error)
    return NextResponse.json({ success: false, error: '获取学生请假记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const { student_id, leave_type, start_date, end_date, reason, status, notes } = body
    if (!student_id || !start_date || !end_date) {
      return NextResponse.json({ success: false, error: '缺少必需字段: student_id / start_date / end_date' }, { status: 400 })
    }

    // 请假天数（含首尾）
    const start = new Date(start_date)
    const end = new Date(end_date)
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1)

    const record = await pb.collection('student_leave_record').create({
      student_id,
      leave_type: leave_type || 'sick',
      start_date,
      end_date,
      total_days: totalDays,
      reason: reason || '',
      status: status || 'approved',   // 录入即生效
      applied_date: new Date().toISOString(),
      notes: notes || '',
    })

    return NextResponse.json({ success: true, data: record, message: '学生请假记录已保存' })
  } catch (error: any) {
    console.error('创建学生请假记录失败:', error)
    return NextResponse.json({ success: false, error: `创建失败: ${error?.message || error}` }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const { id, status, rejection_reason, notes, approved_by, student_id, leave_type, start_date, end_date, reason } = body
    if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 })

    const updateData: any = {}
    if (student_id !== undefined) updateData.student_id = student_id
    if (leave_type !== undefined) updateData.leave_type = leave_type
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (start_date !== undefined && end_date !== undefined) {
      const s = new Date(start_date), e = new Date(end_date)
      updateData.total_days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1)
    }
    if (reason !== undefined) updateData.reason = reason
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) {
      updateData.status = status
      updateData.approved_date = (status === 'approved' || status === 'rejected') ? new Date().toISOString() : null
      updateData.rejection_reason = status === 'rejected' ? (rejection_reason || '') : ''
    }
    if (approved_by !== undefined) updateData.approved_by = approved_by

    const record = await pb.collection('student_leave_record').update(id, updateData)
    return NextResponse.json({ success: true, data: record, message: '学生请假记录已更新' })
  } catch (error: any) {
    console.error('更新学生请假记录失败:', error)
    return NextResponse.json({ success: false, error: `更新失败: ${error?.message || error}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })

    await pb.collection('student_leave_record').delete(id)
    return NextResponse.json({ success: true, message: '学生请假记录删除成功' })
  } catch (error) {
    console.error('删除学生请假记录失败:', error)
    return NextResponse.json({ success: false, error: '删除学生请假记录失败' }, { status: 500 })
  }
}
