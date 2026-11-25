import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

/**
 * 老师报销单（Claim Form）
 *
 * 跟请假单一样：老师自己在工作台提交 → 院长批 → 结束。
 * ⛔ 不牵涉账目：不写任何会计/财务集合，不自动记账，只留一张单 + 审批状态。
 */

type Item = { date?: string; category?: string; desc?: string; amount?: number; note?: string; receipt_no?: string }

function cleanItems(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(it => ({
      date: String((it as any)?.date || '').slice(0, 10),
      category: String((it as any)?.category || ''),
      desc: String((it as any)?.desc || '').slice(0, 300),
      amount: Number((it as any)?.amount) || 0,
      note: String((it as any)?.note || '').slice(0, 200),
      receipt_no: String((it as any)?.receipt_no || '').slice(0, 60),
    }))
    .filter(it => it.desc || it.amount > 0)
}

// 列出我的报销单
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'supervisor', 'accountant'])
  if ('error' in gate) return gate.error
  const { session } = gate

  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === '1' && ['admin', 'office_admin', 'supervisor', 'accountant'].includes(session.role)

    const filter = all ? '1=1' : `created_by = "${session.id}"`
    const records = await pb.collection('claim_forms').getList(1, 100, { filter, sort: '-created' })

    return NextResponse.json({ success: true, data: records.items, total: records.totalItems })
  } catch (error) {
    console.error('获取报销单失败:', error)
    return NextResponse.json({ success: false, error: '获取报销单失败' }, { status: 500 })
  }
}

// 新建报销单（submit=true 直接提交，false 存草稿）
export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  const { session } = gate

  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const items = cleanItems(body?.items)
    if (!items.length) {
      return NextResponse.json({ success: false, error: '至少要填一行支出' }, { status: 400 })
    }
    const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0)

    // 单号 CLM-YYYYMM-NNN
    const now = new Date()
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    let seq = 1
    try {
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01 00:00:00.000Z`
      const list = await pb.collection('claim_forms').getList(1, 1, { filter: `created >= "${monthStart}"` })
      seq = (list.totalItems || 0) + 1
    } catch { seq = 1 }
    const claimNo = `CLM-${ym}-${String(seq).padStart(3, '0')}`

    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const rec = await pb.collection('claim_forms').create({
      claimant: session.name || '老师',
      position: '',
      center: String(body?.center || ''),
      claim_no: claimNo,
      fill_date: today,
      period: String(body?.period || ''),
      items,
      total,
      notes: String(body?.notes || '').slice(0, 1000),
      status: body?.draft ? 'draft' : 'submitted',
      created_by: session.id,
      created_by_name: session.name || '',
      supervisor_comment: '',
      finance_comment: '',
      supervisor_at: '',
      finance_at: '',
    })

    return NextResponse.json({ success: true, data: rec })
  } catch (error: any) {
    console.error('创建报销单失败:', error)
    return NextResponse.json({ success: false, error: error?.message || '提交失败' }, { status: 500 })
  }
}

// 改自己的草稿 / 提交草稿 / 撤回（只有草稿能动）
export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  const { session } = gate

  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const id = String(body?.id || '')
    if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 })

    const rec: any = await pb.collection('claim_forms').getOne(id)
    const isOwner = rec.created_by === session.id
    const isAdmin = ['admin', 'office_admin'].includes(session.role)
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: '没有权限' }, { status: 403 })
    }

    // 撤回：只允许删草稿
    if (body?.action === 'cancel') {
      if (rec.status !== 'draft') {
        return NextResponse.json({ success: false, error: '只有草稿可以删除' }, { status: 400 })
      }
      await pb.collection('claim_forms').delete(id)
      return NextResponse.json({ success: true, deleted: true })
    }

    if (rec.status !== 'draft' && !isAdmin) {
      return NextResponse.json({ success: false, error: '已提交的单子不能改' }, { status: 400 })
    }

    const items = body?.items ? cleanItems(body.items) : rec.items
    const total = (Array.isArray(items) ? items : []).reduce((s: number, it: any) => s + (Number(it?.amount) || 0), 0)

    const updates: any = {}
    if (body?.items) { updates.items = items; updates.total = total }
    if (body?.notes !== undefined) updates.notes = String(body.notes).slice(0, 1000)
    if (body?.period !== undefined) updates.period = String(body.period)
    if (body?.center !== undefined) updates.center = String(body.center)
    if (body?.action === 'submit') updates.status = 'submitted'

    const updated = await pb.collection('claim_forms').update(id, updates)
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('更新报销单失败:', error)
    return NextResponse.json({ success: false, error: error?.message || '更新失败' }, { status: 500 })
  }
}
