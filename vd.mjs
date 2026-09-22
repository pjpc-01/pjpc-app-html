import { chromium } from 'playwright'
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy'
const uid=(await (await fetch(PROXY+'/api/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22')).json()).items[0].id
const imp=await (await fetch(PROXY+'/api/collections/users/impersonate/'+uid,{method:'POST'})).json()
const b=await chromium.launch({headless:true,args:['--no-sandbox']})
const c=await b.newContext({viewport:{width:1700,height:1000},locale:'zh-CN'})
await c.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}))},{t:imp.token,m:imp.record})
const pg=await c.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,130)))
await pg.goto('http://127.0.0.1:3001/finance/payments',{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(12000)
// 侧边栏
await pg.evaluate(()=>{const t=[...document.querySelectorAll('button,a')].find(x=>x.textContent.trim()==='财务');t&&t.click()})
await pg.waitForTimeout(1500)
const side=await pg.evaluate(()=>[...new Set([...document.querySelectorAll('a[href^="/finance"]')].map(a=>a.textContent.trim()).filter(Boolean))])
console.log('① 侧边栏财务菜单:', JSON.stringify(side))
console.log('   「收据管理」还在:', side.includes('收据管理')?'❌ 还在':'✅ 已移除')
// 收据列 + 统计
const pg1=await pg.evaluate(()=>{
  const t=document.body.innerText
  return {表头:[...document.querySelectorAll('thead th')].map(x=>x.textContent.trim()),
    统计:(t.match(/总收据数[\s\S]{0,30}/)||[''])[0].replace(/\n/g,' '),
    有管理类别:!![...document.querySelectorAll('button')].find(x=>x.textContent.includes('管理类别'))}
})
console.log('② 付款页表头:', JSON.stringify(pg1.表头))
console.log('   收据统计:', JSON.stringify(pg1.统计))
// 搜索收据号
const searchRes=await pg.evaluate(async()=>{
  const inp=[...document.querySelectorAll('input')].find(i=>(i.placeholder||'').includes('收据号'))
  if(!inp) return 'NO_INPUT'
  const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set
  set.call(inp,'RCP-2026-121'); inp.dispatchEvent(new Event('input',{bubbles:true}))
  await new Promise(r=>setTimeout(r,2500))
  return {行数:document.querySelectorAll('tbody tr').length, 内容:[...document.querySelectorAll('tbody tr')].map(r=>r.innerText.replace(/\n/g,' | ').slice(0,70))}
})
console.log('③ 搜「RCP-2026-121」:', JSON.stringify(searchRes))
// 旧路由重定向
await pg.goto('http://127.0.0.1:3001/finance/receipts',{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(6000)
console.log('④ 访问 /finance/receipts →', pg.url().replace('http://127.0.0.1:3001',''))
console.log('\n错误:', errs.length?errs:'无 ✅')
await b.close()
