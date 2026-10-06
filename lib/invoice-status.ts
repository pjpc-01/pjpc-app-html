/**
 * 发票逾期判定 —— 全站唯一口径（2026-09-30 建立）
 *
 * 背景：系统从不把 invoices.status 置成 'overdue'（只有手动/半自动标记），
 * 所以「按 status === 'overdue' 数」的页面永远显示 0，而按到期日算的财务概览显示 3 →
 * 同一件事两个数。统一为：**未付清 且 到期日已过 = 逾期**。
 *
 * 兼容 camelCase（hook 映射后）与 snake_case（PB 原始记录）。
 */
export function isInvoiceOverdue(inv: any, todayISO?: string): boolean {
  if (!inv) return false
  const status = String(inv.status || '').toLowerCase()
  // carried_forward = 余额已并进下月新单（新单会算），再算这张就是重复计
  if (status === 'paid' || status === 'cancelled' || status === 'draft' || status === 'carried_forward') return false
  const due = inv.dueDate || inv.due_date
  if (!due) return false
  const today = todayISO || new Date().toISOString().slice(0, 10)
  return String(due).slice(0, 10) < String(today).slice(0, 10)
}

/** 逾期天数（未逾期返回 0） */
export function daysOverdue(inv: any, todayISO?: string): number {
  const due = inv?.dueDate || inv?.due_date
  if (!due || !isInvoiceOverdue(inv, todayISO)) return 0
  const today = todayISO || new Date().toISOString().slice(0, 10)
  const ms = new Date(String(today).slice(0, 10)).getTime() - new Date(String(due).slice(0, 10)).getTime()
  return Math.max(0, Math.round(ms / 86400000))
}

// ─── 未收金额（全站唯一口径，别再各页自己算）───────────────────────────────
// 2026-10-06：三个页面三个数（39,099.50 / 38,147.50 / 38,149.50）就是各写各的算法造成的。
// 权威口径 = 应收（开票总额） − 实收（收款 − 退款）。
// ⚠️ 不要用「逐张 max(0, 票额 − 已收) 再求和」：某张多收的零头会被丢掉，
//    总数会比真实值偏高（实测 +2.00 / +952 就是这么来的）。

/** 不计入应收的发票状态（作废 / 草稿） */
export const INVOICE_VOID_STATUSES = ["cancelled", "draft"]

/** 应收 = 开票总额（排除作废/草稿/已删） */
export function invoiceReceivable(invoices: any[] = []): number {
  return invoices
    .filter((i) => i && !i.deleted && !INVOICE_VOID_STATUSES.includes(String(i.status)))
    .reduce((s, i) => s + (Number(i.totalAmount ?? i.total_amount ?? i.amount) || 0), 0)
}

/** 实收 = 收款（只认 completed） */
export function paymentsReceived(payments: any[] = []): number {
  return payments
    .filter((p) => p && !p.deleted && (!p.status || p.status === "completed"))
    .reduce((s, p) => s + (Number(p.amount) || 0), 0)
}

/** 退款合计（完成的） */
export function refundsTotal(refunds: any[] = []): number {
  return refunds
    .filter((r) => r && !r.deleted && (!r.status || r.status === "completed"))
    .reduce((s, r) => s + (Number(r.amount) || 0), 0)
}

/** 未收金额 = 应收 − （实收 − 退款），不为负 */
export function computeUnreceived(invoices: any[] = [], payments: any[] = [], refunds: any[] = []): number {
  return Math.max(0, invoiceReceivable(invoices) - (paymentsReceived(payments) - refundsTotal(refunds)))
}
