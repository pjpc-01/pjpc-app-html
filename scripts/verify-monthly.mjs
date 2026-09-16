// 抓「支出分布」和「月度收支对比」两个区域的实际内容
import { chromium } from 'playwright';
import fs from 'fs';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:3001/finance/reports', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);

const full = await page.innerText('body');
const clean = full.replace(/\n{2,}/g, '\n');
const i1 = clean.indexOf('支出分布');
const i2 = clean.indexOf('月度收支对比');
console.log('=== 支出分布 区域 ===');
console.log(clean.slice(i1, i1 + 350));
console.log('\n=== 月度收支对比 区域 ===');
console.log(clean.slice(i2, i2 + 900));

// 展开/滚动截图月度表
if (i2 > 0) {
  const el = await page.locator('text=月度收支对比').first();
  await el.scrollIntoViewIfNeeded().catch(()=>{});
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/ux-audit/finance-monthly.png', fullPage: false });
  console.log('\n月度表截图: /tmp/ux-audit/finance-monthly.png');
}
await browser.close();
