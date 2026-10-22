import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 学生自己看自己的汇总数字。
 *
 * 为什么单独开：/my 原来去拉 /api/points/records 取 items[0] —— 那是「全校积分榜第一名」，
 * 学生看到的其实是别人的分；而且该接口现在只给员工用，学生 403 → 页面永远显示 0。
 * 这里用服务端超管从自己的学生档案取，学生只能拿自己的，员工可以指定 studentId。
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['student', 'admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const sid = gate.session.role === 'student'
    ? String(gate.session.studentId || '')
    : String(searchParams.get('studentId') || '')

  if (!sid) {
    return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料，请联系老师' }, { status: 403 })
  }

  try {
    const token = await getAdminToken()
    const H = { Authorization: token }

    const sRes = await fetch(`${PB_URL}/api/collections/students/records/${encodeURIComponent(sid)}`, { headers: H, cache: 'no-store' })
    if (!sRes.ok) {
      return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })
    }
    const s = await sRes.json()

    // 本月积分：按 point_logs 的 amount 累加（amount 才是变动值）
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    const startStr = `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}-01 00:00:00`

    const logsQ = new URLSearchParams({
      perPage: '500',
      filter: `student="${sid}" && created>="${startStr}"`,
      fields: 'amount,reason,created',
    })
    const logsRes = await fetch(`${PB_URL}/api/collections/point_logs/records?${logsQ}`, { headers: H, cache: 'no-store' })
    const logs = logsRes.ok ? await logsRes.json() : { items: [] }
    const monthlyPoints = (logs.items || []).reduce((a: number, x: any) => a + Number(x.amount || 0), 0)

    // 考勤：本月与累计出勤
    const attRes = await fetch(
      `${PB_URL}/api/collections/student_attendance/records?perPage=200&sort=-date&filter=${encodeURIComponent(`student_id="${sid}"`)}&fields=status,date`,
      { headers: H, cache: 'no-store' }
    )
    const att = attRes.ok ? await attRes.json() : { items: [] }
    const attItems = att.items || []
    const isPresent = (x: any) => String(x.status || '') !== 'absent'
    const inMonth = (d: string) => String(d || '').slice(0, 7) === `${now.getFullYear()}-${pad(now.getMonth() + 1)}`

    const summary = {
      student: {
        id: s.id,
        name: s.name,
        student_id: s.student_id,
        grade: s.grade,
        center: s.center,
        avatar: s.avatar,
        points: Number(s.points || 0),
        points_enabled: s.points_enabled !== false,
      },
      monthly_points: monthlyPoints,
      attendance: {
        present_total: attItems.filter(isPresent).length,
        present_this_month: attItems.filter((x: any) => isPresent(x) && inMonth(x.date)).length,
        absent_this_month: attItems.filter((x: any) => !isPresent(x) && inMonth(x.date)).length,
        records: attItems.length,
      },
    }

    return NextResponse.json({ success: true, ...summary })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
