// 弹窗型列表页:打字 → 开条目 → 关 → 筛选还在不在
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const PATH = process.argv[2];

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 1500, height: 1100 }, locale: 'zh-CN' });
await c.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 100)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
p.on('dialog', d => d.accept());

await p.goto(`${SITE}${PATH}`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(4000);

const box = p.locator('input[placeholder*="搜索"]').first();
if (await box.count() === 0) { console.log('  ✗ 没有搜索框'); await b.close(); process.exit(0); }
console.log('  搜索框:', await box.getAttribute('placeholder'));

const rowsBefore = await p.locator('tbody tr').count();
await box.fill('林');
await p.waitForTimeout(1500);
const rowsFiltered = await p.locator('tbody tr').count();
console.log(`  列表行数: ${rowsBefore} → 输入「林」后 ${rowsFiltered}`, rowsFiltered < rowsBefore ? '(真的在过滤)' : '(⚠️ 没过滤)');
const v1 = await box.inputValue();

// 开一条:点第一行
const firstRow = p.locator('tbody tr').first();
let opened = false;
if (await firstRow.count() > 0) {
  const btns = firstRow.locator('button');
  const n = await btns.count();
  if (n > 0) { await btns.nth(0).click(); opened = true; }
  else { await firstRow.click(); opened = true; }
  await p.waitForTimeout(2500);
}
const dialogOpen = await p.locator('[role="dialog"]').count();
console.log('  开了弹窗:', dialogOpen > 0, '| 点了行:', opened);

// 关
await p.keyboard.press('Escape');
await p.waitForTimeout(600);
if (await p.locator('[role="dialog"]').count() > 0) {
  const closeBtn = p.locator('[role="dialog"] button:has-text("×")').first();
  if (await closeBtn.count()) await closeBtn.click().catch(() => {});
  else await p.locator('[role="dialog"] button').last().click().catch(() => {});
}
await p.waitForTimeout(2500);

const box2 = p.locator('input[placeholder*="搜索"]').first();
const v2 = await box2.count() ? await box2.inputValue() : '(搜索框没了)';
const rowsAfter = await p.locator('tbody tr').count();
console.log('  关掉后: 搜索值', JSON.stringify(v2), '| 行数', rowsAfter);
console.log('  → 结论:', v2 === v1 ? '保留 ✔' : '被清空 ✗');
console.log('  控制台错误:', errs.length ? errs.slice(0, 2).join(' | ') : '无');
await b.close();
