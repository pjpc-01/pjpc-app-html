import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 从课程时间表自动生成时薪老师本月排班（真实日期，今天起，已过日期不动）
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    if (!pb.authStore.isValid) await authenticateAdmin(pb)

    // 1) 找所有时薪老师
    const hourly = await pb.collection('teacher_salary_structures').getList(1, 100, {
      filter: 'salary_type = "hourly" && status = "active"',
    })
    const hourlyTeacherIds = new Set(hourly.items.map((s: any) => s.teacher_id))
    if (hourlyTeacherIds.size === 0) {
      return NextResponse.json({ success: true, message: '没有时薪老师，无需生成排班', generated: 0 })
    }

    // 2) 找课程排班（时间表），仅限这些时薪老师的
    const courseSchedules = await pb.collection('schedules').getFullList({
      filter: 'schedule_type = "course_schedule"',
      sort: 'day_of_week,start_time',
    })
    const timetable = courseSchedules.filter((s: any) => hourlyTeacherIds.has(s.teacher_id))

    // 3) 计算本月（从今天起）所有日期及其星期
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // 4) 收集本月已有的课程排班，避免重复（按 teacher+date+course）
    const existing = await pb.collection('schedules').getFullList({
      filter: `schedule_type = "course_schedule" && date >= "${todayStr}"`,
    })
    const existingKeys = new Set(
      existing.map((e: any) => `${e.teacher_id}|${(e.date || '').split(' ')[0]}|${e.course_id || ''}`)
    )

    let generated = 0
    let skipped = 0

    // 5) 对本月每个日期（今天起），匹配时间表生成
    for (let d = now.getDate(); d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const weekday = WEEKDAYS[dateObj.getDay()]

      for (const t of timetable) {
        if (t.day_of_week !== weekday && DAY_INDEX[t.day_of_week] !== dateObj.getDay()) continue
        const key = `${t.teacher_id}|${dateStr}|${t.course_id}`
        if (existingKeys.has(key)) { skipped++; continue }

        await pb.collection('schedules').create({
          teacher_id: t.teacher_id,
          course_id: t.course_id || '',
          class_id: t.course_id || t.class_id || '',
          date: dateStr,
          start_time: t.start_time,
          end_time: t.end_time,
          schedule_type: 'course_schedule',
          status: 'scheduled',
          center: t.center || '',
          room: t.room || '',
          course_title: t.course_title || '',
          teacher_name: t.teacher_name || '',
          course_subject: t.course_subject || '',
          course_grade: t.course_grade || '',
          notes: t.notes || '从时间表自动生成',
          hourly_rate: t.hourly_rate || null,
          total_hours: t.total_hours || 0,
        })
        existingKeys.add(key)
        generated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `排班生成完成：新增 ${generated} 条，重复跳过 ${skipped} 条`,
      generated,
      skipped,
      teacherCount: hourlyTeacherIds.size,
    })
  } catch (error) {
    console.error('自动生成排班失败:', error)
    return NextResponse.json(
      { success: false, error: '自动生成排班失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}