import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 检查排班冲突（包括请假冲突）
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { teacher_id, date, start_time, end_time, exclude_schedule_id } = data

    if (!teacher_id || !date) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    await authenticateAdmin()

    const conflicts = []

    // 1. 检查请假冲突
    const leaveCheck = await pb.collection('teacher_leave_record').getList(1, 10, {
      filter: `teacher_id = "${teacher_id}" && start_date <= "${date}" && end_date >= "${date}" && status = "approved"`
    })

    if (leaveCheck.items.length > 0) {
      leaveCheck.items.forEach(leave => {
        conflicts.push({
          type: 'leave',
          message: `教师在该日期已请假 (${leave.leave_type})`,
          details: {
            leaveType: leave.leave_type,
            reason: leave.reason,
            startDate: leave.start_date,
            endDate: leave.end_date,
            status: leave.status
          }
        })
      })
    }

    // 2. 检查排班时间冲突
    let scheduleFilter = `teacher_id = "${teacher_id}" && date = "${date}"`
    if (exclude_schedule_id) {
      scheduleFilter += ` && id != "${exclude_schedule_id}"`
    }

    const scheduleCheck = await pb.collection('schedules').getList(1, 10, {
      filter: scheduleFilter
    })

    if (scheduleCheck.items.length > 0) {
      scheduleCheck.items.forEach(schedule => {
        // 检查时间重叠
        const hasTimeConflict = start_time && end_time && 
          schedule.start_time && schedule.end_time &&
          ((start_time >= schedule.start_time && start_time < schedule.end_time) ||
           (end_time > schedule.start_time && end_time <= schedule.end_time) ||
           (start_time <= schedule.start_time && end_time >= schedule.end_time))

        if (hasTimeConflict) {
          conflicts.push({
            type: 'schedule',
            message: `与现有排班时间冲突`,
            details: {
              existingStartTime: schedule.start_time,
              existingEndTime: schedule.end_time,
              classId: schedule.class_id,
              center: schedule.center,
              status: schedule.status
            }
          })
        }
      })
    }

    // 3. 检查教师可用性（基于教师状态）
    const teacher = await pb.collection('teachers').getOne(teacher_id)
    if (teacher.status !== 'active') {
      conflicts.push({
        type: 'availability',
        message: `教师状态不可用 (${teacher.status})`,
        details: {
          teacherStatus: teacher.status,
          teacherName: teacher.name
        }
      })
    }

    return NextResponse.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
      summary: {
        totalConflicts: conflicts.length,
        leaveConflicts: conflicts.filter(c => c.type === 'leave').length,
        scheduleConflicts: conflicts.filter(c => c.type === 'schedule').length,
        availabilityConflicts: conflicts.filter(c => c.type === 'availability').length
      }
    })

  } catch (error) {
    console.error('检查排班冲突失败:', error)
    return NextResponse.json(
      { success: false, error: '检查排班冲突失败' },
      { status: 500 }
    )
  }
}
