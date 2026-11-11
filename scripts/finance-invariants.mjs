#!/usr/bin/env node
/**
 * 财务数据不变量检查（不是 UI 测试，是查库对账）
 *
 * 用法: node scripts/finance-invariants.mjs
 * 退出码 0 = 全部通过；1 = 有违反（可以挂到 cron / 发版前跑）
 *
 * 七条规矩：
 * 1. 每张未删除发票：明细合计 == totalAmount
 * 2. 已付款发票：付款记录合计 == totalAmount
 * 3. 有折扣的学生：最新一张未缴清发票必须带折扣行，且折扣额按 amount/percent 算对
 * 4. 付款记录指向的发票必须真实存在
 * 5. 付款被删除/退款时不能还挂在已付款发票上
 * 6. 学生费用的 totalAmount == 费用项合计 - 折扣
 * 7. 全库应收 = Σ发票总额；实收 = Σ付款；未收 = 应收 - 实收（只报数，不判定好坏）
 */
import { suToken } from './lib/pb-auth.mjs'

const PB = process.env.PB_URL || 'http://127.0.0.1:8090'
const token = await suToken()
const H = { Authorization: token }

const all = async (c, filter = '') => {
  let page = 1, out = []
  for (;;) {
    const url = `${PB}/api/collections/${c}/records?perPage=500&page=${page}${filter ? '&filter=' + encodeURIComponent(filter) : ''}`
    const d = await (await fetch(url, { headers: H })).json()
    out = out.concat(d.items || [])
    if (!d.items || d.items.length < 500) break
    page++
  }
  return out
}
const money = n => Math.round(Number(n || 0) * 100) / 100
const isDiscountLine = it => /折扣/.test(String(it?.name || ''))

const invoices = await all('invoices', 'deleted=false')
const payments = await all('payments', 'deleted=false')
const assignments = await all('student_fees')
const credits = await all('student_credits')

const fails = []
const payByInvoice = new Map()
for (const p of payments) {
  const key = p.invoiceId || p.invoice
  if (!key) { fails.push({ rule: 5, msg: `付款 ${p.id} 没有指向任何发票，金额 ${p.amount}` }); continue }
  // 退款的钱不能算进「已收」：refunded 的付款是真扣回来的，算进来会出现 870+930=1800 这种假差异
  if (String(p.status) === 'refunded') continue
  payByInvoice.set(key, money((payByInvoice.get(key) || 0) + Number(p.amount || 0)))
}

// 1. 明细合计 vs totalAmount
for (const i of invoices) {
  const sum = money((i.items || []).reduce((s, x) => s + Number(x.amount || 0), 0))
  if (Math.abs(sum - money(i.totalAmount)) > 0.01) {
    fails.push({ rule: 1, msg: `${i.invoiceNumber} 明细合计 ${sum} ≠ 总额 ${money(i.totalAmount)}（差 ${money(i.totalAmount - sum)}）· 状态 ${i.status}` })
  }
}

// 2. 已付款发票 vs 付款记录
for (const i of invoices) {
  if (String(i.status) !== 'paid') continue
  const paid = money(payByInvoice.get(i.id) || 0)
  const diff = money(paid - money(i.totalAmount))
  // 多收（diff > 0）交给规则 8 判：有抵扣记录就算过关，没有才报。这里只报「标了已付款却少收」
  if (diff < -0.01) {
    fails.push({ rule: 2, msg: `${i.invoiceNumber} 票面 ${money(i.totalAmount)}，实收 ${paid}（少收 ${Math.abs(diff)}）· 账期 ${i.period || '-'}` })
  }
}

// 3. 折扣有没有落进最新发票
const byStudent = new Map()
for (const a of assignments) {
  if (!a.students) continue
  const prev = byStudent.get(a.students)
  if (!prev || (Number(a.discount || 0) > 0 && Number(prev.discount || 0) === 0)) byStudent.set(a.students, a)
}
const invByStudent = new Map()
for (const i of invoices) {
  if (!i.studentId) continue
  const list = invByStudent.get(i.studentId) || []
  list.push(i)
  invByStudent.set(i.studentId, list)
}
for (const [sid, a] of byStudent) {
  const disc = Number(a.discount || 0)
  if (disc <= 0) continue
  const list = (invByStudent.get(sid) || []).filter(i => String(i.status) !== 'paid')
    .sort((x, y) => String(y.period || '').localeCompare(String(x.period || '')))
  if (!list.length) continue
  const inv = list[0]
  const line = (inv.items || []).find(isDiscountLine)
  const base = money((inv.items || []).filter(x => !isDiscountLine(x)).reduce((s, x) => s + Number(x.amount || 0), 0))
  const want = String(a.discount_type || 'amount') === 'percent' ? money(base * disc / 100) : money(disc)
  const got = line ? money(Math.abs(Number(line.amount || 0))) : 0
  if (Math.abs(want - got) > 0.01) {
    fails.push({ rule: 3, msg: `${inv.invoiceNumber}（${inv.studentName || sid}，账期 ${inv.period}）折扣应为 ${want}，发票里是 ${got}` })
  }
}

