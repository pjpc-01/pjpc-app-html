// 用「下一张」箭头逐张翻，看考试目标出现几次、提示是什么
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

const clickNext = async () => {
  const ok = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const next = btns.find(b => (b.innerHTML || '').includes('chevron-right')) ||
                 btns.find(b => (b.getAttribute('aria-label') || '').toLowerCase().includes('next'));
    if (next) { next.click(); return true }
    return false;
  });
  await page.waitForTimeout(2200);
  return ok;
};
const read = () => page.evaluate(() => {
  const cards = [...document.querySelectorAll('div')].filter(d => ((d.className || '').toString()).includes('bg-card'));
  let best = null, bestA = 0;
  for (const c of cards) { const r = c.getBoundingClientRect(); const a = r.width * r.height; if (a > bestA) { bestA = a; best = c } }
  const txt = (best?.innerText || '').replace(/\n+/g, ' | ');
  const rows = [...(best?.querySelectorAll('div.grid.items-center') || [])].length - 1;
  return { head: txt.slice(0, 30), tag: (txt.match(/第\s*\d+\s*\/\s*\d+\s*页/) || [''])[0], hint: /每 \d+ 秒翻页/.test(txt), clip: best ? best.scrollHeight - best.clientHeight : -1, rows };
});

console.log('箭头存在:', await page.evaluate(() => [...document.querySelectorAll('button')].some(b => (b.innerHTML || '').includes('chevron-right'))));
for (let i = 1; i <= 6; i++) {
  const clicked = await clickNext();
  const r = await read();
  console.log(`第${i}次下一张 (${clicked ? 'ok' : '没箭头'}): ${r.head}  ${r.tag} ${r.hint ? '内部翻页✗' : '固定页✓'} 行=${r.rows} 裁=${r.clip}`);
}
await browser.close();
