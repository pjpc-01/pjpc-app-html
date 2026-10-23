import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 成就系统 —— 像游戏那样：达成条件解锁徽章，可以把其中一个设成自己的称号。
 *
 * 成就定义存 achievements 集合；「有没有拿到」每次按真实数据算，不另存表，
 * 免得出现「记录说拿到了但数据对不上」。
 */
async function pbGet(token: string, path: string) {
  const r = await fetch(`${PB_URL}/api/collections/${path}`, { headers: { Authorization: token }, cache: 'no-store' })
  return r.ok ? r.json() : { items: [], totalItems: 0 }
}

/** 算出某个学生解锁了哪些成就代码 */
async function computeEarned(token: string, sid: string) {
  const student = await pbGet(token, `students/records/${sid}`)
  if (!student?.id) return null

  const code = String(student.student_id || '')
  const earned = new Set<string>()

  const firstDonate = await pbGet(token, 'contribution_logs/records?perPage=1&sort=created&filter=' + encodeURIComponent('kind="donate"'))
  if (firstDonate.items?.[0]?.student === sid) earned.add('first_contributor')

  const firstRedeem = await pbGet(token, 'reward_redemptions/records?perPage=1&sort=created')
  if (firstRedeem.items?.[0]?.student === sid) earned.add('first_redeem')

  const logs = await pbGet(token, 'contribution_logs/records?perPage=500&filter=' + encodeURIComponent(`kind="donate" && student="${sid}"`))
  const contributed = (logs.items || []).reduce((a: number, x: any) => a + Number(x.points || 0), 0)
  if (contributed >= 100) earned.add('contributor_100')
  if (contributed >= 500) earned.add('contributor_500')

  if (Number(student.points || 0) >= 500) earned.add('points_500')

  let attendance = 0
  for (const key of [sid, code].filter(Boolean)) {
    const att = await pbGet(token, 'student_attendance/records?perPage=1&fields=id&filter=' + encodeURIComponent(`student_id="${key}" && status="present"`))
    attendance = Math.max(attendance, Number(att.totalItems || 0))
  }
  if (attendance >= 30) earned.add('attendance_30')

  const hw = await pbGet(token, 'homework_submissions/records?perPage=1&fields=id&filter=' + encodeURIComponent(`studentId="${sid}"`))
  const homework = Number(hw.totalItems || 0)
  if (homework >= 10) earned.add('homework_10')

  return { student, earned, contributed, attendance, homework }
}

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const isStudent = gate.session.role === 'student'
  const sid = isStudent ? String(gate.session.studentId || '') : String(searchParams.get('studentId') || '')

  try {
    const token = await getAdminToken()
    const defs = (await pbGet(token, 'achievements/records?perPage=100&sort=sort_order')).items || []

    if (!sid) {
      return NextResponse.json({
        success: true,
        achievements: defs.map((d: any) => ({ ...d, earned: false })),
        title: '', title_icon: '', earned_count: 0, total: defs.length,
      })
    }

    const res = await computeEarned(token, sid)
    if (!res) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })

    return NextResponse.json({
      success: true,
      student: { id: res.student.id, name: res.student.name, title: res.student.title || '', title_icon: res.student.title_icon || '' },
      stats: { contributed: res.contributed, points: Number(res.student.points || 0), attendance: res.attendance, homework: res.homework },
      achievements: defs.map((d: any) => ({ ...d, earned: res.earned.has(String(d.code)) })),
      earned_count: res.earned.size,
      total: defs.length,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}

/** 设称号（必须真的解锁了）。学生只能设自己，老师/管理员可帮指定学生设；code 传空 = 清空。 */
export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const isStudent = gate.session.role === 'student'
  const sid = isStudent ? String(gate.session.studentId || '') : String(body.studentId || '')
  const code = String(body.code || '')
  if (!sid) return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料' }, { status: 403 })

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }

    if (!code) {
      const r = await fetch(`${PB_URL}/api/collections/students/records/${sid}`, {
        method: 'PATCH', headers: H, body: JSON.stringify({ title: '', title_icon: '' }),
      })
      return NextResponse.json({ success: r.ok, title: '', title_icon: '' })
    }

    const def = await pbGet(token, `achievements/records?perPage=1&filter=${encodeURIComponent(`code="${code}"`)}`)
    const ach = def.items?.[0]
    if (!ach) return NextResponse.json({ success: false, error: '没有这个成就' }, { status: 404 })

    const res = await computeEarned(token, sid)
    if (!res) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })
    if (!res.earned.has(code)) return NextResponse.json({ success: false, error: '这个成就还没解锁' }, { status: 403 })

    const r = await fetch(`${PB_URL}/api/collections/students/records/${sid}`, {
      method: 'PATCH', headers: H, body: JSON.stringify({ title: ach.name, title_icon: ach.icon || '' }),
    })
    if (!r.ok) throw new Error('设置失败')
    return NextResponse.json({ success: true, title: ach.name, title_icon: ach.icon || '' })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '设置失败' }, { status: 500 })
  }
}
