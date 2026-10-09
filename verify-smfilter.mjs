// 专验: /student-management 筛选是否还丢（开 item → 关掉 → 看筛选）
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api', SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const rowCount = () => page.evaluate(() => document.querySelectorAll('table tbody tr').length);
const readSearch = async () => { try { return await page.getByPlaceholder(/搜索/).first().inputValue() } catch { return null } }
await page.goto(SITE + '/student-management', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);
console.log('行数(初始):', await rowCount());

// 输入筛选（用 Playwright 真实输入，确保 React 收到事件）
const inp = page.getByPlaceholder(/搜索/).first();
if (!(await inp.count())) { console.log('❌ 找不到搜索框'); await browser.close(); process.exit(0); }
await inp.fill('a');
await page.waitForTimeout(2500);
console.log('输入后搜索框值:', await readSearch(), '| 行数:', await rowCount());

// 开一个 item（点第一行）
await page.evaluate(() => { const tr = document.querySelector('table tbody tr'); if (tr) tr.setAttribute('data-p', '1'); });
await page.locator('tr[data-p="1"]').first().click({ timeout: 8000 }).catch(() => {});
await page.waitForTimeout(3500);
const dialog = await page.evaluate(() => !!document.querySelector('[role=dialog]'));
console.log('点了第一行 → 弹窗出现?', dialog, '| 当前路径:', page.url().replace(SITE, ''));

// 关掉
await page.keyboard.press('Escape');
await page.waitForTimeout(1200);
if (await page.evaluate(() => !!document.querySelector('[role=dialog]'))) {
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /关闭|取消|Close|Cancel/.test(x.innerText || '')); b?.click(); });
  await page.waitForTimeout(1500);
}
const finalVal = await readSearch();
console.log('关掉后搜索框值:', finalVal, '| 行数:', await rowCount());
console.log(finalVal === 'a' ? '✅ 筛选保留了' : '❌ 筛选被清空/丢了');
await browser.close();
