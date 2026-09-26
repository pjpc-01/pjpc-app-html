// PJPC 智能会计师 —— 只读审计:做账需要哪些资料?现在缺什么?报表清不清楚?
// 用法: node scripts/account-audit.mjs
import fs from 'fs';

const B = 'http://127.0.0.1:3001/api/pocketbase-proxy/api';
const g = async (p) => (await fetch(`${B}${p}`)).json();

const cols = ['invoices', 'payments', 'refunds', 'receipts', 'expenses', 'teacher_salary_records', 'students', 'teachers', 'centers', 'fee_items', 'salary_structures'];
const D = {};
for (const c of cols) {
  try {
    const r = await g(`/collections/${c}/records?perPage=1000`);
    D[c] = (r.items || []).filter(x => !x.deleted);
  } catch (e) { D[c] = []; console.log(`⚠️ ${c} 读取失败: ${String(e).slice(0, 60)}`); }
}
const p2 = (n) => Number(n || 0).toFixed(2);
const monthOf = (i) => {
  const pp = String(i?.period || '');
  if (/^\d{4}-\d{2}/.test(pp)) return pp.slice(0, 7);
  return String(i?.issueDate || i?.created || '').slice(0, 7);
};

const R = [];
const h = (t) => R.push(`\n## ${t}`);
const li = (t) => R.push(`- ${t}`);

R.push('# PJPC 智能会计师 · 账务资料审计');
R.push(`审计时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })}`);
R.push(`数据量: 发票 ${D.invoices.length} / 收款 ${D.payments.length} / 退款 ${D.refunds.length} / 收据 ${D.receipts.length} / 支出 ${D.expenses.length} / 薪资 ${D.teacher_salary_records.length} / 学生 ${D.students.length} / 老师 ${D.teachers.length}`);

// ============ A. 收入侧 ============
h('A. 收入侧 —— 账能不能对起来');
const invById = new Map(D.invoices.map(i => [i.id, i]));
const payByInv = new Map();
for (const p of D.payments) {
  if (p.status && p.status !== 'completed') continue;
  payByInv.set(p.invoiceId, (payByInv.get(p.invoiceId) || 0) + Number(p.amount || 0));
}
const noPeriod = D.invoices.filter(i => !i.period);
const orphanPay = D.payments.filter(p => { const i = invById.get(p.invoiceId); return !i || i.deleted; });
const invTotal = D.invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
const paidTotal = D.payments.filter(p => !p.status || p.status === 'completed').reduce((s, p) => s + Number(p.amount || 0), 0);
li(`开票总额 RM ${p2(invTotal)} / 实收总额 RM ${p2(paidTotal)} / **未收 RM ${p2(invTotal - paidTotal)}**`);
li(`未收明细可查: ${D.invoices.filter(i => i.status !== 'paid').length} 张票未缴清`);
li(noPeriod.length ? `⚠️ **${noPeriod.length} 张票没有账期** → 报表归月会不准(建议开票时必填)` : '✅ 所有发票都有账期');
li(orphanPay.length ? `⚠️ **${orphanPay.length} 笔收款找不到有效发票** → 账实不符` : '✅ 所有收款都有对应发票');

// 多收/少收
const mismatch = [];
const paidByInvMap = new Map();
for (const p of D.payments) {
  if (p.status && p.status !== 'completed') continue;
  paidByInvMap.set(p.invoiceId, (paidByInvMap.get(p.invoiceId) || 0) + Number(p.amount || 0));
}
const numCount = new Map();
for (const i of D.invoices) numCount.set(i.invoiceNumber, (numCount.get(i.invoiceNumber) || 0) + 1);
const dupNums = [...numCount].filter(([, n]) => n > 1);
li(dupNums.length ? `❗ **票号重复 ${dupNums.length} 组**（会计大忌）: ${dupNums.slice(0, 6).map(([k, n]) => `${k}×${n}`).join(', ')}` : '✅ 票号唯一');

