// 验：考试目标总览 = 左栏 Form1 / 右栏 Form2+Form3
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'zh');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
await page.goto(SITE + '/exam-targets', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);
for (const sel of ['button:has-text("全班总览")', 'button:has-text("总览")']) { try { await page.locator(sel).first().click({ timeout: 4000 }); break; } catch {} }
await page.waitForTimeout(5000);
const r = await page.evaluate(() => {
  const lanes = [...document.querySelectorAll('div.flex-1.min-w-0')];
  return lanes.map((L, i) => {
    const txt = L.innerText;
    const grades = [...new Set(txt.match(/Form \d|Standard \d/g) || [])];
    const rows = L.querySelectorAll('.border-b').length;
    const rc = L.getBoundingClientRect();
    return { lane: i + 1, left: Math.round(rc.left), width: Math.round(rc.width), rows, grades };
  });
});
console.log('栏数 =', r.length);
r.forEach(x => console.log(`  第${x.lane}栏 left=${x.left} 宽=${x.width} 学生数≈${x.rows} 年级=${JSON.stringify(x.grades)}`));
// 检查是否被裁
const clip = await page.evaluate(() => {
  const lanes = [...document.querySelectorAll('div.flex-1.min-w-0')];
  return lanes.map((L, i) => {
    const sc = L.closest('div.flex-1.min-h-0') || L.parentElement;
    return sc && sc.scrollHeight > sc.clientHeight + 8 ? `第${i + 1}栏内容${sc.scrollHeight}px > 容器${sc.clientHeight}px (被裁)` : null;
  }).filter(Boolean);
});
console.log(clip.length ? '⚠️ ' + JSON.stringify(clip) : '✅ 没有被裁');
console.log('pageerror', errs.length);
await browser.close();
