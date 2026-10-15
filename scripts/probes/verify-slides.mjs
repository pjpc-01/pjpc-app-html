// 验：幻灯片里考试目标被拆成多张（每页一张），每张 10 人、不被裁
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
await page.goto(SITE + '/dashboard/slideshow', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);

const r = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('div')].filter(d => {
    const c = (d.className || '').toString();
    return c.includes('bg-card') && c.includes('overflow-hidden') && (d.innerText || '').includes('考试目标 · 全班总览');
  });
  return {
    slideCount: cards.length,
    cards: cards.map(c => {
      const rows = [...c.querySelectorAll('div.grid.items-center')].length - 1;
      const t = c.innerText || '';
      return {
        page: (t.match(/第\s*\d+\s*\/\s*\d+\s*页/) || ['(无)'])[0],
        rows,
        clip: c.scrollHeight - c.clientHeight,
        first: (t.split('\n').find(l => /^[\u4e00-\u9fa5A-Za-z]/.test(l) && l.length > 3) || '').slice(0, 24),
      };
    }),
  };
});
console.log('幻灯片里「考试目标」张数:', r.slideCount, '（24 人 / 每页 10 → 应为 3）');
r.cards.forEach((c, i) => console.log(`   第${i + 1}张: ${c.page} | ${c.rows} 行 | 被裁 ${c.clip}px | 首行「${c.first}」`));
console.log('console 报错:', errs.length ? errs.slice(0, 3) : '无 🟢');
await browser.close();
