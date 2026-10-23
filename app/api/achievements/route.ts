import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { computeEarned, getAchievementDefs } from '@/lib/achievements'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 成就系统 —— 像游戏那样：达成条件解锁徽章，可以把其中一个设成自己的称号。
 *
 * 判定逻辑在 lib/achievements.ts（学生首页也用它算「新解锁」提示），此处只做接口。
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const isStudent = gate.session.role === 'student'
  const sid = isStudent ? String(gate.session.studentId || '') : String(searchParams.get('studentId') || '')

  try {
    const token = await getAdminToken()
    const defs = await getAchievementDefs(token)

    if (!sid) {
      return NextResponse.json({
        success: true,
        achievements: defs.map((d) => ({ ...d, earned: false })),
        title: '', title_icon: '', earned_count: 0, total: defs.length,
      })
    }

    const res = await computeEarned(token, sid)
    if (!res) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })

    return NextResponse.json({
      success: true,
      student: { id: res.student.id, name: res.student.name, title: res.student.title || '', title_icon: res.student.title_icon || '' },
      stats: { contributed: res.contributed, points: res.points, attendance: res.attendance, homework: res.homework },
      achievements: defs.map((d) => ({ ...d, earned: res.earned.has(String(d.code)) })),
      earned_count: res.earned.size,
      total: defs.length,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}

/**
 * 设称号 / 标记已读。
 *  body { code }                设称号（必须真解锁；空字符串 = 取消）
 *  body { action: 'mark_seen' } 把当前已解锁的成就全记为看过，首页提示条不再弹
 */
export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const isStudent = gate.session.role === 'student'
  const sid = isStudent ? String(gate.session.studentId || '') : String(body.studentId || '')
  if (!sid) return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料' }, { status: 403 })

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }

    if (body.action === 'mark_seen') {
      const res = await computeEarned(token, sid)
      if (!res) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })
      const r = await fetch(`${PB_URL}/api/collections/students/records/${sid}`, {
        method: 'PATCH', headers: H, body: JSON.stringify({ achievements_seen: [...res.earned] }),
      })
      return NextResponse.json({ success: r.ok, seen: [...res.earned] })
    }

    const code = String(body.code || '')
    if (!code) {
      const r = await fetch(`${PB_URL}/api/collections/students/records/${sid}`, {
        method: 'PATCH', headers: H, body: JSON.stringify({ title: '', title_icon: '' }),
      })
      return NextResponse.json({ success: r.ok, title: '', title_icon: '' })
    }

    const defs = await getAchievementDefs(token)
    const ach = defs.find((d) => String(d.code) === code)
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
