// 通用探针:列表页筛选是否在「跳页/重载」后还在
// 用法: node scripts/probes/filter-persist-probe.mjs <path> [--reload]
// 只读:不改任何业务数据,只在搜索框打字
import { chromium } from 'playwright';

const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const PATH = process.argv[2] || '/homework';
const MODE = process.argv.includes('--reload') ? 'reload' : 'item';

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 1500, height: 1200 }, locale: 'zh-CN' });
await c.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 110)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 110)); });
p.on('dialog', d => d.accept());

await p.goto(`${SITE}${PATH}`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(3500);

// 找搜索框:优先 placeholder 含「搜索」
async function findSearch() {
  for (const sel of ['input[placeholder*="搜索"]', 'input[placeholder*="Search"]', 'input[type="search"]', 'input[type="text"]']) {
    const loc = p.locator(sel).first();
    if (await loc.count() > 0 && await loc.isVisible()) return loc;
  }
  return null;
}
const box = await findSearch();
if (!box) { console.log('  ✗ 找不到搜索框'); await b.close(); process.exit(0); }
const ph = await box.getAttribute('placeholder');
console.log('  搜索框:', ph);

await box.fill('zz');
await p.waitForTimeout(1200);
const before = await box.inputValue();
const rowsBefore = await p.locator('a[href]').count();
console.log('  输入后:', JSON.stringify(before));

if (MODE === 'reload') {
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {});
} else {
  // 点第一个不是「新建」的站内链接
  const links = await p.locator('a[href]').evaluateAll((as, path) =>
    as.map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/') && !h.includes('/new') && h !== path), PATH);
  console.log('  可点条目:', links.length, links.slice(0, 3).join(' , '));
  if (links.length === 0) { console.log('  没有可点条目 → 改用重载测试'); await p.reload({ waitUntil: 'networkidle' }).catch(() => {}); }
  else {
    await p.goto(`${SITE}${links[0]}`, { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(2500);
    await p.goBack({ waitUntil: 'networkidle' }).catch(() => {});
  }
}
await p.waitForTimeout(3500);
const box2 = await findSearch();
const after = box2 ? await box2.inputValue() : '(搜索框不见了)';
console.log('  回来后  :', JSON.stringify(after));
console.log('  → 结果  :', after === before ? '保留 ✔' : '被清空 ✗');
console.log('  控制台错误:', errs.length ? errs.slice(0, 2).join(' | ') : '无');
await b.close();
