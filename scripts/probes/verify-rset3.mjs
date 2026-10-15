// 点「内容模板」分页，看「添加科目」在不在
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const REPORT = '/student-report/16xzs7zo53qy27x';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1100 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'zh');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
await page.goto(SITE + REPORT, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);
await page.locator('button:has-text("格式")').first().click({ timeout: 6000 });
await page.waitForTimeout(4000);
for (const tab of ['内容模板', '样式 & 内容']) {
  try {
    await page.locator(`[role=dialog] button:has-text("${tab}")`).first().click({ timeout: 4000 });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => {
      const dlg = document.querySelector('[role=dialog]') || document.body;
      const add = dlg.querySelector('input[placeholder*="添加科目"]');
      const subjWords = (dlg.innerText.match(/[^\n]*(科目|华文|国文|科学)[^\n]*/g) || []).slice(0, 6);
      return { hasAdd: !!add, addPlaceholder: add?.placeholder || '', subjWords, heads: [...new Set([...dlg.querySelectorAll('h1,h2,h3,h4,[class*="font-semibold"]')].map(h => (h.textContent || '').trim()).filter(x => x && x.length < 30))].slice(0, 14) };
    });
    console.log(`[分页「${tab}」] 有"添加科目"输入框: ${r.hasAdd} ${r.addPlaceholder ? '| placeholder=' + r.addPlaceholder : ''}`);
    console.log(`   含科目字样: ${JSON.stringify(r.subjWords)}`);
    console.log(`   小标题: ${JSON.stringify(r.heads)}`);
  } catch (e) { console.log(`[分页「${tab}」] 点不到: ${String(e.message).split('\n')[0].slice(0, 80)}`); }
}
console.log('pageerror', errs.length);
await browser.close();
