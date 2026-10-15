// 抓崩溃堆栈
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const REPORT = '/student-report/16xzs7zo53qy27x';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1100 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'zh');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.stack || e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await page.goto(SITE + REPORT, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);
console.log('打开报告后错误数:', errs.length);
errs.forEach((e, i) => console.log(`  [打开后${i + 1}] ${e.split('\n').slice(0, 4).join('\n      ')}`));
const before = errs.length;
for (const sel of ['button:has-text("格式")', 'button:has-text("Format")']) { try { await page.locator(sel).first().click({ timeout: 6000 }); break; } catch {} }
await page.waitForTimeout(5000);
console.log('\n点格式后新增错误:', errs.length - before);
errs.slice(before).forEach((e, i) => console.log(`  [格式${i + 1}] ${e.split('\n').slice(0, 6).join('\n      ')}`));
console.log('\n页面是否崩溃:', /Application error/.test(await page.evaluate(() => document.body.innerText)));
await browser.close();
