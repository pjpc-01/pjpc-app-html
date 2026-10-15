// 自测：中文模式 + 教师评估查看模式/打印 + 各页 pageerror
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const CJK = /[\u4e00-\u9fff]/;

async function run(lang) {
  const ctx = await browser.newContext({ viewport: { width: 1680, height: 1100 }, locale: lang === 'en' ? 'en-US' : 'zh-CN' });
  await ctx.addInitScript(({ t, m, lang }) => {
    localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
    localStorage.setItem('pjpc_language', lang);
  }, { t: imp.token, m: imp.record, lang });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
  console.log(`\n########## 语言=${lang} ##########`);

  // 1) 教学评估 列表
  await page.goto(SITE + '/teacher-teaching-report', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5500);
  let r = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove()); return (c.innerText || '').slice(0, 700) });
  console.log('1 列表页前 260 字:', JSON.stringify(r.slice(0, 260)));
  console.log('  有中文:', CJK.test(r), '| 有 Science/科学:', /Science|科学/.test(r));

  // 2) 打开填表 form
  for (const sel of ['button:has-text("New Report")', 'button:has-text("新建")', 'button:has-text("New")']) {
    try { await page.locator(sel).first().click({ timeout: 5000 }); break; } catch {}
  }
  await page.waitForTimeout(4500);
  r = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove()); return (c.innerText || '') });
  const zhLines = [...new Set(r.split('\n').map(s => s.trim()).filter(s => s && CJK.test(s)))];
  console.log('2 填表页 中文行:', JSON.stringify(zhLines.slice(0, 8)));
  console.log('  页面长度:', r.length);

  // 3) 返回列表，点第一份已提交报告 → 查看模式
  await page.goto(SITE + '/teacher-teaching-report', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  let opened = false;
  for (const sel of ['tr:has-text("Submitted")', 'div:has-text("Submitted")', 'a:has-text("Submitted")']) {
    try { await page.locator(sel).first().click({ timeout: 5000 }); opened = true; break; } catch {}
  }
  await page.waitForTimeout(4500);
  r = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove()); return (c.innerText || '') });
  console.log(`3 查看模式(点了${opened ? '报告行' : '没点到'}): 页面长度 ${r.length}`);
  const zh3 = [...new Set(r.split('\n').map(s => s.trim()).filter(s => s && CJK.test(s)))];
  console.log('  中文行:', JSON.stringify(zh3.slice(0, 8)));
  console.log('  含 Student Performance/学生表现:', /Student Performance|学生表现/.test(r));

  // 4) 打印样式（模拟 Ctrl+P 前的 @media print 渲染）
  try {
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1500);
    const pr = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove()); return (c.innerText || '').length });
    console.log('4 打印媒体下页面长度:', pr);
    await page.emulateMedia({ media: 'screen' });
  } catch (e) { console.log('4 打印模拟出错:', e.message.slice(0, 60)); }

  console.log(`>> ${lang} pageerror: ${errs.length}`, JSON.stringify([...new Set(errs)].slice(0, 3)));
  await ctx.close();
}

await run('zh');
await run('en');
await browser.close();
