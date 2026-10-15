// 探查：中学报告「格式」弹窗里到底有什么（分页/按钮/输入框）
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
for (const sel of ['button:has-text("格式")', 'button:has-text("Format")']) { try { await page.locator(sel).first().click({ timeout: 6000 }); break; } catch {} }
await page.waitForTimeout(4500);

const dump = async (tag) => {
  const r = await page.evaluate(() => {
    const dlg = document.querySelector('[role=dialog]') || document.body;
    const tabs = [...dlg.querySelectorAll('[role=tab],button')].map(b => (b.textContent || '').trim()).filter(Boolean);
    const inps = [...dlg.querySelectorAll('input,textarea')].map(i => i.placeholder || i.name || i.type);
    const heads = [...dlg.querySelectorAll('h1,h2,h3,h4,[class*="font-semibold"]')].map(h => (h.textContent || '').trim()).filter(x => x.length < 30);
    const hasAdd = !!dlg.querySelector('input[placeholder*="添加科目"]');
    const hasSubjWord = /科目/.test(dlg.innerText || '');
    return { tabs: [...new Set(tabs)].slice(0, 40), inputs: [...new Set(inps)].slice(0, 25), heads: [...new Set(heads)].slice(0, 25), hasAdd, hasSubjWord, txt: (dlg.innerText || '').slice(0, 600) };
  });
  console.log(`\n=== ${tag} ===`);
  console.log('有"添加科目"输入框:', r.hasAdd, '| 弹窗内有"科目"字:', r.hasSubjWord);
  console.log('按钮/分页:', JSON.stringify(r.tabs));
  console.log('输入框:', JSON.stringify(r.inputs));
  console.log('小标题:', JSON.stringify(r.heads));
  console.log('正文前600字:', JSON.stringify(r.txt.slice(0, 600)));
  return r;
};
await dump('刚打开');
// 把所有可见的 tab/按钮点一遍，看有没有藏着「科目」
const names = await page.evaluate(() => {
  const dlg = document.querySelector('[role=dialog]') || document.body;
  return [...new Set([...dlg.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(x => x && x.length < 12))];
});
console.log('\n弹窗内所有按钮:', JSON.stringify(names));
for (const n of names) {
  try {
    await page.locator(`[role=dialog] button:has-text("${n}")`).first().click({ timeout: 2500 });
    await page.waitForTimeout(1600);
    const has = await page.evaluate(() => !!(document.querySelector('[role=dialog]') || document.body).querySelector('input[placeholder*="添加科目"]'));
    if (has) { console.log(`👉 点「${n}」后出现了「添加科目」输入框 ✓`); break; }
  } catch {}
}
console.log('pageerror', errs.length);
await browser.close();
