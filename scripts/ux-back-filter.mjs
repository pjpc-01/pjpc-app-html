// PJPC UX 专项检测：① 点进 item 后 Back 去哪 ② 列表页 filter 会不会被重置
// 只读：只导航/只点会跳页的普通链接/只改筛选控件，不提交任何表单。
// 用法: node scripts/ux-back-filter.mjs
import { chromium } from 'playwright';

const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';

// 有筛选/列表的代表页面
const PAGES = [
  ['学生列表', '/student-management'],
  ['教师列表', '/teacher-management'],
  ['作业管理', '/homework'],
  ['成绩管理', '/grades'],
  ['学生费用', '/finance/student-fees'],
  ['发票管理', '/finance/invoices'],
  ['付款和收据', '/finance/payments'],
  ['支出管理', '/finance/expenses'],
  ['薪资管理', '/finance/payroll'],
  ['库存管理', '/inventory'],
  ['积分操作', '/points'],
  ['资源库', '/resource-library'],
  ['学生报告', '/student-reports'],
  ['教学评估', '/teacher-teaching-report'],
  ['每日日志', '/daily-logs'],
];

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
}, { t: imp.token, m: imp.record });

const path = u => u.replace(SITE, '').split('?')[0];
const report = [];

for (const [name, href] of PAGES) {
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 80)));
  const row = { name, href, back: '-', filter: '-', itemLink: '-', note: '', errs };
  try {
    await page.goto(SITE + href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4200);

    // ── 找筛选控件
    const ctrl = await page.evaluate(() => {
      const vis = el => !!(el.offsetWidth || el.offsetHeight);
      const sel = [...document.querySelectorAll('select')].filter(vis);
      const inp = [...document.querySelectorAll('input[type=text],input[type=search],input:not([type])')].filter(vis);
      const pick = o => ({ tag: o.tagName.toLowerCase(), count: o.options?.length || 0, label: (o.getAttribute('aria-label') || o.name || o.placeholder || '').slice(0, 20) });
      return { selects: sel.map(pick), inputs: inp.map(pick) };
    });

    // ── filter 测试：优先用 select（选第 2 项），否则文本框输入
    let before = 0, after = 0;
    const rowCount = () => page.evaluate(() => document.querySelectorAll('table tbody tr, [role=row]').length);
    before = await rowCount();
    let applied = false;
    const probe = await page.evaluate(() => {
      const vis = el => !!(el.offsetWidth || el.offsetHeight);
      const s = [...document.querySelectorAll('select')].filter(vis).find(x => x.options.length > 2);
      if (s) { const i = 1; const v = s.options[i].value; s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); return { kind: 'select', label: (s.getAttribute('aria-label') || s.name || '').slice(0, 20), value: v, text: s.options[i].text }; }
      const t = [...document.querySelectorAll('input')].filter(vis).find(x => /搜索|查询|search/i.test(x.placeholder || ''));
      if (t) { t.value = 'a'; t.dispatchEvent(new Event('input', { bubbles: true })); return { kind: 'text', label: t.placeholder, value: 'a' }; }
      return null;
    });
    if (probe) { applied = true; await page.waitForTimeout(2600); after = await rowCount(); }
    row.note = probe ? `筛选控件=${probe.kind}(${probe.label})` : '找不到筛选控件';
    row.beforeRows = before; row.afterRows = after;

    // ── 找会跳页的 item 链接（表内/卡片内，指向别的路由）
    const clicked = await page.evaluate((cur) => {
      const vis = el => !!(el.offsetWidth || el.offsetHeight);
      const links = [...document.querySelectorAll('a[href]')]
        .filter(vis)
        .filter(a => { const h = new URL(a.href, location.href); return h.origin === location.origin && h.pathname !== location.pathname && h.pathname !== '/' && !/^\/(#|javascript)/.test(a.getAttribute('href') || ''); })
        .filter(a => !a.closest('nav,aside,header'));
      if (!links.length) return null;
      const a = links[0];
      const href = new URL(a.href, location.href).pathname;
      a.setAttribute('data-uxprobe', '1');
      return { href, text: (a.innerText || '').trim().slice(0, 30) };
    }, href);
    if (!clicked) { row.itemLink = '无跳页链接(可能用弹窗 ✗ 无法测 back)'; report.push(row); await page.close(); continue; }
    row.itemLink = `${clicked.text} → ${clicked.href}`;
    await page.locator('a[data-uxprobe="1"]').first().click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(3800);
    const detailUrl = path(page.url());

    // ── Back
    await page.goBack({ timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3800);
    const backUrl = path(page.url());
    row.detailUrl = detailUrl;
    row.backUrl = backUrl;
    if (backUrl === path(href)) row.back = '✔ 回到列表';
    else if (backUrl === '/' ) row.back = '✘ 弹回首页';
    else row.back = `✘ 去了别处(${backUrl})`;

    // ── filter 有没有被重置
    if (applied) {
      const now = await page.evaluate(() => {
        const vis = el => !!(el.offsetWidth || el.offsetHeight);
        const s = [...document.querySelectorAll('select')].filter(vis).find(x => x.options.length > 2);
        if (s) return { kind: 'select', value: s.value, idx: s.selectedIndex };
        const t = [...document.querySelectorAll('input')].filter(vis).find(x => /搜索|查询|search/i.test(x.placeholder || ''));
        if (t) return { kind: 'text', value: t.value };
        return null;
      });
      const nowRows = await rowCount();
      if (!now) row.filter = '✘ 控件都没了';
      else if (probe.kind === 'select') row.filter = (now.idx > 0) ? '✔ 保留' : '✘ 被重置回默认';
      else row.filter = (now.value === 'a') ? '✔ 保留' : '✘ 被清空';
      row.afterBackRows = nowRows;
    } else row.filter = '(页面无筛选控件)';
  } catch (e) {
    row.note = (row.note ? row.note + ' | ' : '') + '异常: ' + String(e.message).split('\n')[0].slice(0, 70);
  }
  report.push(row);
  await page.close();
}

console.log('页面'.padEnd(14) + 'Back'.padEnd(18) + 'Filter'.padEnd(20) + '筛选控件/跳页链接');
console.log('─'.repeat(100));
for (const r of report) {
  console.log(`${r.name.padEnd(14)}${r.back.padEnd(18)}${String(r.filter).padEnd(20)}${r.note}`);
  if (r.itemLink && r.itemLink.startsWith('无') === false) console.log(`   └ 点的是: ${r.itemLink}  | 详情页=${r.detailUrl || '-'} | 行数 ${r.beforeRows ?? '-'}→${r.afterRows ?? '-'}→${r.afterBackRows ?? '-'}`);
  if (r.errs.length) console.log(`   └ ⚠️ 报错: ${r.errs[0]}`);
}
const badBack = report.filter(r => String(r.back).startsWith('✘'));
const badFilter = report.filter(r => String(r.filter).startsWith('✘'));
console.log('\n=== 汇总 ===');
console.log(`Back 有问题: ${badBack.length} 个 ${JSON.stringify(badBack.map(r => r.href))}`);
console.log(`Filter 被重置: ${badFilter.length} 个 ${JSON.stringify(badFilter.map(r => r.href))}`);
await browser.close();
