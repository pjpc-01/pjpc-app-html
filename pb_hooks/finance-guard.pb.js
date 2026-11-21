/// <reference path="../pb_data/types.d.ts" />
//
// 财务 / 薪资 的两条硬规矩（2026-11-21 加）
//
//  1. 已收过钱的发票不能直接作废 —— 钱会变成无主
//  2. 已发薪（status=paid）的薪资记录，金额字段锁死，要改先退回草稿
//
// ⚠️ 照 monthly-lock.pb.js 的三条铁律：
//   1. 顶层 function/const 不共享给 hook 回调 → 一切内联
//   2. 只拦 update request（新建不拦）
//   3. **出错一律放行**：查不到、解析失败 → 当没锁，绝不能因为一个 bug 把写入全锁死

// ── 发票：作废前必须有"钱已处理"的出口 ─────────────────────
onRecordUpdateRequest((e) => {
  let block = false;
  let paid = 0;
  try {
    const app = e.app || $app;
    const nextStatus = String(e.record.getString("status") || "");
    let prevStatus = "";
    try { prevStatus = String(e.record.original().getString("status") || "") } catch (x0) {}
    if (nextStatus === "cancelled" && prevStatus !== "cancelled") {
      const rows = app.findRecordsByFilter(
        "payments",
        'invoiceId = "' + e.record.id + '" && deleted != true && status != "failed"',
        "", 200, 0);
      if (rows && rows.length) {
        for (let i = 0; i < rows.length; i++) {
          paid += Number(rows[i].getFloat("amount") || 0);
        }
      }
      block = paid > 0.005;
    }
  } catch (x1) { block = false; }
  if (block) {
    throw new BadRequestError(
      "这张票已经收过 RM" + paid.toFixed(2) + "，不能直接作废。" +
      "先把这笔钱转成下期抵扣（或走退款登记），再来作废。");
  }
  e.next();
}, "invoices")

// ── 薪资：已发薪的金额字段锁死 ──────────────────────────────
onRecordUpdateRequest((e) => {
  let block = false;
  let changed = "";
  try {
    let prevStatus = "";
    try { prevStatus = String(e.record.original().getString("status") || "") } catch (x0) {}
    if (prevStatus === "paid") {
      // 允许：改备注、改银行流水号、状态退回 draft / approved
      // 禁止：动任何金额、工时、月份、教师
      const moneyFields = [
        "base_salary", "allowances", "allowance_travel", "bonus", "commission",
        "overtime_pay", "gross_salary", "net_salary",
        "epf_deduction", "socso_deduction", "eis_deduction", "tax_deduction", "other_deductions",
        "hours_worked", "overtime_hours", "month", "year", "teacher_id"
      ];
      const orig = e.record.original();
      for (let i = 0; i < moneyFields.length; i++) {
        const f = moneyFields[i];
        const before = String(orig.get(f));
        const after = String(e.record.get(f));
        if (before !== after) { changed = f; break; }
      }
      const beforeItems = JSON.stringify(orig.get("allowance_items") || []);
      const afterItems = JSON.stringify(e.record.get("allowance_items") || []);
      if (!changed && beforeItems !== afterItems) changed = "allowance_items";
      const beforeBonus = JSON.stringify(orig.get("bonus_items") || []);
      const afterBonus = JSON.stringify(e.record.get("bonus_items") || []);
      if (!changed && beforeBonus !== afterBonus) changed = "bonus_items";
      block = changed !== "";
    }
  } catch (x1) { block = false; }
  if (block) {
    throw new ForbiddenError(
      "这条薪资已经是「已发薪」，金额不能改（改的是 " + changed + "）。" +
      "真的算错了：先把状态退回「草稿」，改完再批准、发薪 —— 退回这一步会留在审计记录里。");
  }
  e.next();
}, "teacher_salary_records")
