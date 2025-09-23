import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { logScheduleAction, logScheduleError } from '@/lib/schedule-logger'

// 获取排班数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const employeeId = searchParams.get('employeeId')
    const center = searchParams.get('center')
    const type = searchParams.get('type')

    let filter = ''
    const conditions = []

    if (date) {
      conditions.push(`date = "${date}"`)
    }
    if (employeeId) {
      conditions.push(`teacher_id = "${employeeId}"`)
    }
    if (center && center !== 'all') {
      conditions.push(`center = "${center}"`)
    }
    if (type && type !== 'all') {
      conditions.push(`schedule_type = "${type}"`)
    }

    if (conditions.length > 0) {
      filter = conditions.join(' && ')
    }

    try {
      const pb = await getPocketBase()
      
      // 确保使用管理员认证
      if (!pb.authStore.isValid) {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      }
      
      const schedules = await pb.collection('schedules').getList(1, 100, {
        filter,
        sort: '-created'
      })

      // 处理日期格式，将 ISO 日期字符串转换为 yyyy-MM-dd 格式
      const processedSchedules = schedules.items.map((schedule: any) => ({
        ...schedule,
        date: schedule.date ? schedule.date.split(' ')[0] : schedule.date
      }))

      return NextResponse.json({
        success: true,
        schedules: processedSchedules
      })
    } catch (pbError) {
      console.error('PocketBase 获取失败:', pbError)
      return NextResponse.json(
        { success: false, error: '获取排班数据失败: ' + (pbError instanceof Error ? pbError.message : 'Unknown error') },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('获取排班数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取排班数据失败' },
      { status: 500 }
    )
  }
}

// 创建排班
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { userId, userName, userRole } = data
    
    // 权限检查
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户信息' },
        { status: 400 }
      )
    }

    // 暂时跳过权限和冲突检查，直接创建排班
    
    const scheduleData = {
      teacher_id: data.employeeId, // 使用 teacher_id 而不是 employee_id
      class_id: data.classId || null,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      center: data.center,
      room: data.room || null,
      status: data.status || 'scheduled',
      is_overtime: data.isOvertime || false,
      hourly_rate: data.hourlyRate || null,
      total_hours: data.totalHours || 0,
      schedule_type: data.employeeType, // 使用 schedule_type 而不是 employee_type
      notes: data.notes || null,
      created_by: userId,
      approved_by: null
    }

    try {
      const pb = await getPocketBase()
      
      // 确保使用管理员认证
      if (!pb.authStore.isValid) {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      }
      
      const schedule = await pb.collection('schedules').create(scheduleData)

      // 记录操作日志
      await logScheduleAction('create', userId, userName, userRole, {
        scheduleId: schedule.id,
        newValues: scheduleData,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })

      return NextResponse.json({
        success: true,
        schedule
      })
    } catch (pbError) {
      console.error('PocketBase 创建失败:', pbError)
      return NextResponse.json(
        { success: false, error: '创建排班失败: ' + (pbError instanceof Error ? pbError.message : 'Unknown error') },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('创建排班失败:', error)
    return NextResponse.json(
      { success: false, error: '创建排班失败' },
      { status: 500 }
    )
  }
}

// 更新排班
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    try {
      const pb = await getPocketBase()
      const schedule = await pb.collection('schedules').update(id, updateData)

      return NextResponse.json({
        success: true,
        schedule
      })
    } catch (pbError) {
      console.error('PocketBase 更新失败:', pbError)
      return NextResponse.json(
        { success: false, error: '更新排班失败: ' + (pbError instanceof Error ? pbError.message : 'Unknown error') },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('更新排班失败:', error)
    return NextResponse.json(
      { success: false, error: '更新排班失败' },
      { status: 500 }
    )
  }
}

// 删除排班
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少排班ID' },
        { status: 400 }
      )
    }

    try {
      const pb = await getPocketBase()
      await pb.collection('schedules').delete(id)

      return NextResponse.json({
        success: true,
        message: '排班删除成功'
      })
    } catch (pbError) {
      console.error('PocketBase 删除失败:', pbError)
      return NextResponse.json(
        { success: false, error: '删除排班失败: ' + (pbError instanceof Error ? pbError.message : 'Unknown error') },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('删除排班失败:', error)
    return NextResponse.json(
      { success: false, error: '删除排班失败' },
      { status: 500 }
    )
  }
}
