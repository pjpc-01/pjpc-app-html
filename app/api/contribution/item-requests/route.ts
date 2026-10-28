import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { requirePermission } from '@/lib/role-perms'
import { getAdminToken } from '@/lib/pb-admin-token'
import { notify, notifyRoles } from '@/lib/notify'
import { pbGet } from '@/lib/contribution'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 学生提议物品（中心升级物品 upgrade / 私人物品 reward）。
 *
 *  GET   ?status=pending   学生只看到自己的，员工看到全部
 *  POST  FormData(type, name, description, image?)  学生/员工都能提
 *  PATCH { id, status, review_note, target_points?, cost_points?, stock? }
 *        老师/管理员审批；approved 时自动在 contribution_items / reward_items 里建好
 */
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const isStudent = gate.session.role === 'student'
  const status = String(searchParams.get('status') || '')

  try {
    const token = await getAdminToken()
    const conds: string[] = []
    if (isStudent) {
      const sid = String(gate.session.studentId || '')
      if (!sid) return NextResponse.json({ success: true, requests: [] })
      conds.push(`student="${sid}"`)
    }
    if (status) conds.push(`status="${status}"`)
    const filter = conds.length ? `&filter=${encodeURIComponent(conds.join(' && '))}` : ''
    const d = await pbGet(token, `item_requests/records?perPage=200&sort=-created${filter}`)

    return NextResponse.json({
      success: true,
      requests: (d.items || []).map((x: any) => ({
        id: x.id,
        student: x.student || '',
        student_name: x.student_name || '',
        type: x.type || 'upgrade',
        name: x.name || '',
        description: x.description || '',
        image_url: x.image ? `/api/pocketbase-proxy/api/files/${x.collectionId}/${x.id}/${x.image}` : '',
        status: x.status || 'pending',
        review_note: x.review_note || '',
        reviewed_by: x.reviewed_by || '',
        center: x.center || '',
        created: x.created || '',
      })),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['student', 'admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  let form: FormData | null = null
  try { form = await request.formData() } catch { /* 也接受 JSON（不带照片） */ }

  let type = 'upgrade'
  let name = ''
  let description = ''
  let image: File | null = null

  if (form) {
    type = String(form.get('type') || 'upgrade')
    name = String(form.get('name') || '').trim()
    description = String(form.get('description') || '').trim()
    const f = form.get('image')
    if (f && typeof f !== 'string') image = f as File
  } else {
    let body: any = {}
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }
    type = String(body.type || 'upgrade')
    name = String(body.name || '').trim()
    description = String(body.description || '').trim()
  }

  if (type !== 'upgrade' && type !== 'reward') type = 'upgrade'
  if (name.length < 2) return NextResponse.json({ success: false, error: '写上物品名称' }, { status: 400 })
  if (description.length < 2) return NextResponse.json({ success: false, error: '说说想要什么、为什么想要' }, { status: 400 })

  try {
    const token = await getAdminToken()
    let sid = ''
    let sname = ''
    let center = ''

    if (gate.session.role === 'student') {
      sid = String(gate.session.studentId || '')
      if (!sid) return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料' }, { status: 403 })
      const stu = await pbGet(token, `students/records/${sid}`)
      sname = stu.name || ''
      center = stu.center || ''
    } else {
      sname = gate.session.name || gate.session.role
    }

    const fd = new FormData()
    if (sid) fd.append('student', sid)
    fd.append('student_name', sname)
    fd.append('type', type)
    fd.append('name', name.slice(0, 120))
    fd.append('description', description.slice(0, 1000))
    fd.append('status', 'pending')
    if (center) fd.append('center', center)
    if (image) fd.append('image', image, image.name || 'photo.jpg')

    const r = await fetch(`${PB_URL}/api/collections/item_requests/records`, {
      method: 'POST', headers: { Authorization: token }, body: fd,
    })
    if (!r.ok) throw new Error('提交失败')
    // 通知老师和行政：有新的物品提议
    await notifyRoles(token, ['admin', 'teacher', 'office_admin'], {
      title: `新的物品提议：${name}`,
      body: String(description || '').slice(0, 160),
      kind: 'suggestion',
      link: '/contribution-management',
      actor: gate.session.name || '',
      center: center || '',
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '提交失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requirePermission(request, 'education.contribution')
  if ('error' in gate) return gate.error

  let body: any = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const id = String(body.id || '')
  const status = String(body.status || '')
  if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 })
  if (!['approved', 'rejected', 'pending'].includes(status)) return NextResponse.json({ success: false, error: '状态不对' }, { status: 400 })

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }
    const reqRes = await fetch(`${PB_URL}/api/collections/item_requests/records/${id}`, { headers: { Authorization: token }, cache: 'no-store' })
    if (!reqRes.ok) return NextResponse.json({ success: false, error: '找不到这个提议' }, { status: 404 })
    const rec = await reqRes.json()

    const payload: any = {
      status,
      review_note: String(body.review_note || '').slice(0, 500),
      reviewed_by: gate.session.name || gate.session.role,
    }
    const u = await fetch(`${PB_URL}/api/collections/item_requests/records/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify(payload) })
    if (!u.ok) return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 })

    // 通过 = 直接建成正式物品（除非前端说不要）
    let created: any = null
    if (status === 'approved' && body.create_item !== false && rec.status !== 'approved') {
      if (rec.type === 'reward') {
        const r = await fetch(`${PB_URL}/api/collections/reward_items/records`, {
          method: 'POST', headers: H,
          body: JSON.stringify({
            name: rec.name,
            description: rec.description || '',
            cost_points: Math.max(0, Math.round(Number(body.cost_points || 0))),
            stock: Math.max(0, Math.round(Number(body.stock ?? 1))),
            status: 'active',
          }),
        })
        if (r.ok) created = await r.json()
      } else {
        const r = await fetch(`${PB_URL}/api/collections/contribution_items/records`, {
          method: 'POST', headers: H,
          body: JSON.stringify({
            name: rec.name,
            description: rec.description || '',
            center: rec.center || String(body.center || ''),
            target_points: Math.max(1, Math.round(Number(body.target_points || 1000))),
            current_points: 0,
            status: 'active',
          }),
        })
        if (r.ok) created = await r.json()
      }
    }

    // 提议结果通知学生（收件人取提议这条记录里的学生）
    const reqStudent = String(rec.student || '')
    if (reqStudent) {
      await notify(token, {
        studentId: reqStudent,
        title: status === 'approved' ? '你的物品提议已通过' : '你的物品提议被拒绝',
        body: `${rec.name || ''}${String(payload.review_note || '') ? '：' + String(payload.review_note).slice(0, 120) : ''}`,
        kind: 'suggestion',
        link: '/my/contribution',
        actor: gate.session.name || gate.session.role || '',
      })
    }

    return NextResponse.json({ success: true, status, created_id: created?.id || null })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '审批失败' }, { status: 500 })
  }
}
