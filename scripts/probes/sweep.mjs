import { chromium } from 'playwright';
const PROXY='http://127.0.0.1:3001/api/pocketbase-proxy/api', SITE='http://127.0.0.1:3001';
const ROUTES=["/", "/activities", "/admin", "/attendance", "/card-management", "/center-management", "/claim-form", "/course-management", "/daily-logs", "/dashboard/slideshow", "/education", "/exam-targets", "/finance/bank", "/finance/budget", "/finance/debts", "/finance/expenses", "/finance/fees", "/finance/invoices", "/finance/overview", "/finance/payments", "/finance/payroll", "/finance/reports", "/finance/student-fees", "/grades", "/homework", "/inventory", "/pickup", "/points", "/points/leaderboard", "/points/rules", "/resource-library", "/settings", "/student-leave", "/student-management", "/student-reports", "/teacher-attendance-reports", "/teacher-management", "/teacher-performance", "/teacher-teaching-report", "/teacher-workspace", "/tv-board", "/user-management", "/attendance-reports", "/student-kiosk", "/parent/dashboard"];
const uid=(await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp=await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`,{method:'POST'})).json();
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1680,height:1100}});
await ctx.addInitScript(({t,m})=>{localStorage.setItem('pocketbase_auth',JSON.stringify({token:t,model:m}));localStorage.setItem('pjpc_language','en')},{t:imp.token,m:imp.record});
const page=await ctx.newPage();
const CJK=/[\u4e00-\u9fff]/;
let errs=0; page.on('pageerror',()=>errs++);
const rows=[];
for (const r of ROUTES) {
  try{
    await page.goto(SITE+r,{waitUntil:'domcontentloaded',timeout:25000});
    await page.waitForTimeout(4200);
    const o=await page.evaluate(()=>{const c=document.body.cloneNode(true);c.querySelectorAll('script,style,nav,aside,header').forEach(e=>e.remove());return (c.innerText||'')});
    const lines=[...new Set(o.split('\n').map(s=>s.trim()).filter(s=>s.length>1))];
    const zh=lines.filter(s=>CJK.test(s));
    rows.push([r,o.length,zh.length,zh.slice(0,4).join(' | ').slice(0,150)]);
  }catch(e){ rows.push([r,-1,-1,'ERROR '+e.message.slice(0,40)]); }
}
console.log('路由\t文本长度\t中文行\t样例');
for(const x of rows) console.log(x.join('\t'));
console.log('TOTAL_PAGEERR '+errs);
await b.close();