// 4. 付款指向的发票是否存在
const invIds = new Set(invoices.map(i => i.id))
for (const p of payments) {
  const key = p.invoiceId || p.invoice
  if (key && !invIds.has(key)) fails.push({ rule: 4, msg: `付款 ${p.id}（RM ${p.amount}）指向的发票 ${key} 不存在或已删除` })
}

// 6. 学生费用合计
for (const a of assignments) {
  const items = Array.isArray(a.fee_items) ? a.fee_items : []
  if (!items.length) continue
  // 明细合计必须按 单价 × 数量：Meal 8 × 3 份、迟接 5 × 12 次、Full Daycare 10 × 2
  const gross = money(items.reduce((s, x) => s + Number(x.amount || 0) * (Number(x.quantity) || 1), 0))
  const disc = Number(a.discount || 0)
  const d = String(a.discount_type || 'amount') === 'percent' ? money(gross * disc / 100) : money(disc)
  const want = money(gross - d)
  if (a.totalAmount != null && Math.abs(money(a.totalAmount) - want) > 0.01) {
    fails.push({ rule: 6, msg: `学生费用 ${a.id} 存的总计 ${money(a.totalAmount)} ≠ 明细 ${gross} − 折扣 ${d} = ${want}` })
  }
}

// 8. 每一笔「实收 > 票面」都必须有一条待抵扣记录，金额要相等
//    这是「多收的钱不会凭空消失」的保证：谁多收了、记在哪，一定有据可查
const creditBySource = new Map()
for (const c of credits) {
  if (c.deleted === true) continue
  const key = c.sourceInvoiceId
  if (!key) continue
  creditBySource.set(key, money((creditBySource.get(key) || 0) + Number(c.amount || 0)))
}
for (const i of invoices) {
  const paid = money(payByInvoice.get(i.id) || 0)
  const over = money(paid - money(i.totalAmount))
  if (over <= 0.01) continue
  const credit = money(creditBySource.get(i.id) || 0)
  if (Math.abs(credit - over) > 0.01) {
    fails.push({ rule: 8, msg: `${i.invoiceNumber}（${i.studentName || ''}）多收 ${over}，抵扣记录 ${credit > 0 ? '只有 ' + credit : '一条都没有'}` })
  }
}

// 9. 已抵用的抵扣记录必须指向一张真实存在的发票
const invIdSet = new Set(invoices.map(i => i.id))
for (const c of credits) {
  if (c.deleted === true || String(c.status) !== 'used') continue
  if (!c.usedInvoiceId || !invIdSet.has(c.usedInvoiceId)) {
    fails.push({ rule: 9, msg: `抵扣记录 ${c.id}（${c.studentName || ''} RM${c.amount}）标成已抵用，但抵用的发票不存在（${c.usedInvoiceNumber || '空'}）` })
  }
}

// 10. 抵扣记录自身必须自洽：amount = usedAmount + remaining，状态与余额一致
for (const c of credits) {
  if (c.deleted === true) continue
  const amount = money(c.amount)
  const used = money(c.usedAmount || 0)
  const remaining = money(c.remaining ?? c.amount)
  const st = String(c.status || '')
  if (Math.abs(money(used + remaining) - amount) > 0.01) {
    fails.push({ rule: 10, msg: `抵扣 ${c.id}（${c.studentName || ''}）金额 ${amount} ≠ 已抵 ${used} + 剩余 ${remaining}` })
  }
  if (st === 'unused' && remaining <= 0.005) fails.push({ rule: 10, msg: `抵扣 ${c.id}（${c.studentName || ''}）标未抵扣，但余额已经是 ${remaining}` })
  if (st === 'used' && remaining > 0.005) fails.push({ rule: 10, msg: `抵扣 ${c.id}（${c.studentName || ''}）标已抵完，还剩 ${remaining}` })
  if ((st === 'void' || st === 'refunded') && remaining > 0.005) fails.push({ rule: 10, msg: `抵扣 ${c.id}（${c.studentName || ''}）已作废/退款，却还留着 ${remaining} 可用` })
  const logSum = money((Array.isArray(c.usageLog) ? c.usageLog : []).reduce((s, x) => s + Number(x.amount || 0), 0))
  if (Math.abs(logSum - used) > 0.01) fails.push({ rule: 10, msg: `抵扣 ${c.id}（${c.studentName || ''}）流水合计 ${logSum} ≠ 已抵 ${used}` })
}

