import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { gradeCanon } from '@/lib/grades'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 教师工作台「今日待办」一次性取数。
 *
 * 老师登录最想知道三件事：今天几点上哪班、有多少作业没批、今天谁没来。
 * 以前工作台只有统计卡，这三样都要跳页找。这里一次给齐。
 * 员工账号可带 ?teacherId= 指定（校长代看）。
 */
const DAY_ALIAS: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
  周一: 'Monday', 周二: 'Tuesday', 周三: 'Wednesday', 周四: 'Thursday', 周五: 'Friday', 周六: 'Saturday', 周日: 'Sunday',
  星期一: 'Monday', 星期二: 'Tuesday', 星期三: 'Wednesday', 星期四: 'Thursday', 星期五: 'Friday', 星期六: 'Saturday', 星期日: 'Sunday',
}
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_ZH: Record<string, string> = { Monday: '星期一', Tuesday: '星期二', Wednesday: '星期三', Thursday: '星期四', Friday: '星期五', Saturday: '星期六', Sunday: '星期日' }

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['teacher', 'admin', 'office_admin'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const tid = String(gate.session.teacherId || searchParams.get('teacherId') || '')
  if (!tid) return NextResponse.json({ success: false, error: '这个账号还没绑定教师档案，请联系管理员' }, { status: 403 })

  try {
    const token = await getAdminToken()
    const H = { Authorization: token }
    const get = async (path: string) => {
      const r = await fetch(`${PB_URL}/api/collections/${path}`, { headers: H, cache: 'no-store' })
      return r.ok ? r.json() : { items: [] }
    }

    const now = new Date()
    const today = ymd(now)
    const dayName = DAY_NAMES[now.getDay()]
    const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`

    // 1) 教师档案
    const tRes = await fetch(`${PB_URL}/api/collections/teachers/records/${encodeURIComponent(tid)}`, { headers: H, cache: 'no-store' })
    if (!tRes.ok) return NextResponse.json({ success: false, error: '找不到教师档案' }, { status: 404 })
    const teacher = await tRes.json()

    // 2) 今日课程（先按 teacher_id，再按姓名兜底）
    const [byId, byName, courses, subs, att, notices] = await Promise.all([
      get(`schedules/records?perPage=300&fields=id,course_id,course_title,date,day_of_week,start_time,end_time,room,center,teacher_name&filter=${encodeURIComponent(`teacher_id="${tid}"`)}`),
      get(`schedules/records?perPage=300&fields=id,course_id,course_title,date,day_of_week,start_time,end_time,room,center,teacher_name&filter=${encodeURIComponent(`teacher_name="${teacher.name || ''}"`)}`),
      get(`courses/records?perPage=300&fields=id,title,grade_level`),
      get(`homework_submissions/records?perPage=200&sort=-created&filter=${encodeURIComponent('status="submitted"')}&fields=id,homeworkId,studentId,status,submittedDate`),
      get(`student_attendance/records?perPage=200&filter=${encodeURIComponent(`date>="${today} 00:00:00" && date<="${today} 23:59:59"`)}&fields=id,student_id,student_name,status,date`),
      get(`activities/records?perPage=8&sort=-date&fields=id,title,description,category,date,time`),
    ])

    const rows = [...(byId.items || []), ...(byName.items || [])]
    // 同一位老师同一时段可能既有 teacher_id 行又有 teacher_name 行（跨中心重复），按内容去重
    const seen = new Set<string>()
    const mySchedule = rows.filter((s: any) => {
      const k = `${s.course_id}|${String(s.date || '').slice(0, 10)}|${s.day_of_week}|${s.start_time}|${s.end_time}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

    const isToday = (s: any) => String(s.date || '').slice(0, 10) === today || DAY_ALIAS[String(s.day_of_week || '')] === dayName || s.day_of_week === dayName

    const courseTitle = new Map((courses.items || []).map((c: any) => [c.id, c.title]))
    const gradeOfCourse = new Map((courses.items || []).map((c: any) => [c.id, gradeCanon(c.grade_level)]))

    const todayClasses = mySchedule
      .filter(isToday)
      .map((s: any) => ({
        id: s.id,
        course: courseTitle.get(s.course_id) || s.course_title || '',
        grade: gradeOfCourse.get(s.course_id) || '',
        start_time: String(s.start_time || '').slice(0, 5),
        end_time: String(s.end_time || '').slice(0, 5),
        room: s.room || '',
        center: s.center || '',
      }))
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))

    const nextClass = todayClasses.find((c: any) => c.end_time > nowHM) || null

    // 3) 待批作业
    const pendingSubs = (subs.items || []).filter((x: any) => x.status === 'submitted')

    // 4) 今天没来的学生
    const absentToday = (att.items || []).filter((a: any) => String(a.status) === 'absent')

    // 5) 我的学生：只算「我实际上有课」的年级（不能拿全库课程的年级，否则全校都是我的学生）
    const myCourseIds = new Set(mySchedule.map((s: any) => s.course_id))
    const myGrades = [...new Set([...myCourseIds].map((cid: any) => gradeOfCourse.get(cid)).filter(Boolean))]
    let myStudents: any[] = []
    if (myGrades.length) {
      const filter = '(' + myGrades.map((g: any) => `grade="${g}"`).join(' || ') + ') && status!="inactive"'
      const st = await get(`students/records?perPage=300&sort=name&fields=id,name,student_id,grade,center,avatar&filter=${encodeURIComponent(filter)}`)
      myStudents = st.items || []
    }

    return NextResponse.json({
      success: true,
      teacher: { id: teacher.id, name: teacher.name, email: teacher.email || '', center: teacher.center || '' },
      today: {
        date: today,
        weekday: dayName,
        weekday_zh: DAY_ZH[dayName] || '',
        classes: todayClasses,
        next: nextClass,
        total_start: todayClasses[0]?.start_time || '',
      },
      pending_grading: pendingSubs.length,
      pending_list: pendingSubs.slice(0, 8),
      absent_today: absentToday.map((a: any) => ({ id: a.id, student_id: a.student_id, name: a.student_name || '', status: a.status })),
      my_students: myStudents,
      my_grades: myGrades,
      notices: (notices.items || []).map((n: any) => ({ id: n.id, title: n.title, description: n.description, date: n.date, category: n.category })),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
