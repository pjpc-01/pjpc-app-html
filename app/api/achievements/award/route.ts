import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { requirePermission } from '@/lib/role-perms'
import { getAdminToken } from '@/lib/pb-admin-token'
import { notify } from '@/lib/notify'
import { getAchievementDefs, pbGet } from '@/lib/achievements'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 管理员手动授予成就。
 *
 *  GET    ?studentId=xxx     某学生被授予了哪些（不传 = 最近全部）
 *  POST   { studentId, code, note }   授予
 *  DELETE ?id=               撤销
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const sid = String(searchParams.get('studentId') || '')

  try {
    const token = await getAdminToken()
    const conds: string[] = []
    if (sid) conds.push(`student="${sid}"`)
    const filter = conds.length ? `&filter=${encodeURIComponent(conds.join(' && '))}` : ''
    const d = await pbGet(token, `student_achievements/records?perPage=300&sort=-created${filter}`)

    return NextResponse.json({
      success: true,
      awards: (d.items || []).map((x: any) => ({
        id: x.id, student: x.student || '', student_name: x.student_name || '',
        achievement_code: x.achievement_code || '', achievement_name: x.achievement_name || '',
        icon: x.icon || '', awarded_by: x.awarded_by || '', note: x.note || '', created: x.created || '',
      })),
      achievements: await getAchievementDefs(token),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const gate = await requirePermission(request, 'system.achievements')
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const sid = String(body.studentId || '')
  const code = String(body.code || '')
  if (!sid || !code) return NextResponse.json({ success: false, error: '要指定学生和成就' }, { status: 400 })

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }

    const stu = await pbGet(token, `students/records/${sid}`)
    if (!stu?.id) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })

    const defs = await getAchievementDefs(token)
    const def = defs.find((d) => String(d.code) === code)
    if (!def) return NextResponse.json({ success: false, error: '没有这个成就' }, { status: 404 })

    // 已经拿过就别重复发
    const exist = await pbGet(token, `student_achievements/records?perPage=1&filter=${encodeURIComponent(`student="${sid}" && achievement_code="${code}"`)}`)
    if ((exist.items || []).length > 0) {
      return NextResponse.json({ success: false, error: '这个学生已经有这个成就了' }, { status: 400 })
    }

    const r = await fetch(`${PB_URL}/api/collections/student_achievements/records`, {
      method: 'POST', headers: H,
      body: JSON.stringify({
        student: sid,
        student_name: stu.name || '',
        achievement_code: code,
        achievement_name: def.name,
        icon: def.icon || '',
        awarded_by: gate.session.name || gate.session.role,
        note: String(body.note || '').slice(0, 300),
      }),
    })
    if (!r.ok) throw new Error('授予失败')
    // 通知学生：拿到新成就
    await notify(token, {
      studentId: sid,
      title: `获得新成就：${def.icon || '🏅'} ${def.name || code}`,
      body: String(body.note || '').slice(0, 200),
      kind: 'achievement',
      link: '/my/achievements',
      actor: gate.session.name || gate.session.role || '',
    })

    return NextResponse.json({ success: true, achievement: { code, name: def.name, icon: def.icon || '' } })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '授予失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const gate = await requirePermission(request, 'system.achievements')
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const id = String(searchParams.get('id') || '')
  if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 })

  try {
    const token = await getAdminToken()
    const r = await fetch(`${PB_URL}/api/collections/student_achievements/records/${id}`, {
      method: 'DELETE', headers: { Authorization: token },
    })
    if (!r.ok) throw new Error('撤销失败')
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '撤销失败' }, { status: 500 })
  }
}
