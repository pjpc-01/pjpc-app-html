// 看 student-leave 和 teacher-attendance-reports 到底渲染了什么
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api', SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
for (const route of ['/student-leave', '/teacher-attendance-reports', '/teacher-workspace', '/attendance-reports']) {
  const ctx = await browser.newContext({ viewport: { width: 1680, height: 1100 }, locale: 'en-US' });
  await ctx.addInitScript(({ t, m }) => {
    localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
    localStorage.setItem('pjpc_language', 'zh');
  }, { t: imp.token, m: imp.record });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0].slice(0, 200)));
  await page.goto(SITE + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(5500);
  const info = await page.evaluate(() => {
    const txt = (document.body.innerText || '').replace(/\n{2,}/g, '\n').trim();
    return { txt: txt.slice(0, 700), len: txt.length, hasErr: /error|错误|异常|失败/i.test(txt), inputs: document.querySelectorAll('input,textarea,select').length, btns: [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(x => x && x.length < 16).slice(0, 12) };
  });
  console.log(`\n===== ${route} =====`);
  console.log(`字数=${info.len} 输入框=${info.inputs} 提到"错误"=${info.hasErr}`);
  console.log(`按钮: ${JSON.stringify(info.btns)}`);
  console.log(`正文:\n${info.txt}`);
  if (errs.length) console.log(`⚠️ 报错: ${JSON.stringify([...new Set(errs)])}`);
  await ctx.close();
}
await browser.close();
