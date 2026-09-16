
import { chromium } from 'playwright';
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid=(await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp=await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`,{method:'POST'})).json();
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1500,height:1200},locale:'zh-CN'});
await ctx.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}));},{t:imp.token,m:imp.record});
const pg=await ctx.newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await pg.goto('http://127.0.0.1:3001/finance/reports',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(6000);
console.log('页面错误:', errs.length?errs:'无 ✅');
const t=await pg.evaluate(()=>document.body.innerText);
const i=t.indexOf('资产负债概览');
console.log('--- 资产负债概览 ---');
console.log(t.slice(i, i+700).replace(/\n{2,}/g,'\n'));
// 银行对账页
await pg.goto('http://127.0.0.1:3001/finance/bank',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(5000);
const t2=await pg.evaluate(()=>document.body.innerText);
console.log('\n--- 银行对账页(前 400 字)---');
console.log(t2.replace(/\n{2,}/g,'\n').slice(0,400));
await b.close();
