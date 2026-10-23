import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { gradeCanon } from '@/lib/grades'
import { getNewAchievements } from '@/lib/achievements'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 学生首页一次性取数（学生账号专用）。
 *
 * 为什么合并成一个接口：/my 要显示课表、作业、积分、公告、请假五块，
 * 分开请求 = 5 个 401/403 风险 + 5 次往返。这里服务端用超管查，
 * 学生只能拿自己的，员工可指定 studentId 复用。
 */
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
// 排课表的 day_of_week 混着 Mon/Tue 短码、Monday 全名、甚至中文 —— 统一认
const DAY_ALIAS: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
  周一: 'Monday', 周二: 'Tuesday', 周三: 'Wednesday', 周四: 'Thursday', 周五: 'Friday', 周六: 'Saturday', 周日: 'Sunday',
  星期一: 'Monday', 星期二: 'Tuesday', 星期三: 'Wednesday', 星期四: 'Thursday', 星期五: 'Friday', 星期六: 'Saturday', 星期日: 'Sunday',
}
const DAY_ZH: Record<string, string> = {
  Monday: '星期一', Tuesday: '星期二', Wednesday: '星期三', Thursday: '星期四',
  Friday: '星期五', Saturday: '星期六', Sunday: '星期日',
}

function pad(n: number) { return String(n).padStart(2, '0') }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['student', 'admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const sid = gate.session.role === 'student'
    ? String(gate.session.studentId || '')
    : String(searchParams.get('studentId') || '')

  if (!sid) return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料，请联系老师' }, { status: 403 })

  try {
    const token = await getAdminToken()
    const H = { Authorization: token }
    const get = async (path: string) => {
      const r = await fetch(`${PB_URL}/api/collections/${path}`, { headers: H, cache: 'no-store' })
      return r.ok ? r.json() : { items: [] }
    }

    // 1) 档案
    const sRes = await fetch(`${PB_URL}/api/collections/students/records/${encodeURIComponent(sid)}`, { headers: H, cache: 'no-store' })
    if (!sRes.ok) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })
    const student = await sRes.json()
    const canon = gradeCanon(student.grade)

    const now = new Date()
    const today = ymd(now)
    const todayName = DAY_ORDER[(now.getDay() + 6) % 7] // 周一=0
    const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01 00:00:00`

    // 2) 本年级课程 → 今日课表 + 本周课表
    const [courses, schedules, homework, submissions, points, notices, leaves, att] = await Promise.all([
      get(`courses/records?perPage=300&fields=id,title,subject,grade_level`),
      get(`schedules/records?perPage=500&fields=id,course_id,course_title,day_of_week,start_time,end_time,teacher_name,room`),
      get(`homework/records?perPage=100&sort=-dueDate&fields=id,title,subject,grade,dueDate,assignedDate,status,description,teacherId`),
      get(`homework_submissions/records?perPage=200&filter=${encodeURIComponent(`studentId="${sid}"`)}&fields=id,homeworkId,status,score,submittedDate`),
      get(`point_logs/records?perPage=50&sort=-created&filter=${encodeURIComponent(`student="${sid}"`)}&fields=id,amount,reason,created,teacher`),
      get(`activities/records?perPage=10&sort=-date&fields=id,title,description,category,date,time,center`),
      get(`student_leave_record/records?perPage=10&sort=-created&filter=${encodeURIComponent(`student_id="${sid}"`)}`),
      get(`student_attendance/records?perPage=100&sort=-date&filter=${encodeURIComponent(`student_id="${sid}"`)}&fields=id,date,status,check_in`),
    ])

    const myCourseIds = new Set((courses.items || []).filter((c: any) => gradeCanon(c.grade_level) === canon).map((c: any) => c.id))
    const titleOf = new Map((courses.items || []).map((c: any) => [c.id, c.title]))

    const seenSlot = new Set<string>()
    const allMySchedule = (schedules.items || [])
      .filter((s: any) => myCourseIds.has(s.course_id))
      // 同一门课同一时段会在多个中心/多行重复，学生只看一行
      .filter((s: any) => {
        const k = `${s.course_id}|${String(s.date || '').slice(0, 10)}|${s.day_of_week}|${s.start_time}`
        if (seenSlot.has(k)) return false
        seenSlot.add(k)
        return true
      })
      .map((s: any) => ({
        id: s.id,
        date: String(s.date || '').slice(0, 10),
        day_of_week: s.day_of_week,
        day_zh: DAY_ZH[s.day_of_week] || s.day_of_week || '',
        start_time: s.start_time,
        end_time: s.end_time,
        course: titleOf.get(s.course_id) || s.course_title || '',
        teacher: s.teacher_name || '',
        room: s.room || '',
      }))

    const todayClasses = allMySchedule
      .filter((s: any) => s.date === today || DAY_ALIAS[String(s.day_of_week || '')] === todayName || s.day_of_week === todayName)
      .sort((a: any, b: any) => String(a.start_time).localeCompare(String(b.start_time)))

    const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    const nextClass = todayClasses.find((c: any) => String(c.end_time) > nowHM) || null

    // 3) 作业：按年级 + 状态，标出我交了没
    const subMap = new Map((submissions.items || []).map((x: any) => [x.homeworkId, x]))
    const myHomework = (homework.items || [])
      .filter((h: any) => gradeCanon(h.grade) === canon && String(h.status || 'active') === 'active')
      .map((h: any) => {
        const sub: any = subMap.get(h.id)
        return {
          id: h.id, title: h.title, subject: h.subject, dueDate: h.dueDate, assignedDate: h.assignedDate,
          description: h.description || '',
          submitted: !!sub,
          submissionStatus: sub?.status || '',
          score: sub?.score ?? null,
        }
      })
      .sort((a: any, b: any) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')))

    const pendingHomework = myHomework.filter((h: any) => !h.submitted)

    // 4) 积分
    const monthly = (points.items || [])
      .filter((p: any) => String(p.created || '').slice(0, 10) >= today.slice(0, 8) + '01')
      .reduce((a: number, p: any) => a + Number(p.amount || 0), 0)

    // 5) 考勤（本月）
    const attItems = att.items || []
    const monthKey = today.slice(0, 7)
    const attendance = {
      present: attItems.filter((a: any) => String(a.status) !== 'absent' && String(a.date).slice(0, 7) === monthKey).length,
      absent: attItems.filter((a: any) => String(a.status) === 'absent' && String(a.date).slice(0, 7) === monthKey).length,
      records: attItems.length,
    }

    // 6) 成就：算一下有没有新解锁没看过的（首页提示用）
    let achievements = { earned_count: 0, total: 0, fresh: [] as any[] }
    try {
      const a = await getNewAchievements(token, sid)
      achievements = {
        earned_count: a.earned.size,
        total: a.total,
        fresh: (a.fresh || []).map((d) => ({ code: d.code, name: d.name, icon: d.icon || '', condition: d.condition || '' })),
      }
    } catch { /* 成就算不出来不影响首页其他内容 */ }

    return NextResponse.json({
      success: true,
      achievements,
      student: {
        id: student.id, name: student.name, student_id: student.student_id,
        grade: student.grade, center: student.center, avatar: student.avatar,
        points: Number(student.points || 0), points_enabled: student.points_enabled !== false,
      },
      today: { date: today, weekday: todayName, weekday_zh: DAY_ZH[todayName] || '', classes: todayClasses, next: nextClass },
      week_schedule: allMySchedule,
      homework: myHomework,
      pending_homework: pendingHomework.length,
      points: {
        total: Number(student.points || 0),
        monthly,
        recent: (points.items || []).slice(0, 10).map((p: any) => ({ id: p.id, amount: p.amount, reason: p.reason, created: p.created })),
      },
      attendance,
      notices: (notices.items || []).map((n: any) => ({
        id: n.id, title: n.title, description: n.description, category: n.category, date: n.date, time: n.time,
      })),
      leaves: leaves.items || [],
      monthly_points: monthly,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
