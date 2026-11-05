/**
 * 学生待抵扣余额（多收结转）的唯一实现。
 *
 * 背景：家长有时按折扣前的原价转钱，票面后来变小 → 系统多收了钱。多收的钱不能凭空消失，
 * 也不能靠人记，所以记成 student_credits 一条记录，下期开票时自动抵掉。
 *
 * 一条记录的生命周期：
 *   unused（remaining > 0）→ 开票部分抵扣 → remaining 减少、usageLog 追加
 *   → remaining = 0 时 status = used
 *   → 家长退款 或 来源发票作废 → status = refunded / void，remaining = 0，谁都不能再用
 *
 * 三条硬规矩：
 *   1. 抵扣只能在这里扣，任何地方都不许直接改 remaining。
 *   2. 抵扣前必须先「抢占」（改 remaining 的人拿到最新值再写），避免两个请求抵用同一笔。
 *   3. 抵扣行要进 items（负数行），票面 totalAmount 与明细合计必须相等，绝不用金额兜底。
 */
import { getAdminToken } from './pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

async function pbJSON(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...init,
    headers: { Authorization: token, 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PocketBase ${res.status} ${path} ${text.slice(0, 200)}`)
  }
  return res.json()
}

/** 同一学生的抵扣串行执行：防止两个请求同时把同一笔余额抵掉 */
const locks = new Map<string, Promise<unknown>>()
async function withStudentLock<T>(studentId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(studentId) || Promise.resolve()
  let release: () => void = () => {}
  const gate = new Promise<void>((r) => (release = r))
  locks.set(studentId, prev.then(() => gate))
  await prev.catch(() => {})
  try {
    return await fn()
  } finally {
    release()
    if (locks.get(studentId) === prev.then(() => gate)) locks.delete(studentId)
  }
}

export type CreditRow = {
  id: string
  studentId: string
  studentName: string
  amount: number
  remaining: number
  usedAmount: number
  status: string
  sourceInvoiceId: string
  sourceInvoiceNumber: string
  sourcePeriod: string
  usageLog: { invoiceId: string; invoiceNumber: string; amount: number; at: string }[]
}

/** 某学生当前可用的抵扣（未抵扣且还有余额的），先抵最早的 */
export async function availableCredits(studentId: string, token?: string): Promise<CreditRow[]> {
  const tk = token || (await getAdminToken())
  const filter = encodeURIComponent(`studentId="${studentId}" && status="unused" && deleted=false`)
  // 注意：PB 0.39 这个库上 `sort=created` 会直接 400（系统字段排序踩过坑），改为取回后本地排序
  const data = await pbJSON(`/api/collections/student_credits/records?perPage=200&filter=${filter}`, tk)
  return (data.items || [])
    .sort((a: any, b: any) => String(a.created).localeCompare(String(b.created)))
    .map((c: any) => ({
      ...c,
      amount: round2(c.amount),
      remaining: round2(c.remaining ?? c.amount),
      usedAmount: round2(c.usedAmount || 0),
      usageLog: Array.isArray(c.usageLog) ? c.usageLog : [],
    }))
    .filter((c: CreditRow) => c.remaining > 0.005)
}

export type ApplyResult = {
  applied: number
  credits: { id: string; sourceInvoiceNumber: string; amount: number }[]
  invoice?: any
}

/**
 * 把某学生手上的抵扣，自动抵到这张新发票上。
 * 只处理「还没收钱」的发票（issued / draft）；已付、作废的一律不碰。
 * 抵完会把负数行写进 items，并重算 totalAmount，保证明细合计 = 票面。
 */
export async function applyCreditsToInvoice(invoiceId: string, token?: string): Promise<ApplyResult> {
  const tk = token || (await getAdminToken())
  const invoice = await pbJSON(`/api/collections/invoices/records/${invoiceId}`, tk)
  if (!invoice?.id) return { applied: 0, credits: [] }

  const status = String(invoice.status || '')
  if (['paid', 'cancelled', 'void', 'deleted'].includes(status)) return { applied: 0, credits: [] }
  if (invoice.deleted === true) return { applied: 0, credits: [] }

  const due = round2(Number(invoice.totalAmount) || 0)
  if (due <= 0) return { applied: 0, credits: [] }

  return withStudentLock(invoice.studentId, async () => {
    // 抢占：锁内重新读一次，拿到最新 remaining
    const credits = await availableCredits(invoice.studentId, tk)
    if (!credits.length) return { applied: 0, credits: [] }

    let left = due
    const used: { id: string; sourceInvoiceNumber: string; amount: number }[] = []
    const now = new Date().toISOString()

    for (const c of credits) {
      if (left <= 0.005) break
      // 来源就是这张票的不抵（同一张票不能抵自己）
      if (c.sourceInvoiceId === invoiceId) continue
      // 这条记录已经抵过这张票了（上次中途失败后重试）→ 不再重复扣
      if ((c.usageLog || []).some((u) => u.invoiceId === invoiceId)) continue
      const take = round2(Math.min(c.remaining, left))
      if (take <= 0) continue
      const newRemaining = round2(c.remaining - take)
      const log = [
        ...(c.usageLog || []),
        { invoiceId, invoiceNumber: invoice.invoiceNumber, amount: take, at: now },
      ]
      await pbJSON(`/api/collections/student_credits/records/${c.id}`, tk, {
        method: 'PATCH',
        body: JSON.stringify({
          remaining: newRemaining,
          usedAmount: round2((c.usedAmount || 0) + take),
          status: newRemaining <= 0.005 ? 'used' : 'unused',
          usedInvoiceId: invoiceId,
          usedInvoiceNumber: invoice.invoiceNumber,
          usedAt: now,
          usageLog: log,
        }),
      })
      used.push({ id: c.id, sourceInvoiceNumber: c.sourceInvoiceNumber, amount: take })
      left = round2(left - take)
    }

    if (!used.length) return { applied: 0, credits: [] }

    const applied = round2(used.reduce((s, u) => s + u.amount, 0))
    const items = Array.isArray(invoice.items) ? [...invoice.items] : []
    // 抵扣写成负数明细行：票面 = 明细合计，任何报表都不用再兜底
    items.push({ name: '上期多收抵扣', amount: -applied })
    const newTotal = round2(Math.max(0, due - applied))

    let updated: any
    try {
      updated = await pbJSON(`/api/collections/invoices/records/${invoiceId}`, tk, {
        method: 'PATCH',
        body: JSON.stringify({ items, totalAmount: newTotal, amount: newTotal }),
      })
    } catch (err) {
      // 发票没写成功就把额度退回去 —— 否则出现「家长的钱被扣了、票面没变」，下期还会再扣一次
      for (const u of used) {
        const src = credits.find((c) => c.id === u.id)
        if (!src) continue
        try {
          await pbJSON(`/api/collections/student_credits/records/${u.id}`, tk, {
            method: 'PATCH',
            body: JSON.stringify({
              remaining: src.remaining,
              usedAmount: src.usedAmount,
              status: src.remaining <= 0.005 ? 'used' : 'unused',
              usageLog: src.usageLog,
            }),
          })
        } catch (e2) {
          console.error('[credits] 回滚失败，需人工核:', u.id, e2)
        }
      }
      throw err
    }

    return { applied, credits: used, invoice: updated }
  })
}

/**
 * 冲销：来源发票作废/删除，或家长退款时，把这笔余额封掉。
 * 已经抵用过的部分不追回（钱已经抵进票里了），只封剩余部分。
 */
export async function voidCreditsForSource(
  sourceInvoiceId: string,
  reason: 'void' | 'refunded',
  note: string,
  token?: string
): Promise<number> {
  const tk = token || (await getAdminToken())
  const filter = encodeURIComponent(`sourceInvoiceId="${sourceInvoiceId}" && deleted=false`)
  const data = await pbJSON(`/api/collections/student_credits/records?perPage=200&filter=${filter}`, tk)
  let closed = 0
  for (const c of data.items || []) {
    if (String(c.status) === reason) continue
    if (round2(c.remaining ?? c.amount) <= 0.005) continue
    await pbJSON(`/api/collections/student_credits/records/${c.id}`, tk, {
      method: 'PATCH',
      body: JSON.stringify({
        status: reason,
        remaining: 0,
        note: [c.note, note].filter(Boolean).join(' ｜ '),
      }),
    })
    closed += 1
  }
  return closed
}

/**
 * 一张「用过抵扣」的发票被作废/删除时，把它抵掉的额度退回去。
 * 不做这一步，票没了、额度也没了，家长的钱就凭空消失。
 */
export async function revertUsageForInvoice(invoiceId: string, token?: string): Promise<number> {
  const tk = token || (await getAdminToken())
  const data = await pbJSON(`/api/collections/student_credits/records?perPage=500&filter=${encodeURIComponent('deleted=false')}`, tk)
  let touched = 0
  for (const c of data.items || []) {
    const log = Array.isArray(c.usageLog) ? c.usageLog : []
    const hit = log.filter((u: any) => u.invoiceId === invoiceId)
    if (!hit.length) continue
    const back = round2(hit.reduce((s: number, u: any) => s + Number(u.amount || 0), 0))
    const remaining = round2((Number(c.remaining ?? c.amount) || 0) + back)
    const usedAmount = round2(Math.max(0, (Number(c.usedAmount) || 0) - back))
    await pbJSON(`/api/collections/student_credits/records/${c.id}`, tk, {
      method: 'PATCH',
      body: JSON.stringify({
        remaining,
        usedAmount,
        status: remaining > 0.005 ? 'unused' : 'used',
        usageLog: log.filter((u: any) => u.invoiceId !== invoiceId),
      }),
    })
    touched += 1
  }

  // 票面也要还原：把「上期多收抵扣」行拿掉、总额加回去，
  // 否则票被恢复后仍然是折后价，而额度又退给了学生 → 同一笔钱算两次
  if (touched > 0) {
    try {
      const inv = await pbJSON(`/api/collections/invoices/records/${invoiceId}`, tk)
      const items = Array.isArray(inv.items) ? inv.items : []
      const kept = items.filter((x: any) => !String(x?.name || '').includes('上期多收抵扣'))
      if (kept.length !== items.length) {
        const back = round2(items
          .filter((x: any) => String(x?.name || '').includes('上期多收抵扣'))
          .reduce((s: number, x: any) => s + Math.abs(Number(x.amount || 0)), 0))
        const newTotal = round2((Number(inv.totalAmount) || 0) + back)
        await pbJSON(`/api/collections/invoices/records/${invoiceId}`, tk, {
          method: 'PATCH',
          body: JSON.stringify({ items: kept, totalAmount: newTotal, amount: newTotal }),
        })
      }
    } catch (e) {
      console.warn('[credits] 还原票面失败:', e)
    }
  }

  return touched
}

/**
 * 反冲销：发票从回收站恢复时，把之前封掉的余额放回来（只放还有 remaining 抵扣空间的那部分）。
 * 不放在这里的话，「删了又恢复」会让家长的钱凭空消失。
 */
export async function reopenCreditsForSource(sourceInvoiceId: string, token?: string): Promise<number> {
  const tk = token || (await getAdminToken())
  const filter = encodeURIComponent(`sourceInvoiceId="${sourceInvoiceId}" && deleted=false && (status="void" || status="refunded")`)
  const data = await pbJSON(`/api/collections/student_credits/records?perPage=200&filter=${filter}`, tk)
  let opened = 0
  for (const c of data.items || []) {
    const total = round2(c.amount)
    const used = round2(c.usedAmount || 0)
    const back = round2(total - used)
    if (back <= 0.005) continue
    await pbJSON(`/api/collections/student_credits/records/${c.id}`, tk, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'unused', remaining: back }),
    })
    opened += 1
  }
  return opened
}

/** 某学生待抵扣合计（给开票前预览、页面卡片用） */
export async function creditTotalForStudent(studentId: string, token?: string): Promise<number> {
  const list = await availableCredits(studentId, token)
  return round2(list.reduce((s, c) => s + c.remaining, 0))
}
