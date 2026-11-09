/**
 * 开票的唯一实现。批量开票（app/api/billing/auto-generate）和学生费用卡的「开票」
 * （StudentFeeMatrix）以前各写一套：账期一个用当月一个用下月、总额一个用卡片金额一个自己
 * reduce，结果同一件事两个结果，还撞出「同月两张」。现在两边都只调这里。
 *
 * 规矩（老板定的）：
 *   1. 账期 = 学费所属月，批量提前一个月开 → 默认取下个月。
 *   2. 金额只认明细合计，全站唯一算法在 lib/finance-calc。
 *   3. 折扣写成负数明细行，不藏进 amount。
 */
import { round2, sumLines, subtotalOf, discountValueOf } from './finance-calc'

export type InvoiceLineInput = {
  id?: string
  name: string
  /** 单价（日计项目如 Meal 8、Late Pick Up 5；数量另给 quantity） */
  amount: number
  /** 数量：日计项目按天数/次数。不传 = 1。以前这里没有数量字段，
   *  「餐点 3 份 × 8」进到发票只剩 8，票面凭空少 16 —— 院长填 989 出 918 就是这条 */
  quantity?: number
  /** monthly | one-time | annual */
  type?: string
}

export type InvoiceItem = {
  name: string
  /** 这一行的合计（单价 × 数量），票面和小计都按这个加 */
  amount: number
  /** 单价，只有数量 > 1 时才有意义 */
  unitPrice?: number
  /** 数量，只有 > 1 时才写进明细，避免老票面看得乱 */
  quantity?: number
}

export type BuildInvoiceLinesInput = {
  lines: InvoiceLineInput[]
  /** 走「×6 个月」的费用 id */
  sixMonthFeeIds?: string[]
  /** 六月付的折扣率（percent 时按 0~1 的小数，跟 PB 存的一致） */
  sixMonthPayRate?: number
  sixMonthPayRateType?: 'amount' | 'percent'
  /** 学生折扣（金额或百分比） */
  discount?: number
  discountType?: 'amount' | 'percent'
}

export type BuiltInvoice = {
  items: InvoiceItem[]
  /** 折扣前原价 */
  subtotal: number
  /** 学生折扣金额（正数） */
  discountAmount: number
  /** 预付折扣金额（正数） */
  prepayDiscount: number
  /** 应收总额 = 明细合计 */
  total: number
}

const isOneTime = (t?: string) => t === 'one-time' || t === 'annual'

/** 账期：默认下个月（批量 24–27 号开的是下个月的票，单张开票同理） */
export function defaultInvoicePeriod(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 明确的账期优先，否则取下个月 */
export function resolveInvoicePeriod(explicit?: string | null): string {
  return typeof explicit === 'string' && /^\d{4}-\d{2}$/.test(explicit) ? explicit : defaultInvoicePeriod()
}

export function buildInvoiceLines(input: BuildInvoiceLinesInput): BuiltInvoice {
  const { lines, sixMonthFeeIds, sixMonthPayRate, sixMonthPayRateType, discount, discountType } = input
  const prepaid = new Set(sixMonthFeeIds || [])

  // 1. 原价明细：单价 × 数量；走六月付的项目再 ×6，一次性项目带标注
  const items: InvoiceItem[] = []
  for (const l of lines || []) {
    const unit = Number(l.amount) || 0
    const qty = Math.max(1, Number(l.quantity) || 1)
    const lineTotal = round2(unit * qty)
    if (l.id && prepaid.has(l.id)) {
      items.push({ name: `${l.name} (×6个月)`, amount: round2(lineTotal * 6) })
    } else if (qty > 1) {
      // 数量 > 1 必须写在明细上，否则看不出这个数是乘出来的
      items.push({ name: `${l.name} (×${qty})`, amount: lineTotal, unitPrice: unit, quantity: qty })
    } else {
      items.push({ name: isOneTime(l.type) ? `${l.name} (一次性)` : l.name, amount: lineTotal })
    }
  }

  const subtotal = subtotalOf(items)

  // 2. 学生折扣
  let discountAmount = 0
  const disc = Number(discount) || 0
  if (disc > 0) {
    discountAmount = discountValueOf(subtotal, disc, discountType || 'amount')
    if (discountAmount > 0) {
      items.push({
        name: (discountType || 'amount') === 'percent' ? `学生折扣 (${disc}%)` : '学生折扣',
        amount: -discountAmount,
      })
    }
  }

  // 3. 六月付折扣率（作用在扣完学生折扣的金额上）
  let prepayDiscount = 0
  const rate = Number(sixMonthPayRate) || 0
  if (prepaid.size > 0 && rate > 0) {
    const baseAfterDiscount = round2(subtotal - discountAmount)
    prepayDiscount = (sixMonthPayRateType || 'percent') === 'amount'
      ? round2(rate)
      : round2(baseAfterDiscount * rate)
    if (prepayDiscount > baseAfterDiscount) prepayDiscount = baseAfterDiscount
    if (prepayDiscount > 0) {
      items.push({
        name: (sixMonthPayRateType || 'percent') === 'amount'
          ? `预付6个月折扣 (RM${prepayDiscount.toFixed(2)})`
          : `预付6个月折扣 (${(rate * 100).toFixed(0)}%)`,
        amount: -prepayDiscount,
      })
    }
  }

  return { items, subtotal, discountAmount, prepayDiscount, total: sumLines(items) }
}

/**
 * 把「一张已存在的发票」换算成票面要显示的三样东西：明细、小计（折扣前）、总计。
 * PDF、预览、打印都调这里 —— 渲染层以前各自 subtotalOf/sumLines 一遍，虽然用的是同一个
 * 算法，但定义散在好几处；现在只有一个出口。发票表里只存 items 和 totalAmount，没有存小计，
 * 所以小计必须从明细推出来，这就是「PDF 也要算一次」的原因，不是另一套算法。
 */
export function invoiceView(invoice: { items?: any[] | null; totalAmount?: number | null }) {
  const list = Array.isArray(invoice?.items) && invoice.items.length > 0
    ? invoice.items
    : [{ name: '学生费用', amount: Number(invoice?.totalAmount) || 0 }]
  return {
    items: list as { name: string; amount: number }[],
    subtotal: subtotalOf(list as any),
    total: round2(Number(invoice?.totalAmount) || sumLines(list as any) || 0),
  }
}
