// 验 C：PageLayout 返回按钮现在是"真返回"还是"弹回首页"
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
const path = u => u.replace(SITE, '').split('?')[0];
// 测试：先从别的页进到带返回按钮的页，再点返回箭头，看回到哪
const CASES = [
  ['/education', '/student-management'],
  ['/education', '/homework'],
  ['/finance/overview', '/points'],
  ['/settings', '/student-leave'],
];
for (const [from, to] of CASES) {
  await page.goto(SITE + from, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(2500);
  await page.goto(SITE + to, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(3500);
  const arrow = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => {
      const svg = x.querySelector('svg');
      return svg && /arrow-left/.test(svg.getAttribute('class') || '') && !(x.innerText || '').trim();
    });
    if (!b) return null;
    b.setAttribute('data-back', '1');
    return true;
  });
  if (!arrow) { console.log(`${to}: 找不到返回箭头 ✗`); continue; }
  await page.locator('button[data-back="1"]').first().click({ timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const landed = path(page.url());
  const want = path(from);
  console.log(`${to}  ←从${from}进 → 点返回落在: ${landed}  ${landed === want ? '✔ 正确返回来源页' : (landed === '/' ? '✘ 还是弹回首页' : '△ 落在 ' + landed)}`);
}
await browser.close();
