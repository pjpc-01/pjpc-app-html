// 手机端溢出探针(一次性) —— 量考试目标页在 390 宽下的横向溢出与关键元素尺寸
import { chromium } from 'playwright';
import fs from 'fs';

const PROXY = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const SITE = 'http://127.0.0.1:3001';
const TARGETS = process.argv.slice(2).length ? process.argv.slice(2) : ['/exam-targets'];
const SHOTS = '/tmp/mobile-probe';
fs.mkdirSync(SHOTS, { recursive: true });

const uid = (await (await fetch(`${PROXY}/collections/users/records?perPage=1&filter=email%3D%22admin%40pjpc.com%22`)).json()).items[0].id;
const imp = await (await fetch(`${PROXY}/collections/users/impersonate/${uid}`, { method: 'POST' })).json();
if (!imp.token) { console.error('代登录失败'); process.exit(1); }

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'zh-CN' });
await ctx.addInitScript(({ t, m }) => {
  localStorage.setItem('pocketbase_auth', JSON.stringify({ token: t, model: m }));
}, { t: imp.token, m: imp.record });

for (const href of TARGETS) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  await page.goto(SITE + href, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2500);

  const m = await page.evaluate(() => {
    const vw = window.innerWidth;
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1 && r.height > 0) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 70),
          w: Math.round(r.width), x: Math.round(r.left),
          txt: (el.textContent || '').trim().slice(0, 24),
        });
      }
    });
    return {
      vw,
      docScrollW: document.documentElement.scrollWidth,
      bodyScrollW: document.body.scrollWidth,
      overflowX: getComputedStyle(document.body).overflowX,
      count: out.length,
      worst: out.sort((a, b) => b.w - a.w).slice(0, 10),
    };
  });

  console.log(`\n===== ${href} (视口 ${m.vw}px) =====`);
  console.log(`整页 scrollWidth = ${m.docScrollW}  →  ${m.docScrollW > m.vw ? '❌ 横向溢出 ' + (m.docScrollW - m.vw) + 'px' : '✓ 不溢出'}`);
  console.log(`比视口宽的元素共 ${m.count} 个:`);
  m.worst.forEach(e => console.log(`   ${String(e.w).padStart(5)}px  左${String(e.x).padStart(5)}  <${e.tag} class="${e.cls}">  "${e.txt}"`));
  if (errs.length) console.log('  页面错误:', errs.slice(0, 3));
  await page.screenshot({ path: `${SHOTS}${href.replace(/\//g, '_')}.png`, fullPage: true }).catch(() => {});
  await page.close();
}
console.log(`\n截图: ${SHOTS}`);
await browser.close();
