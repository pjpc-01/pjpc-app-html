// 验证:点 + 按钮能否把 Full Daycare Service 的天数加上去,并真的存进库
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const SID = '78fu3kaa8gcd48k';       // 罗兆俊
const FEEID = '6wtd021oxlob4ic';     // Full Daycare Service

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

async function dbQty() {
  const r = await fetch(`${PROXY}/collections/student_fees/records?perPage=1&filter=(student_id="${SID}")`, { headers: { Authorization: `Bearer ${imp.token}` } });
  const d = await r.json();
  const items = typeof d.items?.[0]?.fee_items === 'string' ? JSON.parse(d.items[0].fee_items) : (d.items?.[0]?.fee_items || []);
  return items.find(i => i.id === FEEID)?.quantity;
}
const start = await dbQty();
console.log('库里初始天数 =', start);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
await page.goto(SITE + '/finance/student-fees', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(3000);
await page.locator('input[type="text"]').first().fill('罗兆俊').catch(() => {});
await page.waitForTimeout(2200);
await page.locator('button:has-text("编辑")').first().click().catch(() => {});
await page.waitForTimeout(1200);
for (const e of await page.$$('button.h-7.w-7')) { await e.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(600); }
await page.locator('text=Daycare').first().click().catch(() => {});
await page.waitForTimeout(1500);

// 定位 Full Daycare Service 那一行的 + / − 按钮
const row = page.locator('div').filter({ hasText: /^Full Daycare Service/ }).last();
const plus = page.locator('button:has-text("+")').last();
console.log('找到 + 按钮:', await plus.count());
const num = page.locator('input[type="number"][min="1"]').last();
console.log('当前显示 =', await num.inputValue());

for (let i = 0; i < 3; i++) { await plus.click({ timeout: 3000 }).catch(e => console.log('  点+失败', String(e).slice(0, 60))); await page.waitForTimeout(500); }
console.log('点 3 次 + 后显示 =', await num.inputValue());

const minus = page.locator('button:has-text("−")').last();
await minus.click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(500);
console.log('再点 1 次 − 后显示 =', await num.inputValue());

const save = page.locator('button:has-text("保存天数")').first();
console.log('有保存按钮:', await save.count() > 0);
if (await save.count()) { await save.click().catch(() => {}); await page.waitForTimeout(4000); }

const after = await dbQty();
console.log('\n库里天数:初始', start, '→ 现在', after, after !== start ? '✅ 改动了并保存成功' : '❌ 没变');
await browser.close();
