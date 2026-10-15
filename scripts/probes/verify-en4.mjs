// 反检查：确认页面真的渲染了内容（不是空白/登录页）
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1050 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'en');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const CJK = /[\u4e00-\u9fff]/;
for (const [url, tag] of [['/', '首页'], ['/students', '学生列表'], ['/finance', '财务'], ['/attendance', '考勤']]) {
  await page.goto(SITE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(7000);
  const r = await page.evaluate(() => {
    const c = document.body.cloneNode(true);
    c.querySelectorAll('script,style,noscript').forEach(e => e.remove());
    return (c.innerText || '').replace(/\n{2,}/g, '\n').trim();
  });
  const lines = r.split('\n').map(s => s.trim()).filter(Boolean);
  console.log(`\n[${tag}] 文本长度 ${r.length} 行数 ${lines.length}`);
  console.log(`  含中文的行: ${lines.filter(l => CJK.test(l)).slice(0, 8).join(' ⏐ ')}`);
  console.log(`  样本: ${lines.slice(0, 5).join(' ⏐ ').slice(0, 200)}`);
}
await browser.close();
