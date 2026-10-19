// 复现用户场景:调天数 → 按「保存天数」→ 按「退出编辑（保存）」→ 看天数会不会被打回
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const SID = '78fu3kaa8gcd48k';
const FEEID = '6wtd021oxlob4ic';

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
async function dbQty() {
  const d = await (await fetch(`${PROXY}/collections/student_fees/records?perPage=1&filter=(student_id="${SID}")`, { headers: { Authorization: `Bearer ${imp.token}` } })).json();
  const raw = d.items?.[0]?.fee_items;
  const items = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
  return items.find(i => i.id === FEEID)?.quantity;
}
console.log('起点库里 =', await dbQty());

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const writes = [];
page.on('request', r => { if (['PATCH', 'POST'].includes(r.method()) && r.url().includes('student_fees')) writes.push(r.method() + ' ' + r.url().split('/').pop().slice(0, 20)); });

await page.goto(SITE + '/finance/student-fees', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(3000);
await page.locator('input[type="text"]').first().fill('罗兆俊').catch(() => {});
await page.waitForTimeout(2200);
await page.locator('button:has-text("编辑")').first().click().catch(() => {});
await page.waitForTimeout(1200);
for (const e of await page.$$('button.h-7.w-7')) { await e.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(600); }
await page.locator('text=Daycare').first().click().catch(() => {});
await page.waitForTimeout(1500);

const inp = page.locator('input[type="number"][min="1"]').last();
const plus = page.locator('button:has-text("+")').last();
console.log('起点显示 =', await inp.inputValue());

await plus.click(); await page.waitForTimeout(300);
await plus.click(); await page.waitForTimeout(1200);
const afterPlus = await inp.inputValue();
console.log('点 2 次 + 后显示 =', afterPlus);

// ① 按「保存天数」
const saveDays = page.locator('button:has-text("保存天数")').first();
if (await saveDays.count()) { await saveDays.click(); await page.waitForTimeout(3000); console.log('已按「保存天数」'); }
console.log('  按完后:显示 =', await inp.inputValue().catch(() => '(框没了)'), ' 库里 =', await dbQty());

// ② 按「退出编辑（保存）」
const exitBtn = page.locator('button:has-text("退出编辑")').first();
if (await exitBtn.count()) {
  await exitBtn.click(); await page.waitForTimeout(5000);
  console.log('已按「退出编辑（保存）」');
} else console.log('找不到退出编辑按钮');
console.log('  按完后:库里 =', await dbQty());

// ③ 重新进编辑态再看显示
await page.locator('button:has-text("编辑")').first().click().catch(() => {});
await page.waitForTimeout(1500);
for (const e of await page.$$('button.h-7.w-7')) { await e.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(600); }
await page.locator('text=Daycare').first().click().catch(() => {});
await page.waitForTimeout(1500);
const finalShown = await page.locator('input[type="number"][min="1"]').last().inputValue().catch(() => '?');
console.log('  重新展开后显示 =', finalShown);
console.log('\n写请求:', writes.length ? [...new Set(writes)].join(', ') : '无');
console.log(finalShown === afterPlus ? '\n★ 稳住了:天数没被打回' : `\n✗ 被打回了:${afterPlus} → ${finalShown}(这就是你的症状)`);
await browser.close();
