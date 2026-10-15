// 抓崩溃堆栈
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1050 } });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'en');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('❌ PAGEERROR:', (e.stack || e.message).split('\n').slice(0, 6).join('\n')));
page.on('console', m => { if (m.type() === 'error') console.log('⚠️ CONSOLE:', m.text().slice(0, 300)); });
await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
await browser.close();
