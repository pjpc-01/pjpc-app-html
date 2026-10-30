import { SITE, ADMIN_LOGIN_PASS } from './_auth.mjs'
import { chromium } from 'playwright'
import { suToken } from './_auth.mjs'

const PB='http://127.0.0.1:8090'
const su=await suToken()
const H={Authorization:su}
const q=async(p)=>{const r=await fetch(PB+p,{headers:H});return r.ok?r.json():{items:[],totalItems:0}}

// ── DB 真值（与 useFinancialStats 同口径）──
const all = async (coll, filter='') => {
  let page=1, items=[]
  for(;;){
    const d = await q(`/api/collections/${coll}/records?perPage=500&page=${page}${filter?`&filter=${encodeURIComponent(filter)}`:''}`)
    items = items.concat(d.items||[])
    if(!d.items || d.items.length<500) break
    page++
  }
  return items
}
const pay = await all('payments','deleted=false')
const inv = await all('invoices','deleted=false')
const ref = await all('refunds','deleted=false')
const exp = await all('expenses')
const sal = await all('teacher_salary_records','deleted=false')

const payOk = pay.filter(p=>!p.status || p.status==='completed')
const refOk = ref.filter(r=>!r.status || r.status==='completed')
const received = payOk.reduce((a,p)=>a+Number(p.amount||0),0) - refOk.reduce((a,r)=>a+Number(r.amount||0),0)
const receivable = inv.reduce((a,i)=>a+Number(i.totalAmount ?? i.total_amount ?? 0),0)
const unpaidInvoices = inv.filter(i=>['issued','pending','unpaid'].includes(String(i.status)))
const unpaidAmt = unpaidInvoices.reduce((a,i)=>a+Number(i.totalAmount ?? i.total_amount ?? 0),0)
const expTotal = exp.reduce((a,e)=>a+Number(e.amount||0),0)
const salNet = sal.reduce((a,s)=>a+Number(s.net_salary||0),0)
const salCost = sal.reduce((a,s)=>a+Number(s.net_salary||0)+Number(s.epf_employer||0)+Number(s.socso_employer||0)+Number(s.eis_employer||0),0)
console.log('=== DB 真值 ===')
console.log(`收款 ${pay.length} 笔 实收净 ${received.toFixed(2)} | 退款 ${refOk.length} 笔`)
console.log(`发票 ${inv.length} 张 应收 ${receivable.toFixed(2)} | 未缴 ${unpaidInvoices.length} 张 金额 ${unpaidAmt.toFixed(2)}`)
console.log(`支出 ${exp.length} 笔 合计 ${expTotal.toFixed(2)}`)
console.log(`薪资有效 ${sal.length} 条 净发 ${salNet.toFixed(2)} 计入成本 ${salCost.toFixed(2)}`)

// ── 页面健康 + 抓数 ──
const b = await chromium.launch({ headless:true, args:['--no-sandbox'] })
const c = await b.newContext({ viewport:{width:1500,height:1200}, locale:'zh-CN' })
const p = await c.newPage()
let bad=[], errs=[]
p.on('response', r=>{ if(r.url().includes('/api/') && r.status()>=400) bad.push(r.status()+' '+r.url().split('?')[0].replace(SITE,'')) })
p.on('pageerror', e=>errs.push(String(e).slice(0,90)))

await p.goto(SITE+'/login',{waitUntil:'networkidle'}).catch(()=>{})
await p.waitForTimeout(2500)
await p.fill('#login-email','admin@pjpc.com'); await p.fill('#login-password',ADMIN_LOGIN_PASS)
await p.locator('button[type="submit"]').first().click()
await p.waitForTimeout(9000)

