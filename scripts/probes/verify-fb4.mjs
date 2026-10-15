// 验 ④：失焦不再自动保存 + 出现「保存天数」按钮（不点保存，避免写数据）
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1150 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'zh');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
const writes = []; page.on('request', r => { if (r.method() !== 'GET' && /student_fees/.test(r.url())) writes.push(r.method() + ' ' + r.url().split('/api/')[1].slice(0, 60)); });

await page.goto(SITE + '/finance/student-fees', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);
// 展开所有卡片 + 找「按天」的费用输入框
await page.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (/展开|Expand/i.test(b.textContent || '')) b.click() }) });
await page.waitForTimeout(2500);
// 找 daily 的 number input（宽度 w-10 那种小天数字）
const box = await page.evaluate(() => {
  const ins = [...document.querySelectorAll('input[type=number].w-10')];
  if (!ins.length) return null;
  ins[0].scrollIntoView({ block: 'center' });
  return { count: ins.length };
});
console.log('找到按天输入框:', JSON.stringify(box));
if (!box) {
  // 没找到就尝试直接切到编辑模式
  for (const sel of ['button:has-text("编辑")']) { try { await page.locator(sel).first().click({ timeout: 5000 }); break; } catch {} }
  await page.waitForTimeout(3000);
  const c2 = await page.evaluate(() => [...document.querySelectorAll('input[type=number].w-10')].length);
  console.log('切编辑模式后再找:', c2);
}
const before = writes.length;
// 模拟：改值 → 失焦
const done = await page.evaluate(() => {
  const inp = document.querySelector('input[type=number].w-10');
  if (!inp) return 'no-input';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(inp, String((parseInt(inp.value) || 1) + 1));
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  inp.dispatchEvent(new Event('change', { bubbles: true }));
  inp.blur();
  return 'changed';
});
await page.waitForTimeout(4000);
console.log('操作:', done);
console.log(`失焦后的写请求: ${writes.length - before} 个 ${JSON.stringify(writes.slice(before))}`);
const btn = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(x => /保存天数|项天数未保存/.test(x)));
console.log('按钮/提示:', JSON.stringify(btn));
console.log('pageerror', errs.length, JSON.stringify([...new Set(errs)].slice(0, 2)));
await browser.close();
