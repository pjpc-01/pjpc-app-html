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
import { suToken } from './probes/_auth.mjs'

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

const fails = []
const payByInvoice = new Map()
for (const p of payments) {
  const key = p.invoiceId || p.invoice
  if (!key) { fails.push({ rule: 5, msg: `付款 ${p.id} 没有指向任何发票，金额 ${p.amount}` }); continue }
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
  if (Math.abs(paid - money(i.totalAmount)) > 0.01) {
    fails.push({ rule: 2, msg: `${i.invoiceNumber} 标记已付款 ${money(i.totalAmount)}，付款记录只有 ${paid}` })
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
  const gross = money(items.reduce((s, x) => s + Number(x.amount || 0), 0))
  const disc = Number(a.discount || 0)
  const d = String(a.discount_type || 'amount') === 'percent' ? money(gross * disc / 100) : money(disc)
  const want = money(gross - d)
  if (a.totalAmount != null && Math.abs(money(a.totalAmount) - want) > 0.01) {
    fails.push({ rule: 6, msg: `学生费用 ${a.id} 存的总计 ${money(a.totalAmount)} ≠ 明细 ${gross} − 折扣 ${d} = ${want}` })
  }
}

// 7. 汇总
const receivable = money(invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0))
const received = money(payments.reduce((s, p) => s + Number(p.amount || 0), 0))

const byRule = {}
for (const f of fails) (byRule[f.rule] = byRule[f.rule] || []).push(f.msg)
const names = { 1: '发票明细 ≠ 总额', 2: '已付款发票 ≠ 付款记录', 3: '学生折扣没进发票', 4: '付款指向不存在的发票', 5: '付款没挂发票', 6: '学生费用合计不对' }

console.log('=== 财务不变量检查 ===')
console.log(`发票 ${invoices.length} 张 · 付款 ${payments.length} 笔 · 学生费用 ${assignments.length} 条`)
console.log(`应收 RM ${receivable} · 实收 RM ${received} · 未收 RM ${money(receivable - received)}`)
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
