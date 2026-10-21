// 实测:中学(Form 1)报告能不能编辑并保存
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const RID = process.argv[2];

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 1440, height: 1600 }, locale: 'zh-CN' });
await c.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 130)));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 130)); });
p.on('dialog', d => d.accept());

await p.goto(`${SITE}/student-report/${RID}`, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(3500);

// 进编辑
const editBtn = p.locator('button:has-text("编辑")').first();
console.log('  有「编辑」按钮:', await editBtn.count() > 0);
if (await editBtn.count()) { await editBtn.click(); await p.waitForTimeout(2500); }

const txt = await p.evaluate(() => document.body.innerText);
console.log('  出现「编辑报告内容」:', txt.includes('编辑报告内容'));
console.log('  出现「科目成绩」:', txt.includes('科目成绩'));

// 数一下输入框和是否被禁用
const stat = await p.evaluate(() => {
  const ins = [...document.querySelectorAll('input')];
  return { total: ins.length, disabled: ins.filter(i => i.disabled).length };
});
console.log(`  输入框: 共 ${stat.total} 个,其中被禁用 ${stat.disabled} 个`);

// 找保存按钮
const btns = await p.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean));
console.log('  页面按钮:', [...new Set(btns)].join(' | ').slice(0, 200));

console.log('  控制台错误:', errs.length ? errs.slice(0, 3).join(' || ') : '无');
await b.close();
