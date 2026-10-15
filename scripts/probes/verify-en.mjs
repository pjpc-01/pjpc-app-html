// 切英文模式实测：导航栏 + 教学评估页 还有多少中文
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

const scan = async (url, tag) => {
  await page.goto(SITE + url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const r = await page.evaluate(() => {
    const walk = (el, out) => {
      for (const c of el.children) {
        const hasKids = c.children.length > 0;
        if (!hasKids) { const t = (c.textContent || '').trim(); if (t) out.push(t); }
        else walk(c, out);
      }
    };
    const out = []; walk(document.body, out);
    return { texts: [...new Set(out)].filter(t => t.length > 1) };
  });
  const zh = r.texts.filter(t => CJK.test(t));
  console.log(`\n[${tag}] 可见文本 ${r.texts.length} 条 | 还有中文 ${zh.length} 条`);
  if (zh.length) console.log('   中文残留:', JSON.stringify(zh.slice(0, 14)));
  return zh.length;
};

// 导航栏（左侧）
await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
const nav = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('nav a, aside a, [class*="sidebar"] a').forEach(a => { const t=(a.innerText||'').trim(); if(t) out.push(t) });
  return [...new Set(out)];
});
console.log('导航栏项:', JSON.stringify(nav));
console.log('导航栏里还有中文的:', JSON.stringify(nav.filter(t => CJK.test(t))));
await scan('/teacher-teaching-report', '教学评估页');
await scan('/teacher-performance', '绩效管理页');
await scan('/exam-targets', '考试目标页');
await scan('/student-leave', '学生请假页');
await browser.close();
