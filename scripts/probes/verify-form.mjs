// 专验「教学评估」填表 form 的英文情况
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1200 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'en');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
let errs = [];
page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
const CJK = /[\u4e00-\u9fff]/;
const dump = async (label) => {
  const r = await page.evaluate(() => {
    const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove());
    const txt = c.innerText || '';
    const opts = [...document.querySelectorAll('select option, [role="option"], [role="listbox"] *')].map(e => (e.textContent || '').trim()).filter(Boolean);
    const labels = [...document.querySelectorAll('label')].map(e => (e.textContent || '').trim()).filter(Boolean);
    const btns = [...document.querySelectorAll('button')].map(e => (e.textContent || '').trim()).filter(Boolean);
    return { txt, opts: [...new Set(opts)], labels: [...new Set(labels)], btns: [...new Set(btns)] };
  });
  const zh = a => [...new Set(a.filter(s => CJK.test(s)))];
  console.log(`\n===== ${label} =====`);
  console.log('正文中文:', JSON.stringify(zh(r.txt.split('\n').map(s => s.trim()).filter(Boolean)).slice(0, 20)));
  console.log('label 中文:', JSON.stringify(zh(r.labels)));
  console.log('按钮中文:', JSON.stringify(zh(r.btns)));
  console.log('选项中文:', JSON.stringify(zh(r.opts)));
  return r;
};
await page.goto(SITE + '/teacher-teaching-report', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
await dump('列表页');
// 点「New Report / 新建报告」
for (const sel of ['button:has-text("New Report")', 'button:has-text("新建")', 'button:has-text("New")']) {
  try { await page.locator(sel).first().click({ timeout: 6000 }); break; } catch {}
}
await page.waitForTimeout(5000);
await dump('填表 form');
// 再往下滚，看看学生表现那块
await page.evaluate(() => window.scrollBy(0, 1200));
await page.waitForTimeout(2500);
await dump('填表 form（下滑后）');
console.log(`\npageerror ${errs.length}: ${JSON.stringify([...new Set(errs)].slice(0, 2))}`);
await browser.close();
