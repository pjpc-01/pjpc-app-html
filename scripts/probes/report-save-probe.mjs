// 实测:中学(Form 1)报告改分数 → 保存 → 库里有没有变
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const RID = process.argv[2];

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

async function dbScore() {
  const d = await (await fetch(`${PROXY}/collections/student_reports/records/${RID}`, { headers: { Authorization: `Bearer ${imp.token}` } })).json();
  const raw = d.subjects;
  const subs = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
  return subs.map(s => `${s.name}:${s.final}`);
}
console.log('改前库里 =', (await dbScore()).join(' , '));

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 1440, height: 1600 }, locale: 'zh-CN' });
await c.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const p = await c.newPage();
const errs = [];
const writes = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 120)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
p.on('dialog', d => d.accept());
p.on('request', r => { if (['PATCH', 'POST', 'PUT'].includes(r.method()) && r.url().includes('student_reports')) writes.push(r.method() + ' ' + r.url().split('/').pop().slice(0, 12)); });

await p.goto(`${SITE}/student-report/${RID}`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(3500);
await p.locator('button:has-text("编辑")').first().click();
await p.waitForTimeout(2500);

// 「期末」那一列是第一行第 2 个数字框(inputMode=decimal 的)
const numInputs = p.locator('input[inputmode="decimal"]');
const n = await numInputs.count();
console.log('  数字输入框数量:', n);
if (n >= 2) {
  await numInputs.nth(1).fill('77');
  await p.waitForTimeout(500);
}
await p.locator('button:has-text("保存")').first().click();
await p.waitForTimeout(4500);

console.log('  发出写请求:', writes.length ? [...new Set(writes)].join(', ') : '无');
const after = await dbScore();
console.log('改后库里 =', after.join(' , '));
console.log(after.some(s => s.endsWith(':77')) ? '  ★ 保存成功了 —— 中学报告能编辑也能存' : '  ✗ 没存进去');
console.log('  控制台错误:', errs.length ? errs.slice(0, 3).join(' || ') : '无');
await b.close();
