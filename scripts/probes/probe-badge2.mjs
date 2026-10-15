// 立刻读右上角徽章 x/y（3 秒后会被自动隐藏）—— 这是幻灯片总张数，最权威
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
await page.goto(SITE + '/dashboard/slideshow', { waitUntil: 'domcontentloaded' });

for (const wait of [3500, 4000, 4000, 4000]) {
  await page.waitForTimeout(wait);
  await page.mouse.move(900, 500);        // 唤醒标题栏
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const badge = all.map(e => (e.children.length === 0 ? (e.textContent || '').trim() : '')).find(t => /^\d+\s*\/\s*\d+$/.test(t));
    const titleEl = all.find(e => e.children.length === 0 && /积分排行|考试目标|本月生日|活动预告|公告/.test(e.textContent || ''));
    const inner = [...document.querySelectorAll('div')].filter(d => (d.className || '').toString().includes('bg-card') && (d.innerText || '').includes('考试目标 · 全班总览'));
    const hint = (inner[0]?.innerText || '').split('\n').find(l => l.includes('秒')) || '(无翻页提示)';
    const tag = (inner[0]?.innerText || '').match(/第\s*\d+\s*\/\s*\d+\s*页/);
    return { badge: badge || '(读取中)', title: (titleEl?.textContent || '').slice(0, 12), hint, tag: tag ? tag[0] : '(无)' };
  });
  console.log(`t≈${wait}ms:  徽章=${r.badge}  当前widget=${r.title}  考试目标提示=${r.hint}  ${r.tag}`);
}
await browser.close();
