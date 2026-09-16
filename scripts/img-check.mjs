// 抓学生管理页所有图片请求:URL + 状态码 + 耗时
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const reqs = [];
page.on('response', async (r) => {
  const u = r.url();
  if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(u) || u.includes('/files/')) {
    const t = r.request().timing();
    reqs.push({ status: r.status(), url: u.replace('http://127.0.0.1:3001',''), ms: Math.round((t.responseEnd||0)-(t.requestStart||0)) });
  }
});
await page.goto('http://127.0.0.1:3001/student-management', { waitUntil: 'domcontentloaded', timeout: 40000 });
await page.waitForTimeout(7000);
const bad = reqs.filter(r => r.status >= 400);
const good = reqs.filter(r => r.status < 400);
console.log(`图片请求共 ${reqs.length}: 成功 ${good.length} / 失败 ${bad.length}`);
console.log('\n=== 失败样本(前 8)===')
for (const r of bad.slice(0,8)) console.log(`  ${r.status} ${r.ms}ms ${r.url.slice(0,95)}`);
console.log('\n=== 成功样本(前 5)===')
for (const r of good.slice(0,5)) console.log(`  ${r.status} ${r.ms}ms ${r.url.slice(0,95)}`);
const slow = [...reqs].sort((a,b)=>b.ms-a.ms).slice(0,5);
console.log('\n=== 最慢 5 个 ===')
for (const r of slow) console.log(`  ${r.status} ${r.ms}ms ${r.url.slice(0,95)}`);
// 滚动到底,看是否懒加载更多
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(4000);
console.log(`\n滚动后再统计: 共 ${reqs.length} 个图片请求,失败 ${reqs.filter(r=>r.status>=400).length}`);
await browser.close();
