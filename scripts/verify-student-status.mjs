// 验证学生列表每行右侧的「停学」按钮(常显,不用勾选;只截图不点)
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:3001/student-management', { waitUntil: 'domcontentloaded', timeout: 40000 });
await page.waitForTimeout(6000);

const before = await page.innerText('body');
console.log('【不勾选】页面里有「停学」按钮吗?', before.includes('停学'));
console.log('【不勾选】有「复学」按钮吗?', before.includes('复学'));
console.log('【不勾选】批量栏「标记停学」?', before.includes('标记停学'));

// 勾第一个学生的 checkbox(表格行里的)
const boxes = page.locator('button[role="checkbox"], input[type="checkbox"]');
const n = await boxes.count();
console.log('页面上 checkbox 数量:', n);
let clicked = false;
for (let i = 0; i < Math.min(n, 12); i++) {
  const b = boxes.nth(i);
  try {
    if (await b.isVisible()) { await b.click({ timeout: 3000 }); clicked = true; console.log('已勾选第', i, '个 checkbox'); break; }
  } catch {}
}
await page.waitForTimeout(2500);
const after = await page.innerText('body');
console.log('\n勾选后 批量栏「标记停学」?', after.includes('标记停学'));
console.log('每行「停学」按钮数量(页面文本中出现次数):', (after.match(/停学/g)||[]).length);

// 打印批量操作栏附近的文字
const idx = after.indexOf('标记停学');
if (idx > 0) console.log('\n批量操作栏内容:\n' + after.slice(Math.max(0, idx - 320), idx + 200).replace(/\n{2,}/g, '\n'));
await page.screenshot({ path: '/tmp/ux-audit/student-status-btn.png', fullPage: false });
console.log('\n截图: /tmp/ux-audit/student-status-btn.png');
console.log('(没有点击任何状态按钮,只勾选了学生)');
await browser.close();
