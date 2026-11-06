/**
 * 院长助理（principal-agent）有限度改动的唯一入口。
 *
 * 为什么要有这个：院长助理只能看不能改，院长要它做事它只能回「我装不进系统」，
 * 事情就断在它那里。给它一个白名单接口，只允许四类财务动作，全部留审计。
 *
 * 设计原则：
 *   1. 白名单，不是权限位。没列出来的动作一律拒绝，扩展要改代码。
 *   2. 每个动作必须带 reason（人话理由），写进 audit_logs。
 *   3. 全部软删除/可逆，绝不物理删。
 *   4. 只认 PJPC_AGENT_TOKEN，跟用户登录态完全分开，泄露也只能做这四件事。
 */
import { getAdminToken } from './pb-admin-token'
import { applyCreditsToInvoice } from './credits'

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

async function pb(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...init,
    headers: { Authorization: token, 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PocketBase ${res.status} ${path} ${text.slice(0, 200)}`)
  }
  const raw = await res.text()
  return raw ? JSON.parse(raw) : {}
}

/** 白名单：动作名 → 人话说明 + 需要的参数。给院长助理自己查用 */
export const ACTION_CATALOG = [
  {
    action: 'void_invoice',
    desc: '作废一张发票（软删，可恢复）。用于重复票、错开的票',
    params: { invoiceNumber: '如 INV-202610-148', reason: '为什么要作废（人话）' },
  },
  {
    action: 'set_due_date',
    desc: '改一张发票的到期日。只能改日期，不能改金额',
    params: { invoiceNumber: '如 INV-202608-013', dueDate: 'YYYY-MM-DD', reason: '为什么要改' },
  },
  {
    action: 'issue_correction_receipt',
    desc: '给一张收据出更正收据（原票自动作废，更正票金额可 0）',
    params: { originalReceiptNumber: '如 RCP-2026-239', amount: '更正后金额，没进账填 0', reason: '为什么要更正' },
  },
  {
    action: 'void_salary_record',
    desc: '删一张重复的薪资单（软删）。只能删「同老师同月同额」的重复单',
    params: { recordId: '薪资单 id', reason: '为什么要删' },
  },
  {
    action: 'apply_credit',
    desc: '把某学生手上的上期多收余额，抵到指定发票',
    params: { invoiceNumber: '要抵的票', reason: '为什么要抵' },
  },
] as const

export type AgentActionName = (typeof ACTION_CATALOG)[number]['action']

function fail(msg: string, status = 400): never {
  const err: any = new Error(msg)
  err.httpStatus = status
  throw err
}

function need(params: Record<string, any>, key: string): string {
  const v = params?.[key]
  if (v === undefined || v === null || String(v).trim() === '') fail(`缺少参数 ${key}`)
  return String(v).trim()
}

function requireReason(params: Record<string, any>): string {
  const reason = String(params?.reason || '').trim()
  if (reason.length < 4) fail('必须填写 reason（至少 4 个字，说明为什么）')
  return reason
}

async function findInvoice(token: string, invoiceNumber: string) {
  const f = encodeURIComponent(`invoiceNumber="${invoiceNumber}"`)
  const data = await pb(`/api/collections/invoices/records?perPage=5&filter=${f}`, token)
  const inv = (data.items || [])[0]
  if (!inv) fail(`找不到发票 ${invoiceNumber}`, 404)
  if (inv.deleted === true) fail(`发票 ${invoiceNumber} 已经是作废状态`, 409)
  return inv
}

async function findReceipt(token: string, receiptNumber: string) {
  const f = encodeURIComponent(`receiptNumber="${receiptNumber}"`)
  const data = await pb(`/api/collections/receipts/records?perPage=5&filter=${f}`, token)
  const r = (data.items || [])[0]
  if (!r) fail(`找不到收据 ${receiptNumber}`, 404)
  if (r.deleted === true) fail(`收据 ${receiptNumber} 已经作废`, 409)
  return r
}

async function nextReceiptNumber(token: string): Promise<string> {
  const data = await pb(`/api/collections/receipts/records?perPage=1&sort=-receiptNumber`, token).catch(() => ({ items: [] }))
  let max = 0
  for (const r of data.items || []) {
    const m = String(r.receiptNumber || '').match(/RCP-(\d{4})-(\d+)/)
    if (m) max = Math.max(max, Number(m[2]))
  }
  if (!max) {
    const all = await pb(`/api/collections/receipts/records?perPage=500&fields=receiptNumber`, token)
    for (const r of all.items || []) {
      const m = String(r.receiptNumber || '').match(/RCP-(\d{4})-(\d+)/)
      if (m) max = Math.max(max, Number(m[2]))
    }
  }
  return `RCP-${new Date().getFullYear()}-${String(max + 1).padStart(3, '0')}`
}

async function audit(token: string, action: string, description: string, metadata: Record<string, any>) {
  try {
    await pb('/api/collections/audit_logs/records', token, {
      method: 'POST',
      body: JSON.stringify({
        action: `agent:${action}`,
        description,
        metadata,
        user_name: 'principal-agent',
        user_id: 'principal-agent',
        ip_address: '127.0.0.1',
        user_agent: 'principal-agent/api',
      }),
    })
  } catch (e) {
    console.warn('[agent] 审计写入失败:', e)
  }
}

export async function runAgentAction(action: string, params: Record<string, any>) {
  const token = await getAdminToken()
  const reason = requireReason(params)

  switch (action) {
    case 'void_invoice': {
      const inv = await findInvoice(token, need(params, 'invoiceNumber'))
      const updated = await pb(`/api/collections/invoices/records/${inv.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          deleted: true,
          notes: [inv.notes, `【院长助理作废】${reason}（${new Date().toISOString().slice(0, 10)}）`].filter(Boolean).join(' ｜ '),
        }),
      })
      await audit(token, action, `作废发票 ${inv.invoiceNumber}（票面 ${inv.totalAmount}）`, {
        before: { invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount, status: inv.status },
        after: { deleted: true },
        reason,
      })
      return { ok: true, action, invoiceNumber: inv.invoiceNumber, wasAmount: inv.totalAmount, deleted: updated.deleted }
    }

    case 'set_due_date': {
      const inv = await findInvoice(token, need(params, 'invoiceNumber'))
      const dueDate = need(params, 'dueDate')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) fail('dueDate 必须是 YYYY-MM-DD')
      const updated = await pb(`/api/collections/invoices/records/${inv.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          dueDate,
          notes: [inv.notes, `【院长助理改到期日】${inv.dueDate || '空'} → ${dueDate}；${reason}`].filter(Boolean).join(' ｜ '),
        }),
      })
      await audit(token, action, `改到期日 ${inv.invoiceNumber}：${inv.dueDate || '空'} → ${dueDate}`, {
        before: { dueDate: inv.dueDate }, after: { dueDate }, reason,
      })
      return { ok: true, action, invoiceNumber: inv.invoiceNumber, dueDate: updated.dueDate }
    }

    case 'issue_correction_receipt': {
      const orig = await findReceipt(token, need(params, 'originalReceiptNumber'))
      const amount = round2(Number(params?.amount ?? 0))
      if (Number.isNaN(amount) || amount < 0) fail('amount 必须是不小于 0 的数字')
      const receiptNumber = await nextReceiptNumber(token)
      const created = await pb('/api/collections/receipts/records', token, {
        method: 'POST',
        body: JSON.stringify({
          receiptNumber,
          receipt_date: new Date().toISOString().slice(0, 10) + ' 00:00:00.000Z',
          totalAmount: amount,
          status: 'issued',
          studentId: orig.studentId,
          paymentId: '',
          notes: `更正收据 - 更正 ${orig.receiptNumber}（原票 RM${round2(orig.totalAmount)}）：${reason}`,
        }),
      })
      await pb(`/api/collections/receipts/records/${orig.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ deleted: true }),
      })
      await audit(token, action, `更正收据 ${orig.receiptNumber} → ${receiptNumber}（RM${round2(orig.totalAmount)} → RM${amount}）`, {
        before: { receiptNumber: orig.receiptNumber, totalAmount: orig.totalAmount },
        after: { receiptNumber, totalAmount: amount },
        reason,
      })
      return { ok: true, action, original: orig.receiptNumber, correction: receiptNumber, amount }
    }

    case 'void_salary_record': {
      const recordId = need(params, 'recordId')
      const rec = await pb(`/api/collections/teacher_salary_records/records/${recordId}`, token).catch(() => null)
      if (!rec?.id) fail(`找不到薪资单 ${recordId}`, 404)
      if (rec.deleted === true) fail('这张薪资单已经删了', 409)
      // 硬规矩：只允许删「同老师 + 同月 + 同额」确实重复的那张，不让人手滑删错
      const f = encodeURIComponent(`teacher_id="${rec.teacher_id}" && year=${rec.year} && month=${rec.month} && deleted=false`)
      const siblings = await pb(`/api/collections/teacher_salary_records/records?perPage=20&filter=${f}`, token)
      const dup = (siblings.items || []).filter((x: any) => x.id !== rec.id && round2(x.net_salary) === round2(rec.net_salary))
      if (!dup.length) fail('这不是重复单：同老师同月没有另一张同额薪资单，拒绝删除', 409)
      await pb(`/api/collections/teacher_salary_records/records/${recordId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ deleted: true, notes: [rec.notes, `【院长助理删除重复单】保留 ${dup[0].id}；${reason}`].filter(Boolean).join(' ｜ ') }),
      })
      await audit(token, action, `删除重复薪资单 ${recordId}（${rec.salary_period} RM${round2(rec.net_salary)}），保留 ${dup[0].id}`, {
        before: { recordId, net_salary: rec.net_salary, salary_period: rec.salary_period },
        after: { deleted: true, kept: dup[0].id },
        reason,
      })
      return { ok: true, action, deleted: recordId, kept: dup[0].id }
    }

    case 'apply_credit': {
      const inv = await findInvoice(token, need(params, 'invoiceNumber'))
      const result = await applyCreditsToInvoice(inv.id)
      await audit(token, action, `抵上期多收到 ${inv.invoiceNumber}：RM${result.applied}`, {
        before: { totalAmount: inv.totalAmount },
        after: { totalAmount: result.invoice?.totalAmount ?? inv.totalAmount, applied: result.applied },
        reason,
      })
      return { ok: true, action, invoiceNumber: inv.invoiceNumber, applied: result.applied, newTotal: result.invoice?.totalAmount }
    }

    default:
      fail(`不允许的动作：${action}。可用动作见 GET /api/agent/actions`, 403)
  }
}

/** 只读：把「还等院长点头的事」列出来，给助理回话用 */
export async function openItems() {
  const token = await getAdminToken()
  const [creditsData, invData] = await Promise.all([
    pb(`/api/collections/student_credits/records?perPage=200&filter=${encodeURIComponent('deleted=false && status="unused"')}`, token),
    pb(`/api/collections/invoices/records?perPage=200&filter=${encodeURIComponent('deleted=false && (status="issued" || status="partially_paid")')}`, token),
  ])
  const credits = (creditsData.items || []).map((c: any) => ({
    student: c.studentName, amount: round2(c.remaining ?? c.amount), source: c.sourceInvoiceNumber,
  }))
  return {
    creditTotal: round2(credits.reduce((s: number, c: any) => s + c.amount, 0)),
    credits,
    openInvoices: (invData.items || []).length,
  }
}