const pages=[['财务概览','/finance/overview'],['收费管理','/finance/fees'],['学生费用','/finance/student-fees'],
['发票管理','/finance/invoices'],['付款和收据','/finance/payments'],['收据','/finance/receipts'],
['薪资管理','/finance/payroll'],['支出管理','/finance/expenses'],['银行对账','/finance/bank'],
['预算管理','/finance/budget'],['财务报表','/finance/reports'],['月度结账','/finance/monthly-closing'],
['债务管理','/finance/debts'],['库存管理','/inventory'],['报销单','/claim-form']]
const snaps={}
for (const [name,url] of pages){
  bad=[]; errs=[]
  await p.goto(SITE+url,{waitUntil:'networkidle'}).catch(()=>{})
  await p.waitForTimeout(2600)
  const txt=await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '))
  const stuck = txt.includes('加载中') && txt.length<220
  snaps[name]={txt, bad:[...new Set(bad)], errs:[...errs]}
  console.log(`${!stuck && bad.length===0 && errs.length===0 ? 'PASS':'FAIL'}  ${name}  ${url}  字數 ${txt.length} 失败请求 ${bad.length} JS错 ${errs.length}${stuck?' 卡加载':''}`)
  if(bad.length) console.log('    ', [...new Set(bad)].slice(0,4).join(' | '))
  if(errs.length) console.log('     JS:', errs.slice(0,2).join(' | '))
}
await b.close()

// ── 数字比对 ──
const grab=(name,re)=> { const m=(snaps[name]?.txt||'').match(re); return m? Number(m[1].replace(/,/g,'')):null }
const ov = snaps['财务概览']?.txt || ''
console.log('\n=== 财务概览显示的数字 ===')
for (const [label,re] of [
  ['月收入', /月收入 RM ([\d,]+\.?\d*)/],
  ['总收入', /总收入 RM ([\d,]+\.?\d*)/],
  ['本月净利润', /本月净利润 RM (-?[\d,]+\.?\d*)/],
  ['待处理支付', /待处理支付 (\d+)/],
  ['逾期支付', /逾期支付 (\d+)/],
]) { const v=grab('财务概览',re); console.log(' ', label, v) }

const invTxt = snaps['发票管理']?.txt || ''
console.log('\n=== 发票管理顶部 ===')
for (const [label,re] of [['开票总额',/开票总额 [^\d]*([\d,]+\.?\d*)/],['已收',/已收 [^\d]*([\d,]+\.?\d*)/],['未收',/未收 [^\d]*([\d,]+\.?\d*)/]]) {
  const v=(invTxt.match(re)||[])[1]; console.log(' ', label, v)
}

console.log('\n=== 校对（UI vs DB）===')
const ovTotal=grab('财务概览',/总收入 RM ([\d,]+\.?\d*)/)
console.log(` 总收入  UI ${ovTotal}  DB ${received.toFixed(2)}  ${ovTotal!==null && Math.abs(ovTotal-received)<2?'一致':'差 '+ (ovTotal!==null?(ovTotal-received).toFixed(2):'?')}`)
const invPaid=(invTxt.match(/已收 [^\d]*([\d,]+\.?\d*)/)||[])[1]
const invUnpaid=(invTxt.match(/未收 [^\d]*([\d,]+\.?\d*)/)||[])[1]
if (invPaid) console.log(` 已收   UI ${invPaid}  DB ${received.toFixed(2)}`)
if (invUnpaid) console.log(` 未收   UI ${invUnpaid}  DB ${(receivable-received).toFixed(2)}`)

const payTxt = snaps['付款和收据']?.txt || ''
const paySum=(payTxt.match(/总收款 [^\d]*([\d,]+\.?\d*)/)||[])[1] || (payTxt.match(/收款总额 [^\d]*([\d,]+\.?\d*)/)||[])[1]
if (paySum) console.log(` 收款页  UI ${paySum}  DB ${received.toFixed(2)}`)

const expTxt = snaps['支出管理']?.txt || ''
const expSum=(expTxt.match(/总支出 [^\d]*([\d,]+\.?\d*)/)||[])[1] || (expTxt.match(/支出总额 [^\d]*([\d,]+\.?\d*)/)||[])[1]
if (expSum) console.log(` 支出   UI ${expSum}  DB ${expTotal.toFixed(2)}`)

const salTxt = snaps['薪资管理']?.txt || ''
const salSum=(salTxt.match(/净发合计 [^\d]*([\d,]+\.?\d*)/)||[])[1] || (salTxt.match(/总净发 [^\d]*([\d,]+\.?\d*)/)||[])[1]
if (salSum) console.log(` 薪资   UI ${salSum}  DB ${salNet.toFixed(2)}`)
