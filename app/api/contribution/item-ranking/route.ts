import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { pbGet } from '@/lib/contribution'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 单个中心物品的贡献排行（谁给这个物品投了多少分）。
 *
 * GET ?itemId=xxx
 *
 * 数据来源：contribution_logs（item 字段 + kind=donate 的投入记录）
 * 返回：物品进度 + 按投入分数从多到少排的学生列表
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  const itemId = String(new URL(request.url).searchParams.get('itemId') || '')
  if (!itemId) return NextResponse.json({ success: false, error: '要指定物品' }, { status: 400 })

  try {
    const token = await getAdminToken()
    const item = await pbGet(token, `contribution_items/records/${itemId}`)
    if (!item?.id) return NextResponse.json({ success: false, error: '找不到这个物品' }, { status: 404 })

    // 拉全部投入记录（物品级别的量很小，用分页取全）
    let page = 1
    const rows: any[] = []
    for (;;) {
      const d = await pbGet(
        token,
        `contribution_logs/records?perPage=500&page=${page}&sort=-created&filter=${encodeURIComponent(
          `item="${itemId}" && kind="donate"`
        )}`
      )
      const got = d.items || []
      rows.push(...got)
      if (got.length < 500) break
      page++
      if (page > 20) break
    }

    const byStudent = new Map<string, any>()
    for (const r of rows) {
      const sid = String(r.student || '')
      if (!sid) continue
      const p = Number(r.points || 0)
      const cur = byStudent.get(sid) || {
        studentId: sid, studentName: r.student_name || '', center: r.center || '',
        points: 0, times: 0, last: r.created || '',
      }
      cur.points += p
      cur.times += 1
      if (String(r.created || '') > String(cur.last || '')) cur.last = r.created
      cur.studentName = cur.studentName || r.student_name || ''
      byStudent.set(sid, cur)
    }

    const list = [...byStudent.values()].sort((a, b) => b.points - a.points)
    const raised = list.reduce((s, x) => s + x.points, 0)
    const target = Number(item.target_points || 0)

    return NextResponse.json({
      success: true,
      item: {
        id: item.id, name: item.name || '', description: item.description || '',
        center: item.center || '', target_points: target,
        current_points: Number(item.current_points || 0),
        status: item.status || '', image: item.image || '',
      },
      raised,
      target,
      progress: target > 0 ? Math.min(100, Math.round((Number(item.current_points || 0) / target) * 100)) : 0,
      rows: list.map((x, i) => ({
        rank: i + 1, ...x,
        share: raised > 0 ? Math.round((x.points / raised) * 1000) / 10 : 0,
      })),
      donors: list.length,
      totals: {
        donated_records: rows.length,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
