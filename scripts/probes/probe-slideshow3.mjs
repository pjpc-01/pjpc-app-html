// 精确量：考试目标卡片(rounded-lg bg-card overflow-hidden) 是否裁内容
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
await page.waitForTimeout(7000);

const measure = async (tag) => {
  const r = await page.evaluate(() => {
    // 直接找「考试目标」那张卡片：class 含 bg-card 且内文含考试目标
    const cards = [...document.querySelectorAll('div')].filter(d => {
      const c = (d.className || '').toString();
      return c.includes('bg-card') && c.includes('overflow-hidden') && (d.innerText || '').includes('考试目标');
    });
    if (!cards.length) return { found: false };
    const card = cards[cards.length - 1] || cards[0];   // 最内层那张
    const cardH = Math.round(card.getBoundingClientRect().height);
    const rowCount = [...card.querySelectorAll('div.grid.items-center')].length - 1;
    const ind = (card.innerText || '').match(/第\s*\d+\s*\/\s*\d+\s*页/);
    // 卡片内所有文本行 + 最后一行是否在可视区内
    const lastName = [...card.querySelectorAll('div.grid.items-center')].slice(-1)[0];
    const lastBottom = lastName ? Math.round(lastName.getBoundingClientRect().bottom) : 0;
    const cardBottom = Math.round(card.getBoundingClientRect().bottom);
    return {
      found: true, cardH, rowCount, page: ind ? ind[0] : '(无)',
      clipPx: card.scrollHeight - card.clientHeight,     // >0 = 被裁
      lastRowVisible: lastBottom <= cardBottom + 1,
      cardBottomPx: cardBottom, lastRowBottomPx: lastBottom,
    };
  });
  console.log(`[${tag}]`, JSON.stringify(r));
};
await measure('刚打开');
await page.waitForTimeout(9000);
await measure('9 秒后（应换页）');
await browser.close();
