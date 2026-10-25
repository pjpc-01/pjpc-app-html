import { SITE } from './_auth.mjs'
import { chromium } from 'playwright'
const b = await chromium.launch({ headless:true, args:['--no-sandbox'] })
const c = await b.newContext({ viewport:{width:1500,height:1200}, locale:'zh-CN' })
const p = await c.newPage()
await p.goto(SITE+'/login',{waitUntil:'networkidle'}).catch(()=>{})
await p.waitForTimeout(2500)
await p.fill('#login-email','admin@pjpc.com'); await p.fill('#login-password','1234567890')
await p.locator('button[type="submit"]').first().click()
await p.waitForTimeout(9000)
for (const [n,u,from,to] of [
  ['发票管理','/finance/invoices',0,700],
  ['财务报表','/finance/reports',0,1200],
  ['薪资管理','/finance/payroll',0,700],
  ['月度结账','/finance/monthly-closing',0,900],
  ['付款和收据','/finance/payments',0,500],
]) {
  await p.goto(SITE+u,{waitUntil:'networkidle'}).catch(()=>{})
  await p.waitForTimeout(2600)
  const t = await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '))
  console.log('\n=== '+n+' ===\n'+t.slice(from,to))
}
await b.close()
