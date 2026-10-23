import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 学生贡献榜（老师/管理员看）。
 *
 * 每个学生累计投了多少分、占全部贡献的百分之几、投了几次。
 * 占比按「全部学生累计贡献」算，所以加起来正好 100%。
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const token = await getAdminToken()
    const H = { Authorization: token }

    // 分页捞全部捐赠记录（一次 500 条，最多 10 页 = 5000 条）
    let page = 1
    let logs: any[] = []
    while (page <= 10) {
      const r = await fetch(
        `${PB_URL}/api/collections/contribution_logs/records?perPage=500&page=${page}&filter=${encodeURIComponent('kind="donate"')}`,
        { headers: H, cache: 'no-store' }
      )
      if (!r.ok) break
      const d = await r.json()
      const items = d.items || []
      logs = logs.concat(items)
      if (items.length < 500) break
      page++
    }

    const byStudent = new Map<string, any>()
    for (const l of logs) {
      const sid = String(l.student || '')
      if (!sid) continue
      const cur = byStudent.get(sid) || {
        student_id_record: sid,
        name: l.student_name || '-',
        center: l.center || '',
        points: 0,
        times: 0,
        last: '',
      }
      cur.points += Number(l.points || 0)
      cur.times += 1
      const c = String(l.created || '')
      if (c > cur.last) cur.last = c
      if (l.student_name) cur.name = l.student_name
      if (l.center) cur.center = l.center
      byStudent.set(sid, cur)
    }

    const total = [...byStudent.values()].reduce((a, x) => a + x.points, 0)
    const list = [...byStudent.values()]
      .map((x) => ({
        ...x,
        percent: total > 0 ? Math.round((x.points / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.points - a.points)

    return NextResponse.json({
      success: true,
      total_points: total,
      students: list.length,
      list,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
