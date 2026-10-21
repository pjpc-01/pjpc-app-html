// 实测:给一份中学报告「加科目 → 保存 → 删科目 → 保存」
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const RID = process.argv[2];

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

async function names() {
  const d = await (await fetch(`${PROXY}/collections/student_reports/records/${RID}`, { headers: { Authorization: `Bearer ${imp.token}` } })).json();
  const raw = d.subjects; const subs = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
  return subs.map(s => s.name);
}
console.log('改前库里科目 =', (await names()).join(' / '));

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 1440, height: 1800 }, locale: 'zh-CN' });
await c.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 130)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 130)); });
p.on('dialog', d => d.accept());

await p.goto(`${SITE}/student-report/${RID}`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(3500);
await p.locator('button:has-text("编辑")').first().click();
await p.waitForTimeout(2500);

// ① 加科目
const addInput = p.locator('input[placeholder*="Sejarah"]').first();
console.log('  有「添加科目」输入框:', await addInput.count() > 0);
await addInput.fill('Sejarah');
await p.locator('button:has-text("添加科目")').first().click();
await p.waitForTimeout(800);
const hasRow = await p.locator('input[value="Sejarah"]').count();
console.log('  表格里出现 Sejarah 行:', hasRow > 0);

// ② 保存
await p.locator('button:has-text("保存")').first().click();
await p.waitForTimeout(4500);
let after = await names();
console.log('  保存后库里 =', after.join(' / '));
console.log('  ★ 加科目成功:', after.includes('Sejarah'));

// ③ 删掉它（保存后编辑模式会自动退出，要重新点「编辑」）
await p.locator('button:has-text("编辑")').first().click();
await p.waitForTimeout(2500);
const delBtns = p.locator('button[title="删除这个科目"]');
const n = await delBtns.count();
console.log('  删除按钮数量:', n);
if (n > 0) {
  await delBtns.last().click();
  await p.waitForTimeout(600);
  await p.locator('button:has-text("保存")').first().click();
  await p.waitForTimeout(4500);
  const back = await names();
  console.log('  删除后库里 =', back.join(' / '));
  console.log('  ★ 删科目成功:', !back.includes('Sejarah'));
}
console.log('  控制台错误:', errs.length ? errs.slice(0, 3).join(' || ') : '无');
await b.close();
