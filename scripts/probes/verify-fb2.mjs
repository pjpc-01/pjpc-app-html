// 点开中学报告的「编辑」按钮，看是否可用
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const REPORT = '/student-report/16xzs7zo53qy27x';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1100 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'zh');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
const st = async (tag) => {
  const r = await page.evaluate(() => {
    const q = s => [...document.querySelectorAll(s)];
    const ins = q('input:not([type=hidden]),textarea,select');
    const btn = q('button').map(b => ({ t: (b.textContent || '').trim(), dis: b.disabled }));
    return {
      inputs: ins.length, enabled: ins.filter(e => !e.disabled && !e.readOnly).length,
      fields: [...new Set(ins.map(e => e.getAttribute('placeholder') || e.name || e.type))].slice(0, 12),
      btn: btn.filter(b => /编辑|保存|提交|取消|格式|打印|PDF/.test(b.t)).map(b => `${b.t}${b.dis.is ? '(禁用)' : ''}`),
      hint: (document.body.innerText.match(/[^\n]*(只读|不可编辑|无法编辑|不能编辑|查看模式|无权限)[^\n]*/g) || []).slice(0, 3),
      len: document.body.innerText.length,
    };
  });
  console.log(`[${tag}] inputs=${r.inputs} 可编辑=${r.enabled} len=${r.len}`);
  console.log(`   字段: ${JSON.stringify(r.fields)}`);
  console.log(`   相关按钮: ${JSON.stringify(r.btn)}`);
  if (r.hint.length) console.log(`   提示: ${JSON.stringify(r.hint)}`);
  return r;
};
await page.goto(SITE + REPORT, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
await st('打开报告(默认)');
// 点「编辑」
let clicked = false;
for (const sel of ['button:has-text("编辑")', 'button:has-text("Edit")']) {
  try { const b = page.locator(sel).first(); await b.click({ timeout: 6000 }); clicked = true; break; } catch (e) { }
}
await page.waitForTimeout(5000);
console.log(`点「编辑」: ${clicked ? '点到了' : '没找到按钮'}`);
await st('点编辑后');
console.log(`URL: ${page.url().replace(SITE, '')}`);
console.log('pageerror', errs.length, JSON.stringify([...new Set(errs)].slice(0, 3)));
await browser.close();
