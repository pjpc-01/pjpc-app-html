
import { chromium } from 'playwright';
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid=(await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp=await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`,{method:'POST'})).json();
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1600,height:1100},locale:'zh-CN'});
await ctx.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}));},{t:imp.token,m:imp.record});
const pg=await ctx.newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await pg.goto('http://127.0.0.1:3001/finance/reports',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(5500);
console.log('页面错误:', errs.length? errs : '无 ✅');
const txt=await pg.evaluate(()=>document.body.innerText);
console.log('--- 页面文本(前1800字)---');
console.log(txt.replace(/\n{2,}/g,'\n').slice(0,1800));
const inp=await pg.$$eval('input[type=month]',els=>els.map(e=>e.value));
console.log('\n月份选择器:', JSON.stringify(inp));
await b.close();
