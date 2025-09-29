import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 获取教师个人档案数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const type = searchParams.get('type') // 'attendance', 'leave', 'classes'

    if (!teacherId) {
      return NextResponse.json(
        { error: '缺少必需参数: teacherId' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 管理员认证
    if (!pb.authStore.isValid) {
      await authenticateAdmin(pb)
    }

    if (type === 'attendance') {
      // 获取教师考勤记录
      const attendanceRecords = await pb.collection('teacher_attendance').getList(1, 50, {
        filter: `teacher_id = "${teacherId}"`,
        sort: '-date'
      })

      return NextResponse.json({
        success: true,
        records: attendanceRecords.items,
        total: attendanceRecords.totalItems
      })
    }

    if (type === 'leave') {
      // 获取教师请假记录
      const leaveRecords = await pb.collection('teacher_leave').getList(1, 50, {
        filter: `teacher_id = "${teacherId}"`,
        sort: '-created'
      })

      return NextResponse.json({
        success: true,
        records: leaveRecords.items,
        total: leaveRecords.totalItems
      })
    }

    if (type === 'classes') {
      // 获取教师负责的班级
      const classAssignments = await pb.collection('schedules').getList(1, 50, {
        filter: `teacher_id = "${teacherId}"`,
        sort: '-created'
      })

      return NextResponse.json({
        success: true,
        records: classAssignments.items,
        total: classAssignments.totalItems
      })
    }

    // 获取教师基本信息
    const teacher = await pb.collection('teachers').getOne(teacherId)
    
    return NextResponse.json({
      success: true,
      teacher
    })

  } catch (error: any) {
    console.error('获取教师档案失败:', error)
    return NextResponse.json(
      { 
        error: '获取教师档案失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

// 创建请假申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      teacherId, 
      leaveType, 
      startDate, 
      endDate, 
      reason,
      days 
    } = body

    if (!teacherId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: '缺少必需字段' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 管理员认证
    if (!pb.authStore.isValid) {
      await authenticateAdmin(pb)
    }

    // 创建请假申请
    const leaveRequest = await pb.collection('teacher_leave').create({
      teacher_id: teacherId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      days: days || 1,
      status: 'pending',
      applied_date: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      leaveRequest
    })

  } catch (error: any) {
    console.error('创建请假申请失败:', error)
    return NextResponse.json(
      { 
        error: '创建请假申请失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
