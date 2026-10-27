import { suToken } from './probes/_auth.mjs'
import { round2, sumLines, subtotalOf, discountTotalOf, invoiceTotals, isDiscountLine } from '../lib/finance-calc.ts'

const PB = 'http://127.0.0.1:8090'
const token = await suToken()
const H = { Authorization: token }

const all = async (c: string, filter = ''): Promise<any[]> => {
  let page = 1, out: any[] = []
  for (;;) {
    const d = await (await fetch(`${PB}/api/collections/${c}/records?perPage=500&page=${page}${filter ? '&filter=' + encodeURIComponent(filter) : ''}`, { headers: H })).json()
    out = out.concat(d.items || [])
    if (!d.items || d.items.length < 500) break
    page++
  }
  return out
}

const invoices = await all('invoices', 'deleted=false')
const assignments = await all('student_fees')

const adjByStudent = new Map<string, any>()
for (const a of assignments) {
  if (!a.students) continue
  const prev = adjByStudent.get(a.students)
  if (!prev || (Number(a.discount || 0) > 0 && Number(prev.discount || 0) === 0)) adjByStudent.set(a.students, a)
}

const diffs: any[] = []
let paidTouched = 0
let shadowDiscountDiffs = 0

for (const inv of invoices) {
  const items = inv.items || []
  const t = invoiceTotals(items)
  const stored = round2(inv.totalAmount)
  if (Math.abs(t.total - stored) > 0.01) {
    diffs.push({
      no: inv.invoiceNumber, status: inv.status, student: inv.studentName || '',
      stored, currencyNew: t.total, subtotal: t.subtotal, discountLine: t.discount,
      lines: items.map((l: any) => `${l.name}:${l.amount}`).join(' | ').slice(0, 100),
    })
    if (String(inv.status) === 'paid') paidTouched++
  }
  // 折扣是否跟学生费用一致（只查未缴清）
  const adj = adjByStudent.get(inv.studentId)
  if (adj && Number(adj.discount || 0) > 0 && String(inv.status) !== 'paid' && /^\d{4}-\d{2}$/.test(String(inv.period || ''))) {
    const want = invoiceTotals(items, adj.discount, adj.discount_type || 'amount')
    if (Math.abs(want.total - round2(inv.totalAmount)) > 0.01) {
      shadowDiscountDiffs++
      diffs.push({ no: inv.invoiceNumber, status: inv.status, student: inv.studentName || '', stored: round2(inv.totalAmount), currencyNew: want.total, subtotal: want.subtotal, discountLine: want.discount, lines: '折扣跟学生费用不一致' })
    }
  }
}

console.log(`对照发票 ${invoices.length} 张`)
console.log(`新算法算出不一致的: ${diffs.length} 张（其中已付款 ${paidTouched} 张，折扣不同步 ${shadowDiscountDiffs} 张）`)
for (const d of diffs) {
  console.log(`  ${d.no} [${d.status}] ${d.student} | 库里 ${d.stored} → 新算 ${d.currencyNew}（小计 ${d.subtotal} 折扣 ${d.discountLine}）`)
  console.log(`     ${d.lines}`)
}
