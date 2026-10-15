// 每秒采样屏幕中央可见的那张幻灯片，连续 45 秒 —— 看放映顺序
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
await page.waitForTimeout(6000);

const sample = () => page.evaluate(() => {
  const el = document.elementFromPoint(960, 540);
  let card = el, hops = 0;
  while (card && hops < 12) {
    if (((card.className || '').toString()).includes('bg-card')) break;
    card = card.parentElement; hops++;
  }
  const box = card?.getBoundingClientRect();
  const txt = (card?.innerText || '').replace(/\n+/g, ' | ');
  return {
    size: box ? `${Math.round(box.width)}x${Math.round(box.height)}` : '-',
    head: txt.slice(0, 40),
    examPage: (txt.match(/第\s*\d+\s*\/\s*\d+\s*页/) || [''])[0],
    hasHint: /每 \d+ 秒翻页/.test(txt),
    rows: [...(card?.querySelectorAll('div.grid.items-center') || [])].length - 1,
  };
});

const seen = [];
for (let i = 0; i < 45; i++) {
  const r = await sample();
  const key = `${r.head.slice(0, 22)}|${r.examPage}|${r.hasHint}`;
  if (!seen.length || seen[seen.length - 1] !== key) {
    seen.push(key);
    console.log(`t=${i + 6}s  [${r.size}] ${r.head}  ${r.examPage} ${r.hasHint ? '（内部翻页中）' : '（固定页 ✓）'} 行=${r.rows}`);
  }
  await page.waitForTimeout(1000);
}
await browser.close();
