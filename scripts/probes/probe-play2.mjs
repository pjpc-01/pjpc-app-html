// 先按「播放」再采样 45 秒 —— 看放映顺序（是否考试目标占 3 张）
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
await page.waitForTimeout(5000);

// 唤醒 header 并找播放按钮
await page.mouse.move(960, 540); await page.waitForTimeout(600);
const btns = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => (b.innerText || b.getAttribute('aria-label') || b.title || '').trim()).filter(Boolean));
console.log('可见按钮:', JSON.stringify(btns.slice(0, 24)));
for (const label of ['播放', '开始', '►']) {
  const b = page.locator('button', { hasText: new RegExp(label) }).first();
  if (await b.count()) { await b.click().catch(() => {}); console.log('点了:', label); break; }
}
await page.waitForTimeout(1500);

const sample = () => page.evaluate(() => {
  // 取面积最大的 bg-card（当前展示的那张）
  const cards = [...document.querySelectorAll('div')].filter(d => ((d.className || '').toString()).includes('bg-card'));
  let best = null, bestA = 0;
  for (const c of cards) { const r = c.getBoundingClientRect(); const a = r.width * r.height; if (a > bestA) { bestA = a; best = c; } }
  const txt = (best?.innerText || '').replace(/\n+/g, ' | ');
  return { head: txt.slice(0, 34), examPage: (txt.match(/第\s*\d+\s*\/\s*\d+\s*页/) || [''])[0], hasHint: /每 \d+ 秒翻页/.test(txt) };
});
const seen = [];
for (let i = 0; i < 42; i++) {
  const r = await sample();
  const key = r.head.slice(0, 20) + r.examPage;
  if (!seen.length || seen[seen.length - 1] !== key) { seen.push(key); console.log(`t=${i}s  ${r.head}  ${r.examPage} ${r.hasHint ? '（内部翻页✗）' : '（固定页✓）'}`); }
  await page.waitForTimeout(1000);
}
await browser.close();
