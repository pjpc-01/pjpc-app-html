// 验证财务报表新口径
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });

for (const [name, url] of [['财务报表', '/finance/reports'], ['财务概览', '/finance/overview']]) {
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:3001' + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  const text = (await page.innerText('body')).replace(/\n{2,}/g, '\n');
  console.log(`\n========== ${name} ==========`);
  // 只打印数据区(跳过导航)
  const cut = text.indexOf('在线');
  console.log(text.slice(cut > 0 ? cut + 2 : 0, (cut > 0 ? cut : 0) + 1800));
  await page.screenshot({ path: `/tmp/ux-audit/finance-${name}.png`, fullPage: false });
  await page.close();
}
console.log('\n截图: /tmp/ux-audit/finance-财务报表.png / finance-财务概览.png');
await browser.close();
