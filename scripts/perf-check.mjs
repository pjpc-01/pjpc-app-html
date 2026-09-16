// 测量学生列表页 vs 其它页面的加载时间
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });

const pages = ['/student-management', '/students', '/finance/reports', '/dashboard'];
for (const p of pages) {
  const page = await ctx.newPage();
  const t0 = Date.now();
  let slowRequests = [];
  page.on('response', async (r) => {
    const u = r.url();
    const timing = r.request().timing();
    const dur = (timing.responseEnd || 0) - (timing.requestStart || 0);
    if (dur > 300 && !u.includes('_next/static')) slowRequests.push(`${dur.toFixed(0)}ms ${u.replace('http://127.0.0.1:3001','')}`);
  });
  try {
    await page.goto('http://127.0.0.1:3001' + p, { waitUntil: 'domcontentloaded', timeout: 40000 });
    const tDom = Date.now() - t0;
    // 等表格/主要内容出现
    await page.waitForFunction(() => {
      const t = document.body.innerText || '';
      return t.includes('学生') || t.includes('财务') || t.includes('总');
    }, { timeout: 30000 }).catch(()=>{});
    const tContent = Date.now() - t0;
    await page.waitForTimeout(1500);
    const tIdle = Date.now() - t0;
    const perf = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0] || {};
      const res = performance.getEntriesByType('resource');
      const slow = res.filter(r => r.duration > 300).sort((a,b)=>b.duration-a.duration).slice(0,3)
        .map(r => `${r.duration.toFixed(0)}ms ${r.name.split('/').pop().slice(0,40)}`);
      return { ttfb: Math.round(n.responseStart||0), download: Math.round((n.responseEnd||0)-(n.responseStart||0)), domReady: Math.round(n.domContentLoadedEventEnd||0), load: Math.round(n.loadEventEnd||0), resources: res.length, slowest: slow };
    });
    console.log(`${p}`);
    console.log(`   DOM 就绪 ${tDom}ms | 内容出现 ${tContent}ms | +1.5s 稳定 ${tIdle}ms`);
    console.log(`   浏览器: TTFB ${perf.ttfb}ms 下载 ${perf.download}ms DOMReady ${perf.domReady}ms load ${perf.load}ms | 请求数 ${perf.resources}`);
    if (perf.slowest.length) console.log(`   最慢资源: ${perf.slowest.join(' | ')}`);
    if (slowRequests.length) console.log(`   慢接口(>300ms): ${[...new Set(slowRequests)].slice(0,4).join(' | ')}`);
    console.log('');
  } catch (e) { console.log(`${p}: 失败 ${e.message}\n`); }
  await page.close();
}
await browser.close();
