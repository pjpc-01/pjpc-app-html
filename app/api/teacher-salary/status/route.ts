import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

/**
 * POST /api/teacher-salary/status   { id, action }
 *
 * 薪资的三步流程（2026-11-21 定案，走「真审核」）：
 *   draft  ──approve──▶  approved  ──pay──▶  paid
 *   paid   ──revert───▶  draft（会留痕，配合 finance-guard.pb.js 的金额锁）
 *
 * 为什么要服务端做：状态一旦能随手改，谁都能把已发薪的单子改回草稿再改金额，
 * 金额锁就形同虚设。这里只管状态转移，金额一律不碰。
 */

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

async function pb(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: token, ...(init?.headers || {}) },
  })
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!res.ok) throw new Error(data?.message || `${res.status} ${text.slice(0, 160)}`)
  return data
}

const ALLOWED: Record<string, { from: string[]; to: string }> = {
  approve: { from: ['draft'], to: 'approved' },
  pay: { from: ['draft', 'approved'], to: 'paid' },
  revert: { from: ['approved', 'paid'], to: 'draft' },
}

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || '')
    const action = String(body?.action || '')
    const rule = ALLOWED[action]
    if (!id) return NextResponse.json({ success: false, error: '要指定薪资记录' }, { status: 400 })
    if (!rule) return NextResponse.json({ success: false, error: 'action 只能是 approve / pay / revert' }, { status: 400 })

    const token = await getAdminToken()
    const rec = await pb(`/api/collections/teacher_salary_records/records/${id}`, token)
    if (!rec?.id) return NextResponse.json({ success: false, error: '薪资记录不存在' }, { status: 404 })

    const current = String(rec.status || 'draft')
    if (!rule.from.includes(current)) {
      const label: Record<string, string> = { draft: '草稿', approved: '已批准', paid: '已发薪' }
      return NextResponse.json({
        success: false,
        error: `现在是「${label[current] || current}」，不能做这个操作`,
      }, { status: 409 })
    }

    const payload: Record<string, unknown> = { status: rule.to }
    if (rule.to === 'paid' && !rec.payment_date) {
      const d = new Date()
      payload.payment_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 00:00:00.000Z`
    }
    if (action === 'revert') {
      const who = gate.session.name || gate.session.role || 'admin'
      payload.notes = `${rec.notes ? rec.notes + ' | ' : ''}${new Date().toISOString().slice(0, 16)} ${who} 退回草稿（原状态：${current}）`
    }

    const updated = await pb(`/api/collections/teacher_salary_records/records/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    return NextResponse.json({ success: true, action, status: updated.status, data: updated })
  } catch (e: any) {
    console.error('[salary-status]', e)
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 })
  }
}
