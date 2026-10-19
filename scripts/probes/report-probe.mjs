// 一次性探针:验证另一个 agent 改过的「学生报告」页真的跑得起来
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const IDS = process.argv.slice(2);

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
for (const id of IDS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, locale: 'zh-CN' });
  await ctx.addInitScript(({ t, m }) => localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m })), { t: imp.token, m: imp.record });
  const page = await ctx.newPage();
  const errs = [], bad = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 160)));
  page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().replace(SITE, '').slice(0, 80)}`); });

  await page.goto(`${SITE}/student-report/${id}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);

  const txt = await page.evaluate(() => document.body.innerText);
  const imgs = await page.$$eval('img', els => els.filter(e => e.naturalWidth > 0).length);
  const pdfCards = await page.$$eval('a[href*="/api/files/"]', els => els.length);
  console.log(`\n=== /student-report/${id} ===`);
  console.log(`  页面有内容 : ${txt.trim().length > 200}`);
  console.log(`  有「白屏」字样: ${/Something went wrong|Application error|Unhandled/i.test(txt)}`);
  console.log(`  有效图片   : ${imgs} 个`);
  console.log(`  文件链接   : ${pdfCards} 个`);
  console.log(`  enrichment 区出现「TEP」/ 科目: ${/TEP|BC|BM Lvl|BI/.test(txt)}`);
  console.log(`  控制台错误 : ${errs.length ? errs.slice(0, 3).join(' | ') : '无'}`);
  console.log(`  失败请求   : ${bad.length ? [...new Set(bad)].slice(0, 3).join(' | ') : '无'}`);
  await ctx.close();
}
await browser.close();