for (const [iid, got] of paidByInvMap) {
  const i = invById.get(iid); if (!i) continue;
  if ((numCount.get(i.invoiceNumber) || 0) > 1) continue;   // 重号票跳过，避免误报
  const due = Number(i.totalAmount || 0);
  if (Math.abs(got - due) > 1) mismatch.push(`${i.invoiceNumber} 票额 ${p2(due)} / 实收 ${p2(got)} (差 ${p2(got - due)})`);
}
li(mismatch.length ? `⚠️ ${mismatch.length} 张票收付金额不一致: ${mismatch.slice(0, 5).join('; ')}` : '✅ 收付金额一致（含部分缴款属于正常欠款）');

// 收款方式(做账需要区分现金/银行)
const noMethod = D.payments.filter(p => !p.method);
li(noMethod.length ? `⚠️ **${noMethod.length} 笔收款没有付款方式** → 无法核对现金/银行` : '✅ 所有收款都有付款方式');

// 退款
li(`退款 ${D.refunds.length} 笔, 合计 RM ${p2(D.refunds.reduce((s, r) => s + Number(r.amount || 0), 0))}`);

// ============ B. 成本侧 ============
h('B. 成本侧 —— 薪资和支出齐不齐');
const salMonths = new Map();
for (const s of D.teacher_salary_records) {
  if (s.deleted) continue;
  const m = s.year ? `${s.year}-${String(s.month).padStart(2, '0')}` : String(s.payment_date || '').slice(0, 7);
  if (!salMonths.has(m)) salMonths.set(m, { n: 0, net: 0, epf: 0, socso: 0, eis: 0, pcb: 0 });
  const o = salMonths.get(m);
  o.n++; o.net += Number(s.net_salary || 0);
  o.epf += Number(s.epf_employer || 0); o.socso += Number(s.socso_employer || 0);
  o.eis += Number(s.eis_employer || 0); o.pcb += Number(s.tax_deduction ?? s.pcb ?? 0);
}
R.push('\n| 月份 | 薪资单数 | 净发 | 雇主EPF | 雇主SOCSO | 雇主EIS | PCB | 总成本 |');
R.push('|---|---|---|---|---|---|---|---|');
for (const [m, o] of [...salMonths].sort()) {
  R.push(`| ${m} | ${o.n} | ${p2(o.net)} | ${p2(o.epf)} | ${p2(o.socso)} | ${p2(o.eis)} | ${p2(o.pcb)} | ${p2(o.net + o.epf + o.socso + o.eis)} |`);
}
const curYm = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).slice(0, 7);
const prevYm = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })();
li(salMonths.has(curYm) ? `✅ 本月(${curYm})薪资已生成` : `⚠️ **本月(${curYm})薪资还没生成** → 本月成本会偏低`);
li(salMonths.has(prevYm) ? `✅ 上月(${prevYm})薪资已生成` : `⚠️ **上月(${prevYm})薪资缺失** → 上月利润会虚高`);
// 注: PCB 在 teacher_salary_records 存于 tax_deduction 字段(pcb 字段不存在)
const noPcb = D.teacher_salary_records.filter(s => s.tax_deduction === undefined || s.tax_deduction === null || s.tax_deduction === '');
li(noPcb.length ? `⚠️ ${noPcb.length} 条薪资没记 PCB(tax_deduction) 字段 → 报税资料不全` : '✅ 薪资都带 PCB(tax_deduction) 字段');

const expByCat = new Map();
for (const e of D.expenses) {
  const c = e.category || '未分类';
  expByCat.set(c, (expByCat.get(c) || 0) + Number(e.amount || 0));
}
R.push('\n| 支出类别 | 金额 |');
R.push('|---|---|');
for (const [c, a] of [...expByCat].sort((x, y) => y[1] - x[1])) R.push(`| ${c} | ${p2(a)} |`);
const noCenter = D.expenses.filter(e => !e.centerId);
li(noCenter.length ? `⚠️ ${noCenter.length} 笔支出没有分行 → 分行报表不准` : '✅ 支出都挂了分行');
const noProof = D.expenses.filter(e => !e.receipt && !e.attachment && !e.proof);
li(noProof.length ? `⚠️ **${noProof.length} 笔支出没有凭证/收据附件** → 报税时无法举证(会计大忌)` : '✅ 支出都有凭证');

