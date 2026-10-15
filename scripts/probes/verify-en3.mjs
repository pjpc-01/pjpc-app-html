// 英文模式全面复验：逐页统计残留中文（排除 script/style）
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

const PAGES = [
  ['/', '首页'], ['/students', '学生列表'], ['/teachers', '教师列表'], ['/courses', '课程'],
  ['/attendance', '考勤'], ['/finance', '财务'], ['/finance/debts', '债务'], ['/points', '积分'],
  ['/exam-targets', '考试目标'], ['/settings', '设置'], ['/resources', '资源库'],
  ['/teacher-teaching-report', '教学评估'], ['/teacher-performance', '绩效'], ['/student-leave', '学生请假'],
  ['/dashboard/slideshow', '幻灯片'],
];
let grand = 0;
for (const [url, tag] of PAGES) {
  try {
    await page.goto(SITE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    const r = await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll('script,style,noscript,svg').forEach(e => e.remove());
      const txt = clone.innerText || '';
      const CJK = /[\u4e00-\u9fff]/;
      const items = [...new Set(txt.split('\n').map(s => s.trim()).filter(s => s.length > 1 && uses(s)))]
        .filter(s => CJK.test(s));
      function uses(s){ return true }
      return { items, all: txt };
    });
    grand += r.items.length;
    console.log(`[${tag}] 残留中文 ${r.items.length} 条  ${r.items.slice(0, 6).join(' | ')}`);
  } catch (e) { console.log(`[${tag}] 出错: ${e.message.slice(0, 60)}`); }
}
console.log(`\n合计残留 ${grand} 条`);
await browser.close();
