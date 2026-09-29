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