// 每月支出齐不齐
const expMonths = new Map();
for (const e of D.expenses) {
  const m = String(e.date || e.created || '').slice(0, 7);
  expMonths.set(m, (expMonths.get(m) || 0) + Number(e.amount || 0));
}
li(`支出覆盖月份: ${[...expMonths.keys()].sort().join(', ') || '(无)'}`);

// ============ C. 资金侧 ============
h('C. 资金侧 —— 银行和现金');
const bankAccts = await g('/collections/bank_accounts/records?perPage=200').then(r => (r.items || []).filter(x => !x.deleted)).catch(() => []);
const bankTx = await g('/collections/bank_transactions/records?perPage=1').then(r => r.totalItems || 0).catch(() => 0);
li(bankTx ? `✅ 已导入银行流水 ${bankTx} 条(账户 ${bankAccts.length} 个) → 可做银行对账` : `⚠️ **没有银行流水导入**（账户已建 ${bankAccts.length} 个，流水 0 条）→ 银行对账页无真实数据可对`);
const cashAccts = bankAccts.filter(a => String(a.type || a.accountType || '').toLowerCase().includes('cash'));
li(cashAccts.length ? `✅ 有现金账户 ${cashAccts.length} 个` : `⚠️ **没有现金账户记录** → 现金收的学费无法核对(收款方式为现金的 ${D.payments.filter(p => p.method === 'Cash').length} 笔)`);

// ============ D. 报表/账套结构 ============
h('D. 账套结构 —— 做账还缺什么');
li(`现在只做了 **损益表(P&L)** 的口径: 收入 / 支出 / 薪资 / 利润`);
const voucherCov = [
  ['收款', D.payments], ['支出', D.expenses], ['退款', D.refunds],
].map(([n, arr]) => [n, arr.filter(x => x.voucher_no).length, arr.length]);
const voucherBad = voucherCov.filter(([, ok, all]) => all && ok < all);
li(voucherBad.length
  ? `⚠️ **凭证编号不齐**: ${voucherBad.map(([n, ok, all]) => `${n} ${ok}/${all}`).join(', ')}`
  : `✅ 凭证编号体系已启用（${voucherCov.filter(([, , all]) => all).map(([n, ok, all]) => `${n} ${ok}/${all}`).join(', ')}）`);
li(`⚠️ **资产负债表仅简版**: 财务报表页有「资产负债概览」(应收/累计收支)，缺 银行余额、现金、应付账款、固定资产、股东权益`);
li(`⚠️ **没有预收款概念**: 家长提前交的下月学费,现在直接算当月收入(会计上应记"预收账款")`);
li(`⚠️ **没有固定资产**: 桌椅、电脑、装修等没入账、没折旧`);
li(`⚠️ **没有应付账款**: 欠供应商的钱没记`);
li(`⚠️ **没有税务报表**: SST / 所得税 / PCB 汇总表`);

// ============ E. 数据质量 ============
h('E. 数据质量 —— 影响报表准确性的');
// 数据质量只看「在读」学生：毕业(graduated)/退学(withdrawn)的不影响报表口径，
// 之前把 14 位毕业生算成「没有年级」→ 每周误报一次。
const activeStu = D.students.filter(s => s.status === 'active');
const nonActive = D.students.filter(s => s.status && s.status !== 'active');
// 已知例外：黄俊鸿 Ethan Ng Junn Hong 的学号就是 'PU E'（老板确认是特例，别管）
const SID_EXCEPTIONS = ['PU E'];
const stuNoId = activeStu.filter(s => {
  const sid = String(s.student_id || '').trim();
  if (SID_EXCEPTIONS.includes(sid)) return false;
  return !sid || sid.length < 5;
});
li(stuNoId.length ? `⚠️ ${stuNoId.length} 个在讀学生学号不完整` : '✅ 在读学生学号完整（已知例外：Ethan 的「PU E」）');
const stuNoCenter = activeStu.filter(s => !s.centerId);
li(stuNoCenter.length ? `⚠️ ${stuNoCenter.length} 个在讀学生没有 centerId` : '✅ 在读学生都有 centerId');
const stuNoGrade = activeStu.filter(s => !s.grade);
li(stuNoGrade.length ? `⚠️ ${stuNoGrade.length} 个在讀学生没有年级` : '✅ 在读学生都有年级');
li(`ℹ️ 已跳过非在读学生 ${nonActive.length} 位（毕业/退学，不计入数据质量）`);
const salNoCenter = D.teacher_salary_records.filter(s => !s.centerId && !s.center);
li(salNoCenter.length ? `⚠️ ${salNoCenter.length} 条薪资没有分行 → 分行损益不准` : '✅ 薪资都挂了分行');

