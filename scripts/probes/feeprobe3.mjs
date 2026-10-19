// 一次性探针:改天数 → 点「保存天数」 → 重载 → 查库,看存不存得住
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const SID = process.argv[2] || '78fu3kaa8gcd48k';   // 罗兆俊
const FEEID = '6wtd021oxlob4ic';                     // Full Daycare Service

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

async function dbQty() {
  const r = await fetch(`${PROXY}/collections/student_fees/records?perPage=1&filter=(student_id="${SID}")`, { headers: { Authorization: `Bearer ${imp.token}` } });
  const d = await r.json();
  const items = typeof d.items?.[0]?.fee_items === 'string' ? JSON.parse(d.items[0].fee_items) : (d.items?.[0]?.fee_items || []);
  return items.find(i => i.id === FEEID)?.quantity;
}
console.log('库里初始天数 =', await dbQty());

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const posts = [];
page.on('response', async r => { if (['POST', 'PATCH'].includes(r.request().method()) && r.url().includes('student_fees')) posts.push(`${r.request().method()} ${r.status()} ${r.url().replace(SITE, '').slice(0, 90)}`); });
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
console.log('天数框存在:', await inp.count() > 0, '当前值 =', await inp.inputValue().catch(() => '?'));
await inp.fill('5').catch(() => {});
await page.waitForTimeout(800);
console.log('填成 =', await inp.inputValue());

// 找保存按钮
const saveBtn = page.locator('button:has-text("保存天数")').first();
console.log('有「保存天数」按钮:', await saveBtn.count() > 0);
if (await saveBtn.count()) {
  await saveBtn.click().catch(e => console.log('点击失败:', String(e).slice(0, 80)));
  await page.waitForTimeout(3500);
  console.log('已点保存');
}
console.log('发出的写请求:', [...new Set(posts)]);

// 重载后再看框里的值
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(3500);
await page.locator('input[type="text"]').first().fill('罗兆俊').catch(() => {});
await page.waitForTimeout(2200);
await page.locator('button:has-text("编辑")').first().click().catch(() => {});
await page.waitForTimeout(1200);
for (const e of await page.$$('button.h-7.w-7')) { await e.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(600); }
await page.locator('text=Daycare').first().click().catch(() => {});
await page.waitForTimeout(1500);
const inp2 = page.locator('input[type="number"][min="1"]').last();
console.log('\n重载后框里的值 =', await inp2.inputValue().catch(() => '?'));
console.log('重载后库里天数 =', await dbQty());
await browser.close();
