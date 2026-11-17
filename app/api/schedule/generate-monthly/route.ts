import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 从课程时间表把某个整月铺成真实日期的排班（默认当前月，可传 year/month）
// 已存在的跳过；公假、已批请假不排；已过的日期缺的也补上
export async function POST(request: NextRequest) {
  // 定时任务（systemd timer）用内部钥匙调用，不走登录会话
  const internalKey = request.headers.get('x-pjpc-internal')
  const isInternal = !!internalKey && internalKey === process.env.PROXY_INTERNAL_KEY
  if (!isInternal) {
    const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
    if ('error' in gate) return gate.error
  }
  try {
    const pb = await getPocketBase()
    if (!pb.authStore.isValid) await authenticateAdmin(pb)

    // 1) 排班按「时间表」全班铺开：取所有在职老师
    //    （薪资口径另外只管时薪，见 app/api/salary/auto-generate —— 月薪不按排班算钱）
    const activeTeachers = await pb.collection('teachers').getFullList({
      filter: 'status = "active"',
    })
    const schedulerTeacherIds = new Set(activeTeachers.map((t: any) => t.id))
    if (schedulerTeacherIds.size === 0) {
      return NextResponse.json({ success: true, message: '没有在职老师，无需生成排班', generated: 0 })
    }

    // 2) 找课程排班（时间表），仅限这些时薪老师的
    const courseSchedules = await pb.collection('schedules').getFullList({
      filter: 'schedule_type = "course_schedule"',
      sort: 'day_of_week,start_time',
    })
    const timetable = courseSchedules.filter((s: any) => s.teacher_id && schedulerTeacherIds.has(s.teacher_id))

    // 3) 生成哪个月：body 可传 {year, month(1-12)}，不传就是当前月
    //    整月铺满（1 号到月末）—— 原来「从今天起」会把月初漏掉（10 月 1~5 号就是这样没排的）
    const body = await request.json().catch(() => ({} as any))
    const now = new Date()
    const year = Number(body?.year) > 0 ? Number(body.year) : now.getFullYear()
    const monthNum = Number(body?.month) > 0 ? Number(body.month) : now.getMonth() + 1
    const month = monthNum - 1
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`
    const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1
    const nextMonthYear = monthNum === 12 ? year + 1 : year
    const monthEndExclusive = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-01`

    // 4) 收集本月已有的课程排班，避免重复（按 teacher+date+course）
    const existing = await pb.collection('schedules').getFullList({
      filter: `schedule_type = "course_schedule" && date >= "${monthStart}" && date < "${monthEndExclusive}"`,
    })
    const existingKeys = new Set(
      existing.map((e: any) => `${e.teacher_id}|${(e.date || '').split(' ')[0]}|${e.course_id || ''}`)
    )

    // 4.1) 公假（马来西亚联邦 + 雪州）：这些日期整体不排课
    const holidaySet = new Set<string>()
    try {
      const holidays = await pb.collection('public_holidays').getFullList()
      holidays.forEach((h: any) => {
        // 学校假期（type='school'）只在日历上显示，不阻止排课
        // （安亲班/补习班在学期假期通常照常上课，只有公共假期才停课）
        if ((h.type || 'public') === 'school') return
        const d = (h.date || '').split('T')[0].split(' ')[0]
        if (d) holidaySet.add(d)
      })
    } catch (e) {
      console.warn('获取公假失败，按无公假继续:', e)
    }

    // 4.2) 已批准请假：该教师请假日期不排其课
    const leaveByTeacher = new Map<string, Set<string>>()
    try {
      const approvedLeaves = await pb.collection('teacher_leave_record').getFullList({
        filter: 'status = "approved"',
      })
      approvedLeaves.forEach((l: any) => {
        let s = (l.start_date || '').split('T')[0].split(' ')[0]
        let e = (l.end_date || '').split('T')[0].split(' ')[0]
        if (!s || !e) return
        const tid = l.teacher_id
        if (!leaveByTeacher.has(tid)) leaveByTeacher.set(tid, new Set())
        const set = leaveByTeacher.get(tid)!
        let cur = new Date(s + 'T00:00:00')
        const endD = new Date(e + 'T00:00:00')
        let guard = 0
        while (cur <= endD && guard < 500) {
          const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
          set.add(ds)
          cur.setDate(cur.getDate() + 1)
          guard++
        }
      })
    } catch (e) {
      console.warn('获取请假记录失败，按无请假继续:', e)
    }

    let generated = 0
    let skipped = 0
    let skippedHoliday = 0
    let skippedLeave = 0

    // 5) 整月每天（1 号到月末）匹配时间表生成；已存在的跳过，已过的日期缺的也补
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const weekday = WEEKDAYS[dateObj.getDay()]

      // 公假：当天整体跳过（无课程、无排班）
      if (holidaySet.has(dateStr)) {
        skippedHoliday++
        continue
      }

      for (const t of timetable) {
        if (t.day_of_week !== weekday && DAY_INDEX[t.day_of_week] !== dateObj.getDay()) continue
        // 该教师已批准请假：这天不排他的课
        if (leaveByTeacher.get(t.teacher_id)?.has(dateStr)) {
          skippedLeave++
          continue
        }
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
      message: `排班生成完成：新增 ${generated} 条，公假跳过 ${skippedHoliday} 天，批假跳过 ${skippedLeave} 条，重复跳过 ${skipped} 条`,
      generated,
      skipped,
      skippedHoliday,
      skippedLeave,
      teacherCount: new Set(timetable.map((t: any) => t.teacher_id)).size,
    })
  } catch (error) {
    console.error('自动生成排班失败:', error)
    return NextResponse.json(
      { success: false, error: '自动生成排班失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}