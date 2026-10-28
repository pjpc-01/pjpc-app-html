import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 我的站内通知。
 *
 * GET    ?limit=20                 我的通知（新的在前）+ 未读数
 * PATCH  { id }  或  { all: true }  标记已读
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student', 'parent'])
  if ('error' in gate) return gate.error

  const limit = Math.min(100, Math.max(1, Number(new URL(request.url).searchParams.get('limit') || 20)))
  const uid = gate.session.id

  try {
    const token = await getAdminToken()
    const H = { Authorization: token }
    const mine = encodeURIComponent(`user="${uid}"`)

    const [listRes, unreadRes] = await Promise.all([
      fetch(`${PB_URL}/api/collections/notifications/records?perPage=${limit}&sort=-created&filter=${mine}`, { headers: H }),
      fetch(`${PB_URL}/api/collections/notifications/records?perPage=1&filter=${encodeURIComponent(`user="${uid}" && read=false`)}`, { headers: H }),
    ])
    const list = listRes.ok ? await listRes.json() : { items: [] }
    const unread = unreadRes.ok ? await unreadRes.json() : { totalItems: 0 }

    return NextResponse.json({
      success: true,
      unread: Number(unread.totalItems || 0),
      items: (list.items || []).map((x: any) => ({
        id: x.id,
        title: x.title || '',
        body: x.body || '',
        kind: x.kind || 'system',
        link: x.link || '',
        read: !!x.read,
        actor: x.actor || '',
        created: x.created || '',
      })),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student', 'parent'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const uid = gate.session.id
  const now = new Date().toISOString()

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }

    if (body.all === true) {
      // 全部已读：先找出未读的，再逐条 PATCH（PB 不支持批量改）
      const q = encodeURIComponent(`user="${uid}" && read=false`)
      const r = await fetch(`${PB_URL}/api/collections/notifications/records?perPage=200&filter=${q}`, { headers: H })
      const d = r.ok ? await r.json() : { items: [] }
      let n = 0
      for (const x of d.items || []) {
        const p = await fetch(`${PB_URL}/api/collections/notifications/records/${x.id}`, {
          method: 'PATCH', headers: H, body: JSON.stringify({ read: true, read_at: now }),
        })
        if (p.ok) n++
      }
      return NextResponse.json({ success: true, updated: n })
    }

    const id = String(body.id || '')
    if (!id) return NextResponse.json({ success: false, error: '要指定通知' }, { status: 400 })

    const rec = await fetch(`${PB_URL}/api/collections/notifications/records/${id}`, { headers: H })
    if (!rec.ok) return NextResponse.json({ success: false, error: '通知不存在' }, { status: 404 })
    const row = await rec.json()
    if (String(row.user || '') !== String(uid)) {
      return NextResponse.json({ success: false, error: '不能标记别人的通知' }, { status: 403 })
    }

    const p = await fetch(`${PB_URL}/api/collections/notifications/records/${id}`, {
      method: 'PATCH', headers: H, body: JSON.stringify({ read: true, read_at: now }),
    })
    if (!p.ok) throw new Error(`标记失败（${p.status}）`)
    return NextResponse.json({ success: true, updated: 1 })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '标记失败' }, { status: 500 })
  }
}
