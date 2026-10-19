// 验证「自动保存」:只调天数,绝不按保存按钮,看库里会不会自己变
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const SID = process.argv[2] || '78fu3kaa8gcd48k';
const FEEID = process.argv[3] || '6wtd021oxlob4ic';

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

async function dbQty() {
  const d = await (await fetch(`${PROXY}/collections/student_fees/records?perPage=1&filter=(student_id="${SID}")`, { headers: { Authorization: `Bearer ${imp.token}` } })).json();
  const raw = d.items?.[0]?.fee_items;
  const items = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
  return items.find(i => i.id === FEEID)?.quantity;
}
const before = await dbQty();
console.log('库里初始 =', before);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const patches = [];
page.on('request', r => { if (r.method() === 'PATCH' || r.method() === 'POST') patches.push(r.method() + ' ' + r.url().split('/').pop().slice(0, 20)); });

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

// 只点 + 号,绝不碰「保存天数」
await plus.click(); await page.waitForTimeout(400);
await plus.click(); await page.waitForTimeout(400);
await plus.click(); await page.waitForTimeout(400);
const afterClicks = await inp.inputValue();
console.log('点 3 次 + 后显示 =', afterClicks);
console.log('（注意:全程没有按任何保存按钮,现在等 4 秒看它自己存不存）');
await page.waitForTimeout(4000);

const after = await dbQty();
console.log('\n库里现在 =', after, '  (起点', before, ')');
console.log(after === Number(afterClicks) ? '★ 自动保存成功:没按按钮也存住了' : '✗ 没自动存(仍是 ' + after + ')');
console.log('发出的写请求:', patches.length ? [...new Set(patches)].join(', ') : '无');

// 再重开页面确认画面一致
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(3000);
await page.locator('input[type="text"]').first().fill('罗兆俊').catch(() => {});
await page.waitForTimeout(2200);
await page.locator('button:has-text("编辑")').first().click().catch(() => {});
await page.waitForTimeout(1200);
for (const e of await page.$$('button.h-7.w-7')) { await e.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(600); }
await page.locator('text=Daycare').first().click().catch(() => {});
await page.waitForTimeout(1500);
console.log('重新打开页面显示 =', await page.locator('input[type="number"][min="1"]').last().inputValue());
await browser.close();
