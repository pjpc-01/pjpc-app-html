
import { chromium } from 'playwright';
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid=(await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp=await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`,{method:'POST'})).json();
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1600,height:1100},locale:'zh-CN'});
await ctx.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}));},{t:imp.token,m:imp.record});
const pg=await ctx.newPage();
await pg.goto('http://127.0.0.1:3001/finance/reports',{waitUntil:'networkidle'});
await pg.waitForTimeout(4000);
const els=await pg.evaluate(()=>[...document.querySelectorAll('input,select,button')].slice(0,40).map(e=>({tag:e.tagName,type:e.type||'',id:e.id||'',text:(e.textContent||'').trim().slice(0,20)})));
console.log('表单元素:'); els.forEach(e=>console.log('  ',JSON.stringify(e)));
console.log('\n含"选择月份"的文本片段:');
const t=await pg.evaluate(()=>document.body.innerText);
const i=t.indexOf('选择月份');
console.log(JSON.stringify(t.slice(i-80, i+200)));
await b.close();
