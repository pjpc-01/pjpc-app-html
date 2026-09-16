
import { chromium } from 'playwright';
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid=(await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp=await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`,{method:'POST'})).json();
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1600,height:900},locale:'zh-CN'});
await ctx.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}));},{t:imp.token,m:imp.record});
const pg=await ctx.newPage();
await pg.goto('http://127.0.0.1:3001/finance/invoices',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(5000);
const heads=await pg.$$eval('th',els=>els.map(e=>e.textContent.trim()).filter(Boolean));
console.log('表头:',JSON.stringify(heads));
const rows=await pg.$$eval('tbody tr',trs=>trs.slice(0,6).map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim())));
console.log('前几行:');
rows.forEach(r=>console.log('  ',JSON.stringify(r)));
await b.close();
