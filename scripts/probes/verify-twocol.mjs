// 验：幻灯片里考试目标双栏一屏显示全部 24 人，不被裁、无翻页
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
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
await page.goto(SITE + '/dashboard/slideshow', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);

const r = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('div')].filter(d => ((d.className || '').toString()).includes('bg-card') && (d.innerText || '').includes('考试目标 · 全班总览'));
  if (!cards.length) return { found: false };
  const card = cards[0];
  const rows = card.querySelectorAll('div.grid.items-center');   // 每栏一个表头 + 每个学生一行
  const names = [...card.querySelectorAll('div.grid.items-center > div:first-child')].map(d => (d.innerText || '').trim()).filter(Boolean);
  const box = card.getBoundingClientRect();
  return {
    found: true,
    cardSize: `${Math.round(box.width)}x${Math.round(box.height)}`,
    clip: card.scrollHeight - card.clientHeight,
    studentRows: rows.length,
    laneHeaders: (card.innerText.match(/学生/g) || []).length,
    hasPageTag: /第\s*\d+\s*\/\s*\d+\s*页/.test(card.innerText),
    hasTurnHint: /每 \d+ 秒翻页/.test(card.innerText),
    sample: names.slice(0, 4),
    tail: names.slice(-3),
  };
});
console.log(JSON.stringify(r, null, 1));
console.log('console 报错:', errs.length ? errs.slice(0, 3) : '无 🟢');
await browser.close();
