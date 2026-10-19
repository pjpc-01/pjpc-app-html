// 只读探针:重新打开页面,看它显示的天数 == 库里的天数吗
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const SID = process.argv[2] || '78fu3kaa8gcd48k';
const FEEID = process.argv[3] || '6wtd021oxlob4ic';

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

// 库里的真实值 + fee_items 的原始内容
const d = await (await fetch(`${PROXY}/collections/student_fees/records?perPage=1&filter=(student_id="${SID}")`, { headers: { Authorization: `Bearer ${imp.token}` } })).json();
const raw = d.items?.[0]?.fee_items;
const items = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
const target = items.find(i => i.id === FEEID);
console.log('库里那条 fee_item 的原始内容:');
console.log('  ', JSON.stringify(target));
console.log('  active =', target?.active, ' quantity =', target?.quantity);

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

const inp = page.locator('input[type="number"][min="1"]').last();
const shown = await inp.count() ? await inp.inputValue() : '(框不存在)';
console.log('\n页面显示的天数 =', shown);
console.log('库里存的天数   =', target?.quantity);
console.log(shown === String(target?.quantity) ? '\n→ 一致:读取没问题' : '\n→ ★不一致!读取路径有问题(这就是「跳回 1 天」)');
await browser.close();
