import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 学生贡献榜（老师/管理员看）—— 按中心分组。
 *
 * PU1 / BATU14 各排一榜，占比在自己中心内算（加起来 100%），另给一份全校合并榜。
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const want = String(searchParams.get('center') || '').trim()

  try {
    const token = await getAdminToken()
    const H = { Authorization: token }

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

    const byCenter = new Map<string, Map<string, any>>()
    for (const l of logs) {
      const sid = String(l.student || '')
      if (!sid) continue
      const center = String(l.center || '').trim() || '未分中心'
      if (!byCenter.has(center)) byCenter.set(center, new Map())
      const bucket = byCenter.get(center)!
      const cur = bucket.get(sid) || {
        student_id_record: sid,
        name: l.student_name || '-',
        center,
        points: 0,
        times: 0,
        last: '',
      }
      cur.points += Number(l.points || 0)
      cur.times += 1
      const c = String(l.created || '')
      if (c > cur.last) cur.last = c
      if (l.student_name) cur.name = l.student_name
      bucket.set(sid, cur)
    }

    const buildList = (m: Map<string, any>, center = '') => {
      const total = [...m.values()].reduce((a, x) => a + x.points, 0)
      const list = [...m.values()]
        .map((x) => ({ ...x, percent: total > 0 ? Math.round((x.points / total) * 1000) / 10 : 0 }))
        .sort((a, b) => b.points - a.points)
      return { center, total_points: total, students: list.length, list }
    }

    const groups = [...byCenter.entries()]
      .map(([center, m]) => buildList(m, center))
      .sort((a, b) => b.total_points - a.total_points)

    const all = new Map<string, any>()
    for (const m of byCenter.values()) {
      for (const [sid, x] of m) {
        const cur = all.get(sid)
        if (!cur) all.set(sid, { ...x })
        else { cur.points += x.points; cur.times += x.times }
      }
    }
    const overall = buildList(all)

    return NextResponse.json({
      success: true,
      overall,
      groups,
      selected: want ? groups.find((g) => g.center === want) || null : null,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
