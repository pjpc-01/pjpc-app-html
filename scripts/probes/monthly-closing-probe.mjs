// 月结页整条流程:渲染 → 生成月结 → 显示存档 → 反结账
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const MONTH = process.argv[2] || '2026-08';

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1400 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
p.on('dialog', async d => { console.log(`  [弹窗] ${d.type()}: ${d.message().split('\n')[0].slice(0, 50)}`); await d.accept(d.type() === 'prompt' ? '测试反结账' : undefined); });

await p.goto(`${SITE}/finance/monthly-closing`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(3500);

const txt = () => p.evaluate(() => document.body.innerText);
let t0 = await txt();
console.log('=== 1. 页面打开 ===');
console.log('  标题含「月度结账」:', t0.includes('月度结账'));
console.log('  有「生成月结」按钮:', t0.includes('生成月结'));
console.log('  有存档记录区:', t0.includes('存档记录'));
console.log('  控制台错误:', errs.length ? errs.slice(0, 2).join(' | ') : '无');

// 切月份
await p.locator('input[type="month"]').fill(MONTH);
await p.waitForTimeout(3000);
let t1 = await txt();
console.log(`\n=== 2. 切到 ${MONTH} ===`);
const m = t1.match(/开票金额\s*RM\s*([\d,\.]+)/);
console.log('  显示开票金额:', m ? m[1] : '(没抓到)');
console.log('  显示未付清发票:', /未付清发票\s*(\d+)\s*张/.test(t1) ? t1.match(/未付清发票\s*(\d+)\s*张/)[1] + ' 张' : '?');

// 生成月结
const closeBtn = p.locator('button:has-text("生成月结")').first();
if (await closeBtn.count()) {
  await closeBtn.click();
  await p.waitForTimeout(4000);
  let t2 = await txt();
  console.log(`\n=== 3. 按「生成月结」 ===`);
  console.log('  出现「已结账」:', t2.includes('已结账'));
  console.log('  出现「存档当时的数字」提示:', t2.includes('存档当时的数字'));
  console.log('  按钮变成「反结账」:', await p.locator('button:has-text("反结账")').count() > 0);
} else console.log('\n  ✗ 找不到生成月结按钮');

// 反结账
const reBtn = p.locator('button:has-text("反结账")').first();
if (await reBtn.count()) {
  await reBtn.click();
  await p.waitForTimeout(4000);
  let t3 = await txt();
  console.log(`\n=== 4. 按「反结账」 ===`);
  console.log('  「反结账」按钮消失:', await p.locator('button:has-text("反结账")').count() === 0);
  console.log('  「生成月结」回来了:', await p.locator('button:has-text("生成月结")').count() > 0);
}
console.log('\n  全程控制台错误:', errs.length ? errs.slice(0, 3).join(' | ') : '无');
await b.close();