// ============ F. 结论 ============
h('F. 结论 —— 做账现在够不够');
const critical = [];
if (noProof.length) critical.push(`支出凭证缺失 ${noProof.length} 笔`);
if (!salMonths.has(curYm)) critical.push(`本月薪资未生成`);
if (orphanPay.length) critical.push(`孤儿收款 ${orphanPay.length} 笔`);
if (noPeriod.length) critical.push(`发票缺账期 ${noPeriod.length} 张`);
if (dupNums.length) critical.push(`票号重复 ${dupNums.length} 组`);
if (noMethod.length) critical.push(`收款缺付款方式 ${noMethod.length} 笔`);
li(critical.length ? `❗ **必须先补**: ${critical.join(' / ')}` : '✅ 没有致命缺口');
li(`报表清晰度: 收入/支出/薪资/利润 四项清楚,月度可切;**资产负债表仅简版(缺银行/现金/应付/固定资产)、无现金流表**`);

const out = R.join('\n');
const f = '/home/pjpc/pjpc-app-prod/reports/account-audit-latest.md';
fs.mkdirSync('/home/pjpc/pjpc-app-prod/reports', { recursive: true });
fs.writeFileSync(f, out);
// 留档快照,供下周对比"新问题"
const snap = `/home/pjpc/pjpc-app-prod/reports/account-audit-${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })}.md`;
if (!fs.existsSync(snap)) fs.writeFileSync(snap, out);
console.log(out);
console.log(`\n(已保存 → ${f})`);

// 与上一份快照对比: 只列变化项
try {
  const files = fs.readdirSync('/home/pjpc/pjpc-app-prod/reports')
    .filter(n => /^account-audit-\d{4}-\d{2}-\d{2}\.md$/.test(n)).sort();
  const prev = files.filter(n => n !== snap.split('/').pop()).pop();
  if (prev) {
    const old = fs.readFileSync(`/home/pjpc/pjpc-app-prod/reports/${prev}`, 'utf8');
    const metrics = (t) => {
      const m = {};
      const grab = (re, k) => { const x = t.match(re); if (x) m[k] = x[1]; };
      grab(/未收 RM ([\d.]+)/, '未收');
      grab(/开票总额 RM ([\d.]+)/, '开票');
      grab(/支出 ([\d.]+) 笔没有凭证/, '无凭证支出');
      grab(/薪资 (\d+) 条没有分行/, '薪资缺分行');
      grab(/(\d+) 个学生学号不完整/, '学号不完整');
      grab(/(\d+) 个学生没有年级/, '无年级');
      return m;
    };
    const a = metrics(old), b = metrics(out);
    const diffs = Object.keys(b).filter(k => a[k] !== b[k]).map(k => `${k}: ${a[k] ?? '?'} → ${b[k]}`);
    console.log(`\n【与上一份快照 ${prev} 对比】`);
    console.log(diffs.length ? diffs.map(d => `  • ${d}`).join('\n') : '  （无变化）');
  } else {
    console.log('\n（本日为首份快照，下周起可自动对比）');
  }
} catch (e) { console.log(`\n(快照对比失败: ${String(e).slice(0, 80)})`); }
