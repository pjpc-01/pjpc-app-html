// 单页验证：家长管理页的"学生数"是否显示真实数字
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:3001/parent-management', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);
// 抓表格里前几行的 姓名 + 学生数
const rows = await page.evaluate(() => {
  const trs = [...document.querySelectorAll('tbody tr')].slice(0, 12);
  return trs.map(tr => {
    const tds = [...tr.querySelectorAll('td')].map(t => (t.innerText || '').trim());
    return tds.slice(0, 6);
  });
});
console.log('家长列表前 12 行 [姓名|关系|电话|Email|职业|学生数]:');
rows.forEach(r => console.log('  ', JSON.stringify(r)));
const text = await page.innerText('body');
const m = text.match(/家长列表\s*\((\d+)\)/);
console.log('\n家长总数显示:', m ? m[1] : '(未匹配)');
const nums = rows.map(r => parseInt(r[5] || '0')).filter(n => !isNaN(n));
console.log('这些行显示的学生数:', nums);
console.log('\n截图: /tmp/ux-audit/parents-after.png');
await page.screenshot({ path: '/tmp/ux-audit/parents-after.png', fullPage: false });
await browser.close();
