// 验②：在中学报告的「格式」里加科目 → PATCH 是否打到「PU 中学」预设(9jqv9djmwlhgzc1)
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const REPORT = '/student-report/16xzs7zo53qy27x';   // Form 1 学生的报告
const MID_PRESET = '9jqv9djmwlhgzc1';               // 「PU 中学」
const PRIMARY_PRESET = '66k0wi8bul5tb4h';           // 「BT.14」
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
const patches = [];
page.on('request', r => { if (r.method() === 'PATCH' && /report_settings/.test(r.url())) patches.push({ url: r.url().split('/records/')[1]?.slice(0, 20), body: (r.postData() || '').slice(0, 120) }); });
await page.goto(SITE + REPORT, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);
// 点「格式」
let ok = false;
for (const sel of ['button:has-text("格式")', 'button:has-text("Format")']) { try { await page.locator(sel).first().click({ timeout: 6000 }); ok = true; break; } catch {} }
console.log('点格式:', ok);
await page.waitForTimeout(4000);
// 找「添加科目...」输入框并输入 + Enter
const typed = await page.evaluate(() => {
  const inp = [...document.querySelectorAll('input')].find(i => /添加科目/.test(i.placeholder || ''));
  if (!inp) return 'no-input';
  inp.focus();
  return 'found:' + inp.placeholder;
});
console.log('输入框:', typed);
if (typed.startsWith('found')) {
  await page.locator('input[placeholder*="添加科目"]').first().fill('测试科目ZZZ');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3500);
}
console.log('PATCH 请求:', JSON.stringify(patches, null, 1));
if (patches.length) {
  const id = patches[0].url;
  console.log(id === MID_PRESET ? '✅ 打到了「PU 中学」预设 ✓' : (id === PRIMARY_PRESET ? '❌ 还是打到「BT.14 小学」✗' : '❓ 打到: ' + id));
}
// 清理：把刚加的测试科目删掉（点它的 ×）
const removed = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].filter(b => (b.textContent || '').trim() === '×');
  for (const b of btns) {
    const row = b.closest('div');
    if (row && /测试科目ZZZ/.test(row.textContent || '')) { b.click(); return true; }
  }
  return false;
});
await page.waitForTimeout(3500);
console.log('清理测试科目:', removed);
console.log('全部 PATCH:', JSON.stringify(patches.map(p => p.url)));
console.log('pageerror', errs.length);
await browser.close();
