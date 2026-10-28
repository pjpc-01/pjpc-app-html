import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { notify } from '@/lib/notify'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 建议箱 —— 老师/学生给中心或 PJPC 系统提改进建议。
 *
 * GET   ?target=center|app&status=new|reading|done&mine=1
 * POST  { target, content }
 * PATCH { id, status?, reply? }   只有老师/管理员
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const target = String(searchParams.get('target') || '')
  const status = String(searchParams.get('status') || '')
  const mine = searchParams.get('mine') === '1'
  const isStudent = gate.session.role === 'student'

  try {
    const token = await getAdminToken()
    const conds: string[] = []
    if (isStudent || mine) {
      const uid = String(gate.session.id || '')
      if (!uid) return NextResponse.json({ success: true, items: [] })
      conds.push(`user="${uid}"`)
    }
    if (target) conds.push(`target="${target}"`)
    if (status) conds.push(`status="${status}"`)

    const filter = conds.join(' && ')
    const url = `${PB_URL}/api/collections/suggestions/records?perPage=200&sort=-created${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
    const r = await fetch(url, { headers: { Authorization: token }, cache: 'no-store' })
    const d = r.ok ? await r.json() : { items: [] }

    const items = (d.items || []).map((x: any) => ({
      id: x.id,
      target: x.target || 'center',
      content: x.content || '',
      status: x.status || 'new',
      reply: x.reply || '',
      replied_by: x.replied_by || '',
      submitter_name: x.submitter_name || '',
      submitter_role: x.submitter_role || '',
      center: x.center || '',
      created: x.created || '',
    }))

    const counts = {
      all: items.length,
      new: items.filter((x: any) => x.status === 'new').length,
      reading: items.filter((x: any) => x.status === 'reading').length,
      done: items.filter((x: any) => x.status === 'done').length,
    }

    return NextResponse.json({ success: true, items, counts })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const target = body.target === 'app' ? 'app' : 'center'
  const content = String(body.content || '').trim()
  if (content.length < 2) return NextResponse.json({ success: false, error: '请写下你的建议' }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ success: false, error: '建议太长了，请简单写' }, { status: 400 })

  try {
    const token = await getAdminToken()
    let name = gate.session.name || ''
    let center = ''

    if (gate.session.role === 'student') {
      const sid = String(gate.session.studentId || '')
      if (sid) {
        const sr = await fetch(`${PB_URL}/api/collections/students/records/${sid}?fields=name,center`, { headers: { Authorization: token }, cache: 'no-store' })
        if (sr.ok) {
          const s = await sr.json()
          name = s.name || name
          center = s.center || ''
        }
      }
    } else if (gate.session.teacherId) {
      const tr = await fetch(`${PB_URL}/api/collections/teachers/records/${gate.session.teacherId}?fields=name,center`, { headers: { Authorization: token }, cache: 'no-store' })
      if (tr.ok) {
        const tt = await tr.json()
        name = tt.name || name
        center = tt.center || ''
      }
    }

    const r = await fetch(`${PB_URL}/api/collections/suggestions/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({
        user: gate.session.id,
        submitter_name: name,
        submitter_role: gate.session.role,
        target,
        content,
        center,
        status: 'new',
      }),
    })
    if (!r.ok) throw new Error('写入失败')
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '提交失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const id = String(body.id || '')
  if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 })

  const payload: any = {}
  if (body.status !== undefined) {
    const s = String(body.status)
    if (!['new', 'reading', 'done'].includes(s)) return NextResponse.json({ success: false, error: '状态不对' }, { status: 400 })
    payload.status = s
  }
  if (body.reply !== undefined) payload.reply = String(body.reply || '').slice(0, 2000)
  if (Object.keys(payload).length === 0) return NextResponse.json({ success: false, error: '没有要改的' }, { status: 400 })
  payload.replied_by = gate.session.name || gate.session.role

  try {
    const token = await getAdminToken()
    const r = await fetch(`${PB_URL}/api/collections/suggestions/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(payload),
    })
    if (!r.ok) throw new Error('更新失败')

    // 回复了 → 通知提问的同学（站内铃铛）
    if (payload.reply) {
      const cur = await fetch(`${PB_URL}/api/collections/suggestions/records/${id}`, { headers: { Authorization: token } })
      if (cur.ok) {
        const row = await cur.json()
        if (row.user) {
          await notify(token, {
            userId: row.user,
            title: '你的建议有回复了',
            body: String(payload.reply).slice(0, 200),
            kind: 'suggestion',
            link: '/my/suggestions',
            actor: gate.session.name || gate.session.role || '',
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '更新失败' }, { status: 500 })
  }
}
