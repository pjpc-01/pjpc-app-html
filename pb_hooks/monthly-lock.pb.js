/// <reference path="../pb_data/types.d.ts" />
//
// 月度结账「锁」
//
// 已结账的月份，其发票 / 收款 / 薪资记录【禁止修改与删除】，
// 要改必须先到 财务 → 月度结账 反结账（会留痕）。
//
// ⚠️ 三条铁律（照 main.pb.js 的教训）：
//   1. 顶层 function / const 不共享给 hook 回调 → 一切内联。
//   2. 只拦 update / delete —— 新建不拦（新增业务不该被历史月份挡住）。
//   3. **出错一律放行**：查不到、解析失败、字段缺失 → 当没锁。
//      宁可不锁，也绝不能因为一个 bug 把全系统的写入锁死。

// ── 发票：改 ─────────────────────────────────────────────
onRecordUpdateRequest((e) => {
  let locked = false;
  let month = "";
  try {
    const app = e.app || $app;
    try { month = e.record.original().getString("period") } catch (x0) {}
    if (month) {
      const rows = app.findRecordsByFilter(
        "monthly_closings",
        'month = "' + month + '" && kind = "invoice" && status = "closed"',
        "", 1, 0);
      locked = rows && rows.length > 0;
    }
  } catch (x1) { locked = false; }
  if (locked) {
    throw new ForbiddenError("发票所属月份「" + month + "」已结账，不能修改。请先到 财务 → 月度结账 反结账。");
  }
  e.next(); // ← 必须调用，否则默认处理不会执行（改了/删了也等于没改）
}, "invoices")

// ── 发票：删 ─────────────────────────────────────────────
onRecordDeleteRequest((e) => {
  let locked = false;
  let month = "";
  try {
    const app = e.app || $app;
    try { month = e.record.getString("period") } catch (x0) {}
    if (month) {
      const rows = app.findRecordsByFilter(
        "monthly_closings",
        'month = "' + month + '" && kind = "invoice" && status = "closed"',
        "", 1, 0);
      locked = rows && rows.length > 0;
    }
  } catch (x1) { locked = false; }
  if (locked) {
    throw new ForbiddenError("发票所属月份「" + month + "」已结账，不能删除。请先到 财务 → 月度结账 反结账。");
  }
  e.next(); // ← 必须调用，否则默认处理不会执行（改了/删了也等于没改）
}, "invoices")

// ── 收款：改 ─────────────────────────────────────────────
onRecordUpdateRequest((e) => {
  let locked = false;
  let month = "";
  try {
    const app = e.app || $app;
    let invId = "";
    try { invId = e.record.original().getString("invoiceId") } catch (x0) {}
    if (invId) {
      const inv = app.findRecordById("invoices", invId);
      month = inv ? inv.getString("period") : "";
    }
    if (month) {
      const rows = app.findRecordsByFilter(
        "monthly_closings",
        'month = "' + month + '" && kind = "invoice" && status = "closed"',
        "", 1, 0);
      locked = rows && rows.length > 0;
    }
  } catch (x1) { locked = false; }
  if (locked) {
    throw new ForbiddenError("这笔收款属于已结账月份「" + month + "」，不能修改。请先反结账。");
  }
  e.next(); // ← 必须调用，否则默认处理不会执行（改了/删了也等于没改）
}, "payments")

// ── 收款：删 ─────────────────────────────────────────────
onRecordDeleteRequest((e) => {
  let locked = false;
  let month = "";
  try {
    const app = e.app || $app;
    let invId = "";
    try { invId = e.record.getString("invoiceId") } catch (x0) {}
    if (invId) {
      const inv = app.findRecordById("invoices", invId);
      month = inv ? inv.getString("period") : "";
    }
    if (month) {
      const rows = app.findRecordsByFilter(
        "monthly_closings",
        'month = "' + month + '" && kind = "invoice" && status = "closed"',
        "", 1, 0);
      locked = rows && rows.length > 0;
    }
  } catch (x1) { locked = false; }
  if (locked) {
    throw new ForbiddenError("这笔收款属于已结账月份「" + month + "」，不能删除。请先反结账。");
  }
  e.next(); // ← 必须调用，否则默认处理不会执行（改了/删了也等于没改）
}, "payments")

// ── 薪资：改 ─────────────────────────────────────────────
onRecordUpdateRequest((e) => {
  let locked = false;
  let month = "";
  try {
    const app = e.app || $app;
    try {
      const orig = e.record.original();
      const y = String(orig.getString("year") || "").trim();
      const m = String(orig.getString("month") || "").trim();
      if (y && m) month = y + "-" + (m.length === 1 ? "0" + m : m);
    } catch (x0) {}
    if (month) {
      const rows = app.findRecordsByFilter(
        "monthly_closings",
        'month = "' + month + '" && kind = "salary" && status = "closed"',
        "", 1, 0);
      locked = rows && rows.length > 0;
    }
  } catch (x1) { locked = false; }
  if (locked) {
    throw new ForbiddenError("薪资所属月份「" + month + "」已结账，不能修改。请到 人事 → 月度结账 反结账，或另开调整单。");
  }
  e.next(); // ← 必须调用，否则默认处理不会执行（改了/删了也等于没改）
}, "teacher_salary_records")

// ── 薪资：删 ─────────────────────────────────────────────
onRecordDeleteRequest((e) => {
  let locked = false;
  let month = "";
  try {
    const app = e.app || $app;
    try {
      const y = String(e.record.getString("year") || "").trim();
      const m = String(e.record.getString("month") || "").trim();
      if (y && m) month = y + "-" + (m.length === 1 ? "0" + m : m);
    } catch (x0) {}
    if (month) {
      const rows = app.findRecordsByFilter(
        "monthly_closings",
        'month = "' + month + '" && kind = "salary" && status = "closed"',
        "", 1, 0);
      locked = rows && rows.length > 0;
    }
  } catch (x1) { locked = false; }
  if (locked) {
    throw new ForbiddenError("薪资所属月份「" + month + "」已结账，不能删除。请先反结账。");
  }
  e.next(); // ← 必须调用，否则默认处理不会执行（改了/删了也等于没改）
}, "teacher_salary_records")