// 11. 抵扣记录的来源发票必须存在（票没了，余额就是无源之水）
for (const c of credits) {
  if (c.deleted === true) continue
  if (c.sourceInvoiceId && !invIds.has(c.sourceInvoiceId)) {
    const st = String(c.status || '')
    if (st === 'unused' || st === 'used') {
      fails.push({ rule: 11, msg: `抵扣 ${c.id}（${c.studentName || ''} RM${money(c.amount)}）来源发票 ${c.sourceInvoiceNumber || c.sourceInvoiceId} 不存在（状态 ${st}）` })
    }
  }
}

// 12. 某张发票被抵过多少，明细里那行「上期多收抵扣」就必须是多少
const usedByInvoice = new Map()
for (const c of credits) {
  if (c.deleted === true) continue
  for (const u of Array.isArray(c.usageLog) ? c.usageLog : []) {
    if (!u.invoiceId) continue
    usedByInvoice.set(u.invoiceId, money((usedByInvoice.get(u.invoiceId) || 0) + Number(u.amount || 0)))
  }
}
for (const [invId, amount] of usedByInvoice) {
  const inv = invoices.find(i => i.id === invId)
  if (!inv) {
    fails.push({ rule: 12, msg: `抵扣流水指向的发票 ${invId} 不存在（抵了 ${amount}）` })
    continue
  }
  const line = (Array.isArray(inv.items) ? inv.items : []).filter(x => String(x?.name || '').includes('上期多收抵扣'))
  const lineSum = money(line.reduce((s, x) => s + Math.abs(Number(x.amount || 0)), 0))
  if (Math.abs(lineSum - amount) > 0.01) {
    fails.push({ rule: 12, msg: `${inv.invoiceNumber} 被抵扣 ${amount}，明细里的抵扣行只有 ${lineSum}` })
  }
}

// 7. 汇总
const receivable = money(invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0))
// 实收只算真正到账的：已退款的付款（status=refunded）不算，否则退款又被当成收入
const received = money(payments.filter(p => String(p.status) !== 'refunded').reduce((s, p) => s + Number(p.amount || 0), 0))

const byRule = {}
for (const f of fails) (byRule[f.rule] = byRule[f.rule] || []).push(f.msg)
const names = { 1: '发票明细 ≠ 总额', 2: '已付款发票 ≠ 付款记录', 3: '学生折扣没进发票', 4: '付款指向不存在的发票', 5: '付款没挂发票', 6: '学生费用合计不对', 8: '多收的钱没有抵扣记录', 9: '抵扣记录指向不存在的发票', 10: '抵扣记录自身不自洽', 11: '抵扣来源发票不存在', 12: '发票抵扣行与流水不符' }

console.log('=== 财务不变量检查 ===')
console.log(`发票 ${invoices.length} 张 · 付款 ${payments.length} 笔 · 学生费用 ${assignments.length} 条`)
// 待抵扣要看「还剩多少」，不是原始金额：部分抵扣后 amount 还是 100，remaining 才是 70
const creditUnused = money(credits.filter(c => c.deleted !== true && String(c.status) === 'unused').reduce((s, c) => s + Number(c.remaining ?? c.amount ?? 0), 0))
console.log(`应收 RM ${receivable} · 实收 RM ${received} · 未收 RM ${money(receivable - received)} · 待抵扣 RM ${creditUnused}`)
console.log('')
if (!fails.length) {
  console.log('全部通过，没有发现问题')
} else {
  for (const rule of Object.keys(byRule).sort()) {
    const list = byRule[rule]
    console.log(`【${rule}. ${names[rule] || ''}】${list.length} 条`)
    for (const m of list.slice(0, 12)) console.log('   - ' + m)
    if (list.length > 12) console.log(`   …还有 ${list.length - 12} 条`)
    console.log('')
  }
}
process.exit(fails.length ? 1 : 0)
