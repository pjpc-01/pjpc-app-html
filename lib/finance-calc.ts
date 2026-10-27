/**
 * 财务金额计算的唯一出处。
 *
 * 以前「总额 / 小计 / 折扣」在 20 个文件里各算一遍（61 处加总），
 * 改一处别处不动，就会出现「费用页设了折扣、发票还是原价」这类问题。
 * 现在凡是算钱的地方都调这里，页面只负责显示。
 *
 * 规则（全站统一口径）：
 * - 发票金额 = 明细行相加，折扣写成一条负数明细行（名称含「折扣」）
 * - 小计 subtotal = 不含折扣行的明细合计（折扣前的原价）
 * - 总计 total = 小计 − 折扣（= 所有明细行相加）
 * - 金额一律两位小数，用 round2 收口，避免 0.1+0.2 那种浮点脏数
 */

export type MoneyLine = { name?: string; amount?: number | string; [key: string]: any }

/** 金额统一两位小数 */
export function round2(n: number | string | null | undefined): number {
  return Math.round((Number(n) || 0) * 100) / 100
}

/** 是不是「折扣」那条明细行（学生的、六个月的都算） */
export function isDiscountLine(line: MoneyLine | null | undefined): boolean {
  return /折扣/.test(String(line?.name || ''))
}

/** 所有明细相加（含折扣负数行）→ 等于总计 */
export function sumLines(lines: MoneyLine[] | null | undefined): number {
  return round2((lines || []).reduce((s, l) => s + (Number(l?.amount) || 0), 0))
}

/** 折扣前的原价：只算非折扣行 */
export function subtotalOf(lines: MoneyLine[] | null | undefined): number {
  return round2((lines || []).filter(l => !isDiscountLine(l)).reduce((s, l) => s + (Number(l?.amount) || 0), 0))
}

/** 折扣行合计（正数，方便显示「折扣 140」） */
export function discountTotalOf(lines: MoneyLine[] | null | undefined): number {
  return round2(Math.abs(
    (lines || []).filter(isDiscountLine).reduce((s, l) => s + (Number(l?.amount) || 0), 0)
  ))
}

/** 按学生费用设定的折扣值算出实际折扣金额：type = amount（钱）或 percent（百分比） */
export function discountValueOf(base: number, value: number | string | null | undefined, type: string = 'amount'): number {
  const v = Number(value) || 0
  if (v <= 0) return 0
  const b = Number(base) || 0
  return round2(String(type) === 'percent' ? (b * v) / 100 : v)
}

export interface InvoiceTotals {
  /** 折扣前原价 */
  subtotal: number
  /** 折扣金额（正数） */
  discount: number
  /** 应付总额 */
  total: number
}

/**
 * 从明细行算出发票的 小计 / 折扣 / 总计。
 * 给了 assignmentDiscount + assignmentDiscountType 时，以学生费用设定的折扣为准，
 * 用来判断发票里的折扣行是不是过期了（对账、重算折扣都用这个）。
 */
export function invoiceTotals(
  lines: MoneyLine[] | null | undefined,
  assignmentDiscount?: number | string | null,
  assignmentDiscountType?: string,
): InvoiceTotals {
  const subtotal = subtotalOf(lines)
  const fromLines = discountTotalOf(lines)
  const expected = assignmentDiscount == null
    ? fromLines
    : discountValueOf(subtotal, assignmentDiscount, assignmentDiscountType || 'amount')
  const discount = assignmentDiscount == null ? fromLines : expected
  return { subtotal, discount, total: round2(subtotal - discount) }
}

/**
 * 把折扣写成明细行：先删掉旧的折扣行，再按当前设定加一条负数行。
 * 用途：开票、重算折扣、批量生成都走这一个函数，保证折扣行只有一条、金额一致。
 */
export function withDiscountLine(
  lines: MoneyLine[] | null | undefined,
  value: number | string | null | undefined,
  type: string = 'amount',
): MoneyLine[] {
  const kept = (lines || []).filter(l => !isDiscountLine(l))
  const base = subtotalOf(kept)
  const amount = discountValueOf(base, value, type)
  if (amount <= 0) return kept
  const label = String(type) === 'percent' ? `学生折扣 (${Number(value)}%)` : '学生折扣'
  return [...kept, { name: label, amount: round2(-amount) }]
}

// ── 归月（口径的第二半：这张票算哪个月的钱） ──

/**
 * 任意日期值 → 'YYYY-MM'，按**本地时区**取月。
 * 不要用 toISOString().slice(0,7)：那是 UTC，马来西亚早上 8 点前会掉到上个月。
 */
export function monthKeyOf(v: any): string {
  if (!v) return ''
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return ''
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}`
  }
  const s = String(v).trim()
  // '2026-09-14...' / '2026-09' / '2026/09/14'
  const m = s.match(/^(\d{4})[-/](\d{2})/)
  if (m) return `${m[1]}-${m[2]}`
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : monthKeyOf(d)
}

/**
 * 发票算哪个月：账期(period) 优先，它代表「这票是哪个月的学费」；
 * 没填账期才退回开具日，最后退回创建日。
 */
export function invoiceMonthKey(inv: any): string {
  const period = String(inv?.period || '').trim()
  if (/^\d{4}-\d{2}/.test(period)) return period.slice(0, 7)
  return monthKeyOf(inv?.issueDate) || monthKeyOf(inv?.created)
}

/** 这一行是不是「上期欠款 / 迟付罚金 / 余额转入」——属于旧账，不是本月新学费 */
export function isCarryOverLine(line: MoneyLine | null | undefined): boolean {
  return /上期|欠款|迟付罚金|Balance Deposit|结余/i.test(String(line?.name || ''))
}

/** 发票里结转性质的钱（旧账转入），正数 */
export function carryOverOf(lines: MoneyLine[] | null | undefined): number {
  return round2((lines || []).filter(isCarryOverLine).reduce((s, l) => s + (Number(l?.amount) || 0), 0))
}
