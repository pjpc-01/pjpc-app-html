
import { chromium } from 'playwright';
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid=(await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp=await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`,{method:'POST'})).json();
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1600,height:1100},locale:'zh-CN'});
await ctx.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}));},{t:imp.token,m:imp.record});
const pg=await ctx.newPage();
await pg.goto('http://127.0.0.1:3001/finance/reports',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(6000);
const els=await pg.evaluate(()=>[...document.querySelectorAll('input,select')].map(e=>({tag:e.tagName,type:e.type||'',id:e.id||'',val:e.value||''})));
console.log('表单元素:'); els.forEach(e=>console.log('  ',JSON.stringify(e)));
const t=await pg.evaluate(()=>document.body.innerText);
const i=t.indexOf('选择月份');
console.log('\n"选择月份"附近:', JSON.stringify(t.slice(Math.max(0,i-40), i+220)));
const j=t.indexOf('收支概览');
console.log('\n概览:', JSON.stringify(t.slice(j, j+400)));
await b.close();
