// 验 ①③ 中学报告编辑门禁 + ④ 安亲天数保存方式
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
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
const writes = []; page.on('request', r => { const u = r.url(); if (r.method() !== 'GET' && /student_report|daily_log|fee|report/i.test(u)) writes.push(`${r.method()} ${u.replace(SITE, '').slice(0, 90)}`); });

const state = async () => page.evaluate(() => {
  const q = s => [...document.querySelectorAll(s)];
  const inputs = q('input:not([type=hidden]),textarea');
  return {
    inputs: inputs.length,
    enabledInputs: inputs.filter(e => !e.disabled && !e.readOnly).length,
    readOnlyInputs: inputs.filter(e => e.readOnly || e.disabled).length,
    buttons: [...new Set(q('button').map(b => (b.textContent || '').trim()).filter(Boolean))].slice(0, 30),
    zhHint: (document.body.innerText.match(/[^\n]*(只读|不可编辑|无法编辑|查看模式|不能编辑)[^\n]*/g) || []).slice(0, 4),
    txtLen: document.body.innerText.length,
  };
});

// ── ①③ 学生报告：挑一个中学(Form)学生开报告
await page.goto(SITE + '/student-reports', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
let s = await state();
console.log('[报告列表]', JSON.stringify({ txtLen: s.txtLen, buttons: s.buttons.slice(0, 12) }));
// 点「新建报告」
for (const sel of ['button:has-text("新建报告")', 'button:has-text("新建")']) { try { await page.locator(sel).first().click({ timeout: 5000 }); break; } catch {} }
await page.waitForTimeout(4000);
s = await state();
console.log('[选学生弹窗]', JSON.stringify({ inputs: s.inputs, buttons: s.buttons.slice(0, 12) }));
// 在弹窗里找 Form 1 学生行
const formRow = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('tr')];
  const i = rows.findIndex(r => /Form 1/.test(r.innerText));
  if (i < 0) return null;
  rows[i].querySelector('button')?.click();
  return rows[i].innerText.replace(/\n/g, ' ').slice(0, 80);
});
await page.waitForTimeout(6000);
s = await state();
console.log('[点了中学学生]', JSON.stringify(formRow));
console.log('[报告编辑器]', JSON.stringify({ txtLen: s.txtLen, inputs: s.inputs, enabled: s.enabledInputs, readonly: s.readOnlyInputs, zhHint: s.zhHint, buttons: s.buttons.slice(0, 14) }));
console.log('[编辑器URL]', page.url().replace(SITE, ''));
const writeCount1 = writes.length;

// ── ④ 学生费用 安亲浏览
await page.goto(SITE + '/finance/student-fees', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
s = await state();
console.log('\n[学生费用]', JSON.stringify({ txtLen: s.txtLen, buttons: s.buttons.slice(0, 16) }));
const tabs = await page.evaluate(() => [...new Set([...document.querySelectorAll('[role=tab],button')].map(b => (b.textContent || '').trim()))].filter(x => /安亲|Daycare|天数|按天|浏览/.test(x)));
console.log('[安亲相关入口]', JSON.stringify(tabs));
console.log(`\n落地前写请求 ${writeCount1} → 现在 ${writes.length}`);
console.log('写请求明细:', JSON.stringify([...new Set(writes)].slice(0, 10)));
console.log('pageerror', errs.length, JSON.stringify([...new Set(errs)].slice(0, 2)));
await browser.close();
