// 最终验收：顶部栏/侧边栏中文 + 页面错误
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
const CJK = /[\u4e00-\u9fff]/;
let errs = [];
page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
for (const [url, tag] of [['/', '首页'], ['/attendance-reports', '考勤'], ['/teacher-teaching-report', '教学评估'], ['/points', '积分']]) {
  try {
    await page.goto(SITE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5500);
    const r = await page.evaluate(() => {
      const g = sel => { const e = document.querySelector(sel); if (!e) return ''; const c = e.cloneNode(true); c.querySelectorAll('script,style').forEach(x => x.remove()); return c.innerText || '' };
      const all = (() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style,nav,aside,header').forEach(x => x.remove()); return c.innerText || '' })();
      return { chrome: [g('nav'), g('aside'), g('header')].join('\n'), body: all };
    });
    const chromeZh = [...new Set(r.chrome.split('\n').map(s => s.trim()).filter(s => s && CJK.test(s)))];
    const bodyZh = [...new Set(r.body.split('\n').map(s => s.trim()).filter(s => s.length > 1 && CJK.test(s)))];
    console.log(`\n[${tag}] 顶栏/侧栏中文 ${chromeZh.length}: ${JSON.stringify(chromeZh.slice(0, 6))}`);
    console.log(`   正文中文 ${bodyZh.length}: ${JSON.stringify(bodyZh.slice(0, 10))}`);
  } catch (e) { console.log(`[${tag}] 出错 ${e.message.slice(0, 50)}`); }
}
console.log(`\npageerror 共 ${errs.length}: ${JSON.stringify([...new Set(errs)].slice(0, 3))}`);
await browser.close();
