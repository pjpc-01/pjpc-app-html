// PJPC UX 专项检测 v2：① Back 去向 ② 列表页 filter 是否被重置
//   覆盖两种 item 打开方式：跳页(a[href]) 与 弹窗(dialog)
// 只读：只导航/只点查看类入口/只改筛选控件，不提交任何表单、不保存。
// 用法: node scripts/ux-back-filter.mjs
import { chromium } from 'playwright';

const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';

const PAGES = [
  ['学生列表', '/student-management'], ['教师列表', '/teacher-management'],
  ['作业管理', '/homework'], ['成绩管理', '/grades'],
  ['学生费用', '/finance/student-fees'], ['发票管理', '/finance/invoices'],
  ['付款和收据', '/finance/payments'], ['支出管理', '/finance/expenses'],
  ['薪资管理', '/finance/payroll'], ['库存管理', '/inventory'],
  ['积分操作', '/points'], ['资源库', '/resource-library'],
  ['学生报告', '/student-reports'], ['教学评估', '/teacher-teaching-report'],
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

const FILTER_JS = `(() => {
  const vis = el => !!(el.offsetWidth || el.offsetHeight);
  const s = [...document.querySelectorAll('select')].filter(vis).find(x => x.options.length > 2);
  if (s) { s.value = s.options[1].value; s.dispatchEvent(new Event('change', { bubbles: true })); return { kind: 'select', label: (s.getAttribute('aria-label') || s.name || '').slice(0, 18) }; }
  const t = [...document.querySelectorAll('input')].filter(vis).find(x => /搜索|查询|search/i.test(x.placeholder || ''));
  if (t) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(t, 'a');
    t.dispatchEvent(new Event('input', { bubbles: true }));
    return { kind: 'text', label: (t.placeholder || '').slice(0, 18) };
  }
  return null;
})()`;
const READ_JS = `(() => {
  const vis = el => !!(el.offsetWidth || el.offsetHeight);
  const s = [...document.querySelectorAll('select')].filter(vis).find(x => x.options.length > 2);
  if (s) return { kind: 'select', idx: s.selectedIndex, value: s.value };
  const t = [...document.querySelectorAll('input')].filter(vis).find(x => /搜索|查询|search/i.test(x.placeholder || ''));
  if (t) return { kind: 'text', value: t.value };
  return null;
})()`;

for (const [name, href] of PAGES) {
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 70)));
  const row = { name, href, back: '-', filterJump: '-', filterDialog: '-', note: '', errs };
  const rowCount = () => page.evaluate(() => document.querySelectorAll('table tbody tr,[role=row]').length);
  try {
    await page.goto(SITE + href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4200);

    // ── A) 设筛选
    const probe = await page.evaluate(FILTER_JS);
    row.note = probe ? `${probe.kind}(${probe.label})` : '无筛选控件';
    const rowsBefore = await rowCount();
    if (probe) await page.waitForTimeout(2200);
    row.rows = `${rowsBefore}→${await rowCount()}`;

    // ── B) 跳页型 item → Back
    const jumpLink = await page.evaluate(() => {
      const vis = el => !!(el.offsetWidth || el.offsetHeight);
      const a = [...document.querySelectorAll('a[href]')].filter(vis)
        .filter(x => { const h = new URL(x.href, location.href); return h.origin === location.origin && h.pathname !== location.pathname && h.pathname !== '/' && !x.closest('nav,aside,header'); })[0];
      if (!a) return null;
      a.setAttribute('data-uxprobe', '1');
      return new URL(a.href, location.href).pathname;
    });
    if (jumpLink) {
      await page.locator('a[data-uxprobe="1"]').first().click({ timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(3600);
      const detail = path(page.url());
      await page.goBack({ timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(3600);
      const backUrl = path(page.url());
      row.back = backUrl === path(href) ? '✔回列表' : (backUrl === '/' ? '✘弹回首页' : `✘去了${backUrl}`);
      row.detailUrl = detail;
      if (probe) {
        const st = await page.evaluate(READ_JS);
        row.filterJump = !st ? '✘控件没了' : (probe.kind === 'select' ? (st.idx > 0 ? '✔保留' : '✘重置') : (st.value === 'a' ? '✔保留' : '✘清空'));
      }
      // 复位到干净列表 + 重设筛选，给弹窗流程用
      await page.goto(SITE + href, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(3200);
      if (probe) { await page.evaluate(FILTER_JS); await page.waitForTimeout(2200); }
    } else row.back = '无跳页';

    // ── C) 弹窗型 item → 关掉 → 看 filter
    const opened = await page.evaluate(() => {
      const vis = el => !!(el.offsetWidth || el.offsetHeight);
      const kw = /查看|详情|编辑|填写|View|Detail|Edit/;
      let el = [...document.querySelectorAll('table tbody tr button, table tbody tr a, [role=row] button')].filter(vis).find(b => kw.test(b.innerText || b.getAttribute('aria-label') || ''));
      // 退化 1：整行最后一个单元格里的按钮/链接（常见的"操作"列）
      if (!el) {
        const ops = [...document.querySelectorAll('table tbody tr td:last-child button, table tbody tr td:last-child a')].filter(vis);
        if (ops.length) el = ops[ops.length - 1];
      }
      // 退化 2：带 title/aria-label 的图标按钮
      if (!el) {
        const icon = [...document.querySelectorAll('table tbody tr button[title], table tbody tr button[aria-label], table tbody tr a[title]')].filter(vis);
        if (icon.length) el = icon[0];
      }
      if (!el) { const tr = [...document.querySelectorAll('table tbody tr')].filter(vis).find(t => t.querySelector('td')); if (tr) el = tr; }
      if (!el) return null;
      el.setAttribute('data-uxprobe2', '1');
      return (el.innerText || el.tagName).trim().slice(0, 24);
    });
    if (opened) {
      const before = await rowCount();
      await page.locator('[data-uxprobe2="1"]').first().click({ timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(3200);
      const urlAfter = path(page.url());
      const hasDialog = await page.evaluate(() => !!document.querySelector('[role=dialog],[role=alertdialog]'));
      if (!hasDialog && urlAfter !== path(href)) row.filterDialog = `跳页(${urlAfter})`;
      else if (!hasDialog) row.filterDialog = '点了没弹窗';
      else {
        row.dialogOpened = true;
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(1600);
        let still = await page.evaluate(() => !!document.querySelector('[role=dialog],[role=alertdialog]'));
        if (still) {
          await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /关闭|Close|取消|Cancel/.test(x.innerText || '')); b?.click(); });
          await page.waitForTimeout(1600);
          still = await page.evaluate(() => !!document.querySelector('[role=dialog],[role=alertdialog]'));
        }
        await page.waitForTimeout(1800);
        const st = await page.evaluate(READ_JS);
        row.rowsDialog = `${before}→${await rowCount()}`;
        row.filterDialog = still ? '✘弹窗关不掉'
          : (probe === null && !st) ? '(本来就没筛选控件)'
            : !st ? '✘控件没了'
              : probe ? (probe.kind === 'select' ? (st.idx > 0 ? '✔保留' : '✘重置') : (st.value === 'a' ? '✔保留' : '✘清空'))
                : '(无筛选控件)';
      }
    } else row.filterDialog = '无可点item';
  } catch (e) {
    row.note += ' | 异常:' + String(e.message).split('\n')[0].slice(0, 60);
  }
  report.push(row);
  await page.close();
}

console.log('页面'.padEnd(12) + '| Back'.padEnd(13) + '| 跳页后filter'.padEnd(14) + '| 弹窗后filter'.padEnd(14) + '| 筛选/行数');
console.log('─'.repeat(112));
for (const r of report) {
  console.log(`${r.name.padEnd(12)}| ${String(r.back).padEnd(11)}| ${String(r.filterJump).padEnd(12)}| ${String(r.filterDialog).padEnd(12)}| ${r.note} 行${r.rows || '-'}${r.rowsDialog ? ' 弹窗后' + r.rowsDialog : ''}`);
  if (r.errs.length) console.log(`   └ ⚠️ ${r.errs[0]}`);
}
const bb = report.filter(r => String(r.back).startsWith('✘'));
const bj = report.filter(r => String(r.filterJump).startsWith('✘'));
const bd = report.filter(r => String(r.filterDialog).startsWith('✘'));
console.log('\n=== 汇总 ===');
console.log(`Back 有问题 (${bb.length}): ${JSON.stringify(bb.map(r => r.href))}`);
console.log(`跳页后 filter 被重置 (${bj.length}): ${JSON.stringify(bj.map(r => r.href))}`);
console.log(`弹窗后 filter 被重置 (${bd.length}): ${JSON.stringify(bd.map(r => r.href))}`);
console.log(`未覆盖: ${report.filter(r => (r.back === '无跳页' && String(r.filterDialog).includes('无可点')) || String(r.filterDialog).includes('点了没弹窗')).map(r => r.href).join(' ') || '无'}`);
await browser.close();
