// 全路由崩溃扫描（45 路由，内建）
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api', SITE = 'http://127.0.0.1:3001';
const ROUTES = ["/", "/activities", "/admin", "/attendance", "/card-management", "/center-management", "/claim-form", "/course-management", "/daily-logs", "/dashboard/slideshow", "/education", "/exam-targets", "/finance/bank", "/finance/budget", "/finance/debts", "/finance/expenses", "/finance/fees", "/finance/invoices", "/finance/overview", "/finance/payments", "/finance/payroll", "/finance/reports", "/finance/student-fees", "/grades", "/homework", "/inventory", "/pickup", "/points", "/points/leaderboard", "/points/rules", "/resource-library", "/settings", "/student-leave", "/student-management", "/student-reports", "/teacher-attendance-reports", "/teacher-management", "/teacher-performance", "/teacher-teaching-report", "/teacher-workspace", "/tv-board", "/user-management", "/attendance-reports", "/student-kiosk", "/parent/dashboard"];
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1100 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'zh');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const bad = [], ok = [];
for (const r of ROUTES) {
  const errs = [];
  const h = e => errs.push((e.stack || e.message).split('\n')[0].slice(0, 120));
  page.on('pageerror', h);
  try {
    await page.goto(SITE + r, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3600);
    const info = await page.evaluate(() => {
      const txt = document.body.innerText || '';
      return { len: txt.length, crashed: /Application error|client-side exception/i.test(txt) };
    });
    if (errs.length || info.crashed || info.len < 250) bad.push({ r, crashed: info.crashed, len: info.len, errs: [...new Set(errs)].slice(0, 2) });
    else ok.push(r);
  } catch (e) { bad.push({ r, crashed: true, len: 0, errs: ['NAV: ' + String(e.message).split('\n')[0].slice(0, 80)] }) }
  page.off('pageerror', h);
}
console.log(`✅ 正常 ${ok.length} 个`);
console.log(`❌ 有问题 ${bad.length} 个`);
for (const b of bad) console.log(`   ${b.r}  白屏=${b.crashed} 字数=${b.len}  ${JSON.stringify(b.errs)}`);
await browser.close();
