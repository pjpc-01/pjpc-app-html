// dump 幻灯片主区域结构 + 确认 API 能取到人数
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const api = [];
page.on('response', async r => { if (r.url().includes('/api/exam-targets')) { try { const j = await r.json(); api.push(`${r.status()} 人数=${j?.data?.students?.length}`) } catch { api.push(r.status() + ' (body读取失败)') } } });
await page.goto(SITE + '/dashboard/slideshow', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);

// 页内自己取一次 API
const inPage = await page.evaluate(async () => {
  try { const r = await fetch('/api/exam-targets', { cache: 'no-store' }); const j = await r.json(); return { status: r.status, n: (j?.data?.students || []).length, ok: j?.success } }
  catch (e) { return { err: String(e) } }
});
console.log('页面里请求 /api/exam-targets:', JSON.stringify(inPage));
console.log('network 记录:', JSON.stringify(api));

const dump = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('div').forEach(d => {
    const c = (d.className || '').toString();
    if (c.includes('bg-card')) {
      const t = (d.innerText || '').replace(/\s+/g, ' ');
      out.push({ cls: c.slice(0, 70), w: Math.round(d.getBoundingClientRect().width), h: Math.round(d.getBoundingClientRect().height), head: t.slice(0, 55) });
    }
  });
  const texts = (document.body.innerText.match(/第\s*\d+\s*\/\s*\d+\s*页/g) || []);
  return { cards: out.slice(0, 20), pageTags: texts };
});
console.log('\nbg-card 元素:');
dump.cards.forEach(c => console.log(`   ${c.w}x${c.h}  ${c.cls}  「${c.head}」`));
console.log('\n页面上所有「第 x/y 页」:', JSON.stringify(dump.pageTags));
await browser.close();
