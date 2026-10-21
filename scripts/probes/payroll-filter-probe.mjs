// 薪资页:筛选栏是否真的过滤 + 跳页/重载后是否保留
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 1500, height: 1200 }, locale: 'zh-CN' });
await c.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 110)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 110)); });
p.on('dialog', d => d.accept());

await p.goto(`${SITE}/finance/payroll`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(6000);

const combos = p.locator('button[role="combobox"]');
console.log('  下拉筛选控件数:', await combos.count(), '(应为 4:年份/月份/状态/教师)');
console.log('  当前值:', await combos.evaluateAll(bs => bs.map(b => b.innerText.trim()).join(' | ')));

const recRows = async () => {
  const tables = p.locator('table');
  const n = await tables.count();
  return n > 1 ? await tables.nth(n - 1).locator('tbody tr').count() : await p.locator('tbody tr').count();
};
const rows0 = await recRows();
console.log('  薪资记录行数(全部):', rows0);

// 打开「月份」下拉(第 2 个),选 8 月（8 月只有 14 条，便于看出变化）
await combos.nth(1).click();
await p.waitForTimeout(800);
await p.locator('[role="option"]:has-text("8 月")').first().click().catch(async () => {
  await p.locator('[role="option"]').nth(8).click().catch(() => {});
});
await p.waitForTimeout(3500);
const rows9 = await recRows();
console.log('  选 8 月后行数:', rows9, rows9 !== rows0 ? '(在过滤)' : '(⚠️没变化)');

// 跳走再回来
await p.goto(`${SITE}/finance/invoices`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(1500);
await p.goBack({ waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(5500);
const combos2 = p.locator('button[role="combobox"]');
const vals2 = await combos2.evaluateAll(bs => bs.map(b => b.innerText.trim()).join(' | '));
const rowsBack = await p.locator('tbody tr').count();
console.log('  回来后筛选值:', vals2);
console.log('  回来后行数:', rowsBack);
console.log('  → 保留:', vals2.includes("8 月") ? '是 ✔' : '否 ✗');
console.log('  控制台错误:', errs.length ? errs.slice(0, 2).join(' | ') : '无');
await b.close();
