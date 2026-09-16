
import { chromium } from 'playwright';
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid=(await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp=await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`,{method:'POST'})).json();
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1600,height:1100},locale:'zh-CN'});
await ctx.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}));},{t:imp.token,m:imp.record});
const pg=await ctx.newPage();
await pg.goto('http://127.0.0.1:3001/finance/reports',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(5000);
console.log('默认月份选择器值:', JSON.stringify(await pg.$$eval('input[type=month]',e=>e.map(x=>x.value))));
console.log('--- 默认(本月)概览 ---');
let t=await pg.evaluate(()=>document.body.innerText);
console.log(t.split('收支概览')[1]?.slice(0,420).replace(/\n{2,}/g,'\n'));
// 切到 8 月
await pg.fill('input[type=month]','2026-08');
await pg.dispatchEvent('input[type=month]','change');
await pg.waitForTimeout(2500);
console.log('\n=== 切到 2026-08 后 ===');
t=await pg.evaluate(()=>document.body.innerText);
console.log(t.split('收支概览')[1]?.slice(0,480).replace(/\n{2,}/g,'\n'));
await b.close();
