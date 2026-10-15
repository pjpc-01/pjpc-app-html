// 只看两个东西：①页面自己有没有请求 /api/exam-targets ②右上角「x/y」总页数（有拆分应>3）
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const hits = [];
page.on('response', r => { if (r.url().includes('/api/exam-targets')) hits.push(r.status() + ' ' + r.url().slice(-40)) });
await page.goto(SITE + '/dashboard/slideshow', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);

const r = await page.evaluate(() => {
  const badge = [...document.querySelectorAll('div,span')].map(e => (e.textContent || '').trim()).filter(t => /^\d+\s*\/\s*\d+$/.test(t));
  const body = document.body.innerText || '';
  return { badge: badge.slice(0, 5), has8s: body.includes('每 8 秒翻页'), pageTag: (body.match(/第\s*\d+\s*\/\s*\d+\s*页/g) || []) };
});
console.log('组件自己的请求次数:', hits.length, JSON.stringify(hits));
console.log('右上角页码徽章 x/y:', JSON.stringify(r.badge));
console.log('还写着「每 8 秒翻页」吗:', r.has8s);
console.log('页内「第 x/y 页」:', JSON.stringify(r.pageTag));
await browser.close();
