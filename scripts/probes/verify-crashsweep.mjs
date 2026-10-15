// 全路由崩溃扫描：每个页面看 pageerror + 是否白屏
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'fs';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

// 从静态导出目录列举路由
const routes = new Set(['/']);
const walk = (dir, prefix = '') => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = prefix + '/' + e.name;
    if (/^(node_modules|_next|api)$/.test(e.name)) continue;
    if (existsSync(`${dir}/${e.name}/index.html`) || existsSync(`${dir}/${e.name}/page.js`)) routes.add(p);
    walk(`${dir}/${e.name}`, p);
  }
};
try { walk('/home/pjpc/pjpc-app-prod/out') } catch (e) { console.log('列目录失败:', e.message) }
const list = [...routes].sort();
console.log(`待测路由 ${list.length} 个`);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'zh');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const bad = [];
for (const r of list) {
  const errs = [];
  const h = e => errs.push((e.stack || e.message).split('\n')[0].slice(0, 110));
  page.on('pageerror', h);
  try {
    await page.goto(SITE + r, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3200);
    const info = await page.evaluate(() => ({ txt: document.body.innerText.length, crashed: /Application error|client-side exception/i.test(document.body.innerText) }));
    if (errs.length || info.crashed) bad.push({ r, crashed: info.crashed, errs: [...new Set(errs)].slice(0, 2), txt: info.txt });
  } catch (e) { bad.push({ r, crashed: true, errs: ['NAV: ' + String(e.message).split('\n')[0].slice(0, 80)], txt: 0 }) }
  page.off('pageerror', h);
}
console.log(`\n===== 有问题 ${bad.length} 个 =====`);
bad.forEach(b => console.log(`❌ ${b.r}  白屏=${b.crashed} 字数=${b.txt}\n     ${JSON.stringify(b.errs)}`));
if (!bad.length) console.log('✅ 全部干净');
await browser.close();
