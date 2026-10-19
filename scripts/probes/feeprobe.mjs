// 一次性探针:在学生费用页里找 Full Daycare Service 的天数输入框,看它到底能不能改
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const errs = [];
const bad = [];
page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().replace(SITE, '').slice(0, 150)}`); });
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 200)));

await page.goto(SITE + '/finance/student-fees', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(3500);
console.log('页面标题:', await page.title());
console.log('页面上按钮:', (await page.$$eval('button', bs => bs.map(b => (b.innerText || '').trim()).filter(Boolean))).slice(0, 25).join(' | '));

// 1) 先找有没有出现 "Full Daycare Service" 字样
const hasText = await page.evaluate(() => document.body.innerText.includes('Full Daycare Service'));
console.log('页面上能看到 Full Daycare Service:', hasText);

// 2) 尝试进入编辑态
for (const label of ['编辑', '编辑模式', '批量编辑']) {
  const b = page.locator(`button:has-text("${label}")`).first();
  if (await b.count()) {
    await b.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1200);
    console.log(`点了「${label}」`);
  }
}

// 3) 展开前几张卡片(点那个 h-7 w-7 的小箭头按钮)
const expanders = await page.$$('button.h-7.w-7');
console.log('展开按钮数:', expanders.length);
for (let i = 0; i < Math.min(expanders.length, 5); i++) {
  await expanders[i].click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(600);
}
await page.waitForTimeout(1500);

// 4) 列出所有天数输入框(type=number)
const inputs = await page.evaluate(() => {
  return [...document.querySelectorAll('input')].map(el => {
    const r = el.getBoundingClientRect();
    // 找它旁边最近的文字(判断是哪条费用)
    let p = el.closest('div');
    for (let k = 0; k < 6 && p; k++) { if ((p.innerText || '').includes('Daycare')) break; p = p.parentElement; }
    return {
      type: el.type, value: el.value, min: el.min, max: el.max, step: el.step,
      disabled: el.disabled, readOnly: el.readOnly,
      visible: r.width > 0 && r.height > 0,
      ctxText: (p?.innerText || '').replace(/\n+/g, ' ').slice(0, 70),
      cls: (el.className || '').slice(0, 60),
    };
  }).filter(x => x.type === 'number' || /天/.test(x.ctxText || ''));
});
console.log('\n找到的天数/数字输入框:', inputs.length);
inputs.slice(0, 14).forEach(x => console.log('  ', JSON.stringify(x)));

// 5) 试着往第一个可见的数字框里输 5,看值变不变
const target = page.locator('input[type="number"]:visible').first();
if (await target.count()) {
  const before = await target.inputValue();
  await target.fill('5').catch(e => console.log('  填写失败:', String(e).slice(0, 80)));
  await page.waitForTimeout(800);
  const after = await target.inputValue();
  console.log(`\n第一个可见数字框: ${before} → 填5后 = ${after}  ${after === '5' ? '✅能改' : '❌改不动'}`);
  await target.blur().catch(() => {});
  await page.waitForTimeout(600);
  console.log('失焦后值 =', await target.inputValue());
} else {
  console.log('\n没有可见的 number 输入框 —— 说明天数框根本没渲染出来');
}
if (errs.length) console.log('\n控制台错误:', errs.slice(0, 3));
console.log('\n=== 失败请求(去重) ===');
[...new Set(bad)].slice(0, 10).forEach(u => console.log('  ', u));
await page.screenshot({ path: '/tmp/feeprobe.png', fullPage: false });
await browser.close();
