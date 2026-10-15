// 验：考试目标轮播里 Form1 科目是否只占一排（比较各科目格子的 offsetTop）
import { chromium } from 'playwright';
const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
// 先从 API 找科目数最多的学生
const j = await (await fetch(SITE + '/api/exam-targets')).json();
const studs = (j?.data?.students || []);
const withScores = studs.map(s => ({ name: s.name, grade: s.grade, n: Object.keys(s.scores || {}).filter(k => s.scores[k] != null).length }))
  .sort((a, b) => b.n - a.n);
console.log('科目数 top5:', JSON.stringify(withScores.slice(0, 5)));
const most = withScores[0];
console.log('科目总数(subjects):', (j?.data?.subjects || []).length, JSON.stringify((j?.data?.subjects || []).map(s => s.label || s.key)));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, locale: 'en-US' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
  localStorage.setItem('pjpc_language', 'zh');
}, { t: imp.token, m: imp.record });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push((e.stack || e.message).split('\n')[0]));
await page.goto(SITE + '/exam-targets', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
// 切到「每人轮播」
for (const sel of ['button:has-text("每人轮播")', 'button:has-text("轮播")', 'button:has-text("Rotation")']) { try { await page.locator(sel).first().click({ timeout: 5000 }); break; } catch {} }
await page.waitForTimeout(5500);
const measure = async (tag) => {
  const r = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('div.rounded-xl.bg-white')].filter(e => /目标|—|-/.test(e.innerText) || /text-center/.test(e.className));
    const tops = [...new Set(cells.map(c => Math.round(c.getBoundingClientRect().top)))];
    const nameEl = document.querySelector('.text-4xl, [class*="text-4xl"]');
    return { cells: cells.length, rows: tops.length, tops: tops.slice(0, 4), name: (nameEl?.textContent || '').trim(), cols: cells.length ? getComputedStyle(cells[0].parentElement).gridTemplateColumns.split(' ').length : 0 };
  });
  console.log(`[${tag}] 学生="${r.name}" 科目格=${r.cells} 排数=${r.rows} 计算列数=${r.cols} tops=${JSON.stringify(r.tops)}`);
  return r;
};
let r = await measure('轮播(当前)');
// 如果当前学生科目 ≤7，点下一张直到找到科目多的
for (let i = 0; i < 12 && r.cells <= 7; i++) {
  for (const sel of ['button:has-text("下一个")', 'button:has-text("下一张")', 'button:has-text("Next")', 'button:has-text(">")']) { try { await page.locator(sel).first().click({ timeout: 2500 }); break; } catch {} }
  await page.waitForTimeout(3000);
  r = await measure(`第${i + 2}张`);
  if (r.cells > 7) break;
}
console.log('pageerror', errs.length, JSON.stringify([...new Set(errs)].slice(0, 2)));
await browser.close();
