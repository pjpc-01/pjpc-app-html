
import { chromium } from 'playwright';
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid=(await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp=await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`,{method:'POST'})).json();
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1600,height:1100},locale:'zh-CN'});
await ctx.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}));},{t:imp.token,m:imp.record});
const pg=await ctx.newPage();
pg.on('pageerror',e=>console.log('PAGEERROR:', String(e.stack||e).split('\n').slice(0,4).join(' | ')));
pg.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE:', m.text().slice(0,220)); });
await pg.goto('http://127.0.0.1:3001/finance/reports',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(6000);
await b.close();
