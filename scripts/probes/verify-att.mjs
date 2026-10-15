// 考勤页专项验收
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1050 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'en');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
let err = 0;
page.on('pageerror', e => { err++; console.log('❌ pageerror:', (e.stack || e.message).split('\n')[0]); });
await page.goto(SITE + '/attendance-reports', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
let txt = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove()); return c.innerText || ''; });
if (txt.length < 300) {
  await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  // 从侧栏点进考勤
  const link = page.locator('a:has-text("Attendance"), button:has-text("Attendance"), a[href*="attendance"]').first();
  try { await link.click({ timeout: 8000 }); await page.waitForTimeout(6000); } catch {}
  txt = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove()); return c.innerText || ''; });
}
const KEYS = ['姓名','身份','签到','签退','时长','状态','总人数','迟到','缺勤','管理员'];
console.log(`页面文本长度 ${txt.length} | pageerror ${err}`);
console.log('仍是中文的:', JSON.stringify(KEYS.filter(k => txt.includes(k))));
console.log('已翻成英文的:', JSON.stringify(['Name','Role','Check-in','Check-out','Duration','Status','Total','Late','Absent'].filter(k => txt.includes(k))));
await browser.close();
