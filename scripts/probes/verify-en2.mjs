// 针对性验收：那 137 条是否真的翻掉了 + 导航栏
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

const textOf = async () => page.evaluate(() => {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll('script,style,noscript').forEach(e => e.remove());
  return (clone.innerText || '');
});

const check = async (url, tag, keys) => {
  await page.goto(SITE + url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  const txt = await textOf();
  const left = keys.filter(k => txt.includes(k));
  console.log(`[${tag}] 检查 ${keys.length} 个关键词 → 仍是中文: ${left.length ? JSON.stringify(left) : '全翻了 ✓'}`);
  return left;
};

// 导航栏：找 sidebar 里的所有 label
await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
const nav = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('a, button').forEach(e => {
    const t = (e.innerText || '').trim();
    if (t && t.length < 14 && !t.includes('\n')) out.push(t);
  });
  return [...new Set(out)];
});
const CJK = /[\u4e00-\u9fff]/;
console.log('导航/按钮里还有中文:', JSON.stringify(nav.filter(t => CJK.test(t)).slice(0, 25)));

await check('/teacher-teaching-report', '教学评估', ['保存失败:', '已有', '张照片（新上传会追加）', '请先选择教师', '报告已提交']);
await check('/student-leave', '学生请假', ['学生请假记录管理', '新增请假', '全部状态', '记录数']);
await check('/finance/debts', '债务管理', ['加债务', '本金', '每月应还', '已还清', '记一笔还款', '登记债务']);
await check('/teacher-performance', '绩效管理', ['绩效管理', '查看和管理教师绩效考核', '返回仪表板']);
await check('/exam-targets', '考试目标页', ['全班总览', '每人轮播', '编辑分数', '全屏放映', '完成编辑']);
await browser.close();
