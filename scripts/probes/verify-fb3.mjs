// 验「已提交」的中学报告能否编辑
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
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
    const ins = [...document.querySelectorAll('input:not([type=hidden]),textarea,select')];
    return {
      inputs: ins.length, enabled: ins.filter(e => !e.disabled && !e.readOnly).length,
      btn: [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(x => /编辑|保存|提交|取消|打印|PDF|格式/.test(x)),
      hint: (document.body.innerText.match(/[^\n]*(只读|不可编辑|无法编辑|不能编辑|查看模式|无权限|已提交后)[^\n]*/g) || []).slice(0, 3),
      len: document.body.innerText.length,
    };
  });
  console.log(`[${tag}] inputs=${r.inputs} 可编辑=${r.enabled} len=${r.len} 按钮=${JSON.stringify(r.btn)}`);
  if (r.hint.length) console.log(`   ⚠️ 提示: ${JSON.stringify(r.hint)}`);
  return r;
};

await page.goto(SITE + '/student-reports', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6500);
// 找含「已提交」且是中学(Form/中一/中二/中三)的行
const info = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('tr,[role=row]')];
  const hit = rows.find(r => /已提交/.test(r.innerText) && /(Form|中一|中二|中三)/.test(r.innerText));
  if (hit) { hit.click(); return hit.innerText.replace(/\n/g, ' | ').slice(0, 110); }
  const anySub = rows.find(r => /已提交/.test(r.innerText));
  if (anySub) { anySub.click(); return 'FALLBACK: ' + anySub.innerText.replace(/\n/g, ' | ').slice(0, 110); }
  return null;
});
console.log('点了:', JSON.stringify(info));
await page.waitForTimeout(6000);
await st('已提交报告(默认)');
// 点编辑
let ok = false;
for (const sel of ['button:has-text("编辑")', 'button:has-text("Edit")']) { try { await page.locator(sel).first().click({ timeout: 6000 }); ok = true; break; } catch {} }
await page.waitForTimeout(5000);
console.log('点编辑:', ok ? '点到了' : '没有按钮');
await st('点编辑后');
console.log('URL:', page.url().replace(SITE, ''));
console.log('pageerror', errs.length, JSON.stringify([...new Set(errs)].slice(0, 3)));
await browser.close();
