// 验：考试目标总览是否只剩 1 栏（学生行 left 值只有 1 种）+ 有没有被裁
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const probe = async (url, tag, wait = 7000) => {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, locale: 'en-US' });
  await ctx.addInitScript(({ t, m }) => {
    localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
    localStorage.setItem('pjpc_language', 'zh');
  }, { t: imp.token, m: imp.record });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
  await page.goto(SITE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(wait);
  // 切总览模式
  for (const sel of ['button:has-text("全班总览")', 'button:has-text("总览")', 'button:has-text("Overview")']) { try { await page.locator(sel).first().click({ timeout: 4000 }); break; } catch {} }
  await page.waitForTimeout(5000);
  const r = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('div')].filter(d => d.className.includes && d.className.includes('border-b') && d.className.includes('grid') && d.querySelector('input,div'));
    const lefts = [...new Set(rows.map(d => Math.round(d.getBoundingClientRect().left)))]
    // 找滚动容器（GradeLane 的外层）
    const sc = [...document.querySelectorAll('div')].filter(d => d.scrollHeight > d.clientHeight + 8 && d.clientHeight > 100);
    return {
      rows: rows.length,
      lanes: lefts.length, lefts,
      grades: [...new Set((document.body.innerText.match(/Form \d|Standard \d/g) || []))],
      scrollClipped: sc.map(d => `${d.clientHeight}px高 / 内容${d.scrollHeight}px`).slice(0, 3),
      head: (document.body.innerText.match(/考试目标[^\n]*/g) || []).slice(0, 2),
    };
  });
  console.log(`[${tag}] 学生行=${r.rows} 栏数=${r.lanes} lefts=${JSON.stringify(r.lefts)} 年级=${JSON.stringify(r.grades)}`);
  console.log(`   标题: ${JSON.stringify(r.head)}`);
  if (r.scrollClipped.length) console.log(`   ⚠️ 溢出容器: ${JSON.stringify(r.scrollClipped)}`);
  console.log(`   pageerror=${errs.length}`);
  await ctx.close();
};
await probe('/exam-targets', '考试目标页-总览');
await probe('/dashboard/slideshow', '幻灯片页');
await browser.close();
