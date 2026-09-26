// PJPC 智能 UX 采集器 —— 用真浏览器以用户身份浏览全站，采集"用户实际看到/遇到什么"
// 只读：只导航、只读取，绝不点击写操作按钮、不提交表单。
//
// 用法: node scripts/ux-audit.mjs [maxPages]
import { chromium } from 'playwright';
import fs from 'fs';

const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const OUT = '/tmp/ux-audit';
const SHOTS = `${OUT}/shots`;
fs.mkdirSync(SHOTS, { recursive: true });

// 导航树里用户能看到的全部入口（与 AppShell ROLE_CONFIGS 一致）
const NAV = [
  ['概览/仪表板', '/'], ['概览/幻灯片', '/dashboard/slideshow'], ['概览/TV看板', '/tv-board'],
  ['教务/教育概览', '/education'], ['教务/学生列表', '/student-management'], ['教务/学生报告', '/student-reports'],
  ['教务/家长管理', '/parent-management'], ['教务/作业管理', '/homework'], ['教务/成绩管理', '/grades'],
  ['教务/接送管理', '/pickup'], ['教务/每日日志', '/daily-logs'], ['教务/资源库', '/resource-library'],
  ['教务/教师列表', '/teacher-management'], ['教务/教师排班', '/teacher-attendance-reports'],
  ['教务/活动管理', '/activities'], ['教务/课程管理', '/course-management'],
  ['教务/教学评估', '/teacher-teaching-report'], ['教务/绩效管理', '/teacher-performance'],
  ['财务/财务概览', '/finance/overview'], ['财务/收费管理', '/finance/fees'], ['财务/学生费用', '/finance/student-fees'],
  ['财务/发票管理', '/finance/invoices'], ['财务/付款和收据', '/finance/payments'],
  ['财务/薪资管理', '/finance/payroll'], ['财务/支出管理', '/finance/expenses'], ['财务/银行对账', '/finance/bank'],
  ['财务/预算管理', '/finance/budget'], ['财务/财务报表', '/finance/reports'], ['财务/报销单', '/claim-form'], ['财务/库存管理', '/inventory'],
  ['系统/考勤中心', '/attendance'], ['系统/卡片管理', '/card-management'], ['系统/积分操作', '/points'],
  ['系统/积分规则', '/points/rules'], ['系统/积分排行', '/points/leaderboard'], ['系统/用户管理', '/user-management'],
  ['系统/分行管理', '/center-management'], ['系统/设置', '/settings'], ['系统/管理面板', '/admin'],
];

// 1) 用 PB superuser 代登录拿身份（不需要任何人的密码）
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
if (!imp.token) { console.error('代登录失败:', JSON.stringify(imp).slice(0, 300)); process.exit(1); }
console.log(`✓ 以 ${imp.record.name}(${imp.record.role}) 身份浏览`);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
}, { t: imp.token, m: imp.record });

const max = parseInt(process.argv[2] || '999', 10);
const results = [];
let i = 0;
for (const [name, href] of NAV) {
  if (i++ >= max) break;
  const page = await ctx.newPage();
  const errors = [];
  const badReqs = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('/api/')) badReqs.push(`${r.status()} ${r.url().replace(SITE, '').slice(0, 90)}`); });
  try {
    await page.goto(SITE + href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2600);
    const text = (await page.innerText('body').catch(() => '')).replace(/\n{2,}/g, '\n').trim();
    const meta = await page.evaluate(() => {
      const vis = el => !!(el.offsetWidth || el.offsetHeight);
      const btns = [...document.querySelectorAll('button,[role="button"],a.btn')].filter(vis);
      const inputs = [...document.querySelectorAll('input,select,textarea')].filter(vis);
      const links = [...document.querySelectorAll('nav a, aside a')].filter(vis);
      return {
        buttons: btns.length,
        disabledButtons: btns.filter(b => b.disabled).length,
        buttonLabels: [...new Set(btns.map(b => (b.innerText || '').trim()).filter(Boolean))].slice(0, 25),
        inputs: inputs.length,
        inputPlaceholders: [...new Set(inputs.map(x => x.placeholder).filter(Boolean))].slice(0, 12),
        navLinks: links.length,
        hiddenNavLinks: links.filter(a => getComputedStyle(a).visibility === 'hidden').length,
        tables: document.querySelectorAll('table').length,
        h1: document.querySelector('h1')?.innerText?.trim() || '',
      };
    });
    const shot = `${SHOTS}/${name.replace(/[\/\\]/g, '_')}.png`;
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    results.push({ name, href, finalUrl: page.url(), redirected: !page.url().includes(href === '/' ? '3001' : href), ...meta, textLen: text.length, text: text.slice(0, 2500), errors, badReqs: [...new Set(badReqs)].slice(0, 8), shot });
    console.log(`[${i}] ${name} — 按钮${meta.buttons} 输入${meta.inputs} 错误${errors.length} 失败请求${badReqs.length}`);
  } catch (e) {
    results.push({ name, href, loadError: String(e).slice(0, 200) });
    console.log(`[${i}] ${name} — 加载失败: ${String(e).slice(0, 80)}`);
  }
  await page.close();
}
fs.writeFileSync(`${OUT}/audit.json`, JSON.stringify(results, null, 2));
console.log(`\n✓ 完成 ${results.length} 页 → ${OUT}/audit.json`);
await browser.close();
