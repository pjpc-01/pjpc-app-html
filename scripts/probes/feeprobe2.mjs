// 一次性探针:锁定有 Full Daycare Service 的学生,复现「天数改不动」
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const bad = [];
page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().replace(SITE, '').slice(0, 130)}`); });
await page.goto(SITE + '/finance/student-fees', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(3000);

// 搜索 Jayden
const search = page.locator('input[type="text"], input[type="search"], input:not([type])').first();
if (await search.count()) {
  await search.fill('罗兆俊').catch(() => {});
  await page.waitForTimeout(2000);
  console.log('已搜索 罗兆俊');
}
// 进全局编辑
const eb = page.locator('button:has-text("编辑")').first();
if (await eb.count()) { await eb.click().catch(() => {}); await page.waitForTimeout(1200); console.log('已进入编辑模式'); }

// 展开所有卡片
const exps = await page.$$('button.h-7.w-7');
console.log('展开按钮数:', exps.length);
for (const e of exps) { await e.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(700); }

// 分类默认折叠 → 点开 Daycare 分类
const cat = page.locator('text=Daycare').first();
if (await cat.count()) {
  await cat.click({ timeout: 3000 }).catch(e => console.log('  点分类失败:', String(e).slice(0, 70)));
  await page.waitForTimeout(1500);
  console.log('已点 Daycare 分类');
} else {
  console.log('页面上找不到 Daycare 分类');
}

// 页面上有没有 Full Daycare Service
const bodyTxt = await page.evaluate(() => document.body.innerText);
console.log('页面上有 Full Daycare Service:', bodyTxt.includes('Full Daycare Service'));
console.log('页面上有「天」字:', /天/.test(bodyTxt));

// 找所有 number 输入 + 它们的上下文
const info = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('input').forEach(el => {
    const r = el.getBoundingClientRect();
    let p = el.parentElement, ctx = '';
    for (let k = 0; k < 8 && p; k++) { ctx = (p.innerText || '').replace(/\n+/g, ' '); if (ctx.length > 12) break; p = p.parentElement; }
    out.push({ type: el.type, value: el.value, min: el.min, max: el.max, disabled: el.disabled,
               vis: r.width > 0, ctx: ctx.slice(0, 80), cls: (el.className || '').slice(0, 45) });
  });
  return out;
});
console.log('\n全部输入框:');
info.forEach(x => console.log('  ', JSON.stringify(x)));

// 定位「Full Daycare Service」旁边那个 number 框
const t = page.locator('input[type="number"]').filter({ hasNot: page.locator('[disabled]') });
const n = await t.count();
console.log(`\nnumber 框共 ${n} 个`);
for (let i = 0; i < n; i++) {
  const el = t.nth(i);
  const meta = await el.evaluate(e => {
    let p = e.parentElement; for (let k = 0; k < 8 && p; k++) { if ((p.innerText || '').includes('Daycare')) return { hit: true, txt: p.innerText.replace(/\n+/g, ' ').slice(0, 90) }; p = p.parentElement; }
    return { hit: false };
  });
  if (meta.hit) {
    console.log(`\n★ 找到 Daycare 的天数框 (第 ${i} 个):`, JSON.stringify(meta.txt));
    const before = await el.inputValue();
    await el.fill('5').catch(e => console.log('  fill 失败:', String(e).slice(0, 90)));
    await page.waitForTimeout(700);
    const after = await el.inputValue();
    console.log(`   ${before} → 填 5 后 = ${after}   ${after === '5' ? '能改' : '改不动 ✗'}`);
    await el.blur().catch(() => {});
    await page.waitForTimeout(900);
    console.log('   失焦后 =', await el.inputValue(), '| disabled =', await el.isDisabled());
  }
}
console.log('\n失败请求:', [...new Set(bad)].slice(0, 5));
await page.screenshot({ path: '/tmp/feeprobe2.png' });
await browser.close();
