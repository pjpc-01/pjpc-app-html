// 实测:给中一学生新建报告 → 科目应该是「考试目标」那七科
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const SID = process.argv[2];
const NAME = process.argv[3];

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const auth = { Authorization: `Bearer ${imp.token}`, 'Content-Type': 'application/json' };

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 1500, height: 1400 }, locale: 'zh-CN' });
await c.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 110)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 110)); });
p.on('dialog', d => d.accept());

await p.goto(`${SITE}/student-management`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(4000);

const row = p.locator('tr', { hasText: NAME }).first();
console.log('  找到学生行:', await row.count() > 0);
const btns = row.locator('button');
const n = await btns.count();
console.log('  该行按钮数:', n);
// 最后一个按钮通常是「⋯」操作菜单
await btns.nth(n - 1).click();
await p.waitForTimeout(1200);
const menuItem = p.locator('text=学生报告').first();
console.log('  菜单里「学生报告」:', await menuItem.count() > 0);
await menuItem.click();
await p.waitForTimeout(6000);

const url = p.url();
console.log('  跳转到:', url);
const rid = (url.match(/student-report\/([a-z0-9]+)/) || [])[1];
if (rid) {
  const d = await (await fetch(`${PROXY}/collections/student_reports/records/${rid}`, { headers: auth })).json();
  const raw = d.subjects; const subs = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
  console.log('  新建报告的科目:', subs.map(s => s.name).join(' / '));
  console.log('  科目数:', subs.length, subs.length === 7 ? '(七科,对了)' : '(不对!)');
  console.log('  ★ 报告 id:', rid);
}
console.log('  控制台错误:', errs.length ? errs.slice(0, 3).join(' | ') : '无');
await b.close();
