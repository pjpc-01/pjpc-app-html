import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { requirePermission } from '@/lib/role-perms'
import { getAdminToken } from '@/lib/pb-admin-token'
import { addContributionPoints, getContributionRate, pbGet } from '@/lib/contribution'
import { notify } from '@/lib/notify'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 贡献积分管理（老师/管理员）。
 *
 *  GET   ?view=settings                     比率 + 最近一次谁改的
 *  GET   ?view=logs&studentId=&kind=&limit=  贡献积分流水（不传 studentId = 全站）
 *  PATCH { points_rate, note }              改比率（只 admin）
 *  POST  { studentId, amount, note }        手动加减某学生贡献积分（写 adjust 流水）
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const view = String(searchParams.get('view') || 'settings')

  try {
    const token = await getAdminToken()

    if (view === 'settings') {
      const d = await pbGet(token, 'contribution_settings/records?perPage=1&sort=-updated')
      const row = d.items?.[0] || {}
      return NextResponse.json({
        success: true,
        rate: await getContributionRate(token),
        note: row.note || '',
        updated_by: row.updated_by || '',
        updated: row.updated || '',
      })
    }

    // 流水
    const isStudent = gate.session.role === 'student'
    let sid = String(searchParams.get('studentId') || '')
    if (isStudent) sid = String(gate.session.studentId || '')
    const kind = String(searchParams.get('kind') || '')
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') || 200)))

    const conds: string[] = []
    if (sid) conds.push(`student="${sid}"`)
    if (kind) conds.push(`kind="${kind}"`)
    const filter = conds.length ? `&filter=${encodeURIComponent(conds.join(' && '))}` : ''
    const logs = await pbGet(token, `contribution_point_logs/records?perPage=${limit}&sort=-created${filter}`)

    const totals = { in: 0, out: 0 }
    for (const x of logs.items || []) {
      const a = Number(x.amount || 0)
      if (a > 0) totals.in += a
      else totals.out += Math.abs(a)
    }

    return NextResponse.json({
      success: true,
      logs: (logs.items || []).map((x: any) => ({
        id: x.id, student: x.student || '', student_name: x.student_name || '',
        amount: Number(x.amount || 0), kind: x.kind || '',
        donate_points: Number(x.donate_points || 0), rate: Number(x.rate || 0),
        balance_after: Number(x.balance_after || 0),
        note: x.note || '', operator: x.operator || '', center: x.center || '', created: x.created || '',
      })),
      totals,
      rate: await getContributionRate(token),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requirePermission(request, 'education.contribution', ['admin'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const rate = Number(body.points_rate)
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    return NextResponse.json({ success: false, error: '比率要填 0 到 100 之间（1 = 1 分投入换 1 分贡献）' }, { status: 400 })
  }

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }
    const d = await pbGet(token, 'contribution_settings/records?perPage=1&sort=-updated')
    const row = d.items?.[0]
    const payload = { points_rate: rate, note: String(body.note || '').slice(0, 300), updated_by: gate.session.name || 'admin' }

    const r = row
      ? await fetch(`${PB_URL}/api/collections/contribution_settings/records/${row.id}`, { method: 'PATCH', headers: H, body: JSON.stringify(payload) })
      : await fetch(`${PB_URL}/api/collections/contribution_settings/records`, { method: 'POST', headers: H, body: JSON.stringify(payload) })
    if (!r.ok) throw new Error('保存失败')

    return NextResponse.json({ success: true, rate, note: payload.note })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '保存失败' }, { status: 500 })
  }
}

/** 手动加减贡献积分（管理员/老师/行政） */
export async function POST(request: NextRequest) {
  const gate = await requirePermission(request, 'education.contribution')
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const sid = String(body.studentId || '')
  const amount = Math.round(Number(body.amount || 0))
  const note = String(body.note || '').slice(0, 200)
  if (!sid) return NextResponse.json({ success: false, error: '要指定学生' }, { status: 400 })
  if (!Number.isFinite(amount) || amount === 0) return NextResponse.json({ success: false, error: '加减分数不能是 0' }, { status: 400 })
  if (!note.trim()) return NextResponse.json({ success: false, error: '写一下原因' }, { status: 400 })

  try {
    const token = await getAdminToken()
    const stu = await pbGet(token, `students/records/${sid}`)
    if (!stu?.id) return NextResponse.json({ success: false, error: '找不到学生资料' }, { status: 404 })

    const r = await addContributionPoints(token, {
      studentId: sid,
      studentName: stu.name || '',
      amount,
      kind: 'adjust',
      note,
      operator: gate.session.name || gate.session.role,
      center: stu.center || '',
      baseBalance: Number(stu.contribution_points || 0),
    })

    // 通知学生：贡献积分被手动加减
    await notify(token, {
      studentId: sid,
      title: amount > 0 ? `老师奖励了 ${amount} 贡献积分` : `贡献积分被扣 ${Math.abs(amount)}`,
      body: note,
      kind: 'contribution',
      link: '/my/contribution',
      actor: gate.session.name || gate.session.role || '',
      center: stu.center || '',
    })

    return NextResponse.json({ success: true, balance: r.balance, student: { id: sid, name: stu.name } })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '调整失败' }, { status: 500 })
  }
}
