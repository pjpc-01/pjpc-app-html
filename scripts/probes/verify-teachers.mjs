// 教师列表页 + 筛选器验收
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1200 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'en');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
let errs = [];
page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
const CJK = /[\u4e00-\u9fff]/;
for (const url of ['/teacher-management', '/teachers-management', '/teacher-list']) {
  await page.goto(SITE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5500);
  const r = await page.evaluate(() => {
    const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove());
    return { len: (c.innerText || '').length, txt: c.innerText || '', opts: [...document.querySelectorAll('[role="option"],select option')].map(e => (e.textContent || '').trim()) };
  });
  if (r.len < 200) { console.log(`[${url}] 页面太短(${r.len})，换下一个`); continue; }
  const zh = [...new Set(r.txt.split('\n').map(s => s.trim()).filter(s => s.length > 1 && CJK.test(s)))];
  console.log(`\n[${url}] 文本 ${r.len} | 中文行 ${zh.length}`);
  console.log('  中文:', JSON.stringify(zh.slice(0, 12)));
  break;
}
console.log(`pageerror ${errs.length}: ${JSON.stringify([...new Set(errs)].slice(0, 2))}`);
await browser.close();
