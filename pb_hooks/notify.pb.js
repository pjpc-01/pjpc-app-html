/// <reference path="../pb_data/types.d.ts" />
//
// PJPC 站内通知自动触发（单源）
//
// 背景：notifications 表和右上角铃铛早就做好了，但库里一条都没有 ——
// 因为只有贡献/兑换那几个接口会写，请假审批、发票开出、收到付款、
// 考勤异常、成绩发布 这四个都没接，学生只能自己进系统翻。
//
// 这里在 PB 层接住，客户端不管是网页、刷卡机还是脚本发的写操作都会触发。
//
// ⚠️ 0.39.6 实测坑（沿用 main.pb.js 的经验）：
//   1. 顶层 function / const 不共享给 hook 回调 → 一切内联。
//   2. 取集合名只能 `e.record.collection().name`。
//   3. 改完文件要完整重启 PB，hooksWatch 不可靠。
//   4. 没绑定登录账号的学生（117 个没有账号）→ 静默跳过，不报错。
// 全程 try/catch：通知失败绝不能把业务写挂。

// ── 1) 新增类事件：发票 / 收款 / 成绩 / 月测 / 考勤异常 ──
onRecordAfterCreateSuccess((e) => {
  try {
    const app = e.app || $app;
    const rec = e.record;
    let cname = "";
    try { cname = rec && rec.collection ? rec.collection().name : ""; } catch (x0) {}

    let sid = "";        // students.id
    let title = "";
    let body = "";
    let kind = "system";

    if (cname === "invoices") {
      sid = String(rec.get("studentId") || "");
      const no = String(rec.get("invoiceNumber") || "");
      const amt = Number(rec.get("totalAmount") || rec.get("amount") || 0);
      const period = String(rec.get("period") || "");
      const st = String(rec.get("status") || "");
      if (st === "draft") return; // 草稿不给学生看
      title = "新发票 " + no;
      body = "金额 RM " + amt.toFixed(2) + (period ? "，账期 " + period : "") + "。请查收并按期缴付。";
      kind = "invoice";
    } else if (cname === "payments") {
      const amt = Number(rec.get("amount") || 0);
      const invId = String(rec.get("invoiceId") || "");
      if (invId) {
        try {
          const inv = app.findRecordById("invoices", invId);
          if (inv) sid = String(inv.get("studentId") || "");
        } catch (x1) {}
      }
      if (!sid) return;
      title = "已收到付款 RM " + amt.toFixed(2);
      body = "付款日期 " + String(rec.get("date") || "").slice(0, 10) + "，方式 " + String(rec.get("method") || "—") + "。谢谢！";
      kind = "payment";
    } else if (cname === "grades") {
      sid = String(rec.get("studentId") || "");
      const subj = String(rec.get("subject") || "");
      const score = rec.get("score");
      title = "新成绩：" + subj;
      body = "成绩 " + score + " 分" + (String(rec.get("term") || "") ? "（" + String(rec.get("term")) + "）" : "") + "。去「成绩报告」看细节。";
      kind = "grade";
    } else if (cname === "monthly_test_scores") {
      sid = String(rec.get("studentId") || "");
      const subj = String(rec.get("subject") || "");
      const score = rec.get("score");
      const full = rec.get("full_marks") || 100;
      title = "月测成绩：" + subj;
      body = score + " / " + full + (String(rec.get("month") || "") ? "（" + String(rec.get("month")) + "）" : "") + "。";
      kind = "grade";
    } else if (cname === "student_attendance") {
      const st = String(rec.get("status") || "");
      if (st !== "absent" && st !== "late") return; // 正常打卡不打扰
      sid = String(rec.get("student_id") || "");
      title = st === "absent" ? "今天缺勤登记" : "今天迟到登记";
      body = String(rec.get("date") || "").slice(0, 10) + (rec.get("check_in") ? "，签到 " + String(rec.get("check_in")).slice(11, 16) : "") + "。不是本人的话请尽快告知中心。";
      kind = "attendance";
    } else {
      return;
    }

    if (!sid) return;

    // students.id → 登录账号
    let uid = "";
    try {
      const us = app.findRecordsByFilter("users", "student_id = {:sid}", "", 1, 0, { sid: sid });
      if (us && us.length > 0) uid = String(us[0].id || "");
    } catch (x2) {}
    if (!uid) return; // 这学生没账号 → 不写

    const coll = app.findCollectionByNameOrId("notifications");
    if (!coll) return;
    const n = new Record(coll);
    n.set("user", uid);
    n.set("student", sid);
    n.set("title", title.slice(0, 200));
    n.set("body", body.slice(0, 1000));
    n.set("kind", kind);
    n.set("link", "");
    n.set("read", false);
    n.set("actor", "系统自动");
    try { n.set("center", String(rec.get("center") || "")); } catch (x3) {}
    app.save(n);
  } catch (err) {
    // 通知失败不影响业务写入
  }
  e.next();
}, "invoices", "payments", "grades", "monthly_test_scores", "student_attendance")

// ── 2) 请假审批结果 ──
onRecordAfterUpdateSuccess((e) => {
  try {
    const app = e.app || $app;
    const rec = e.record;
    let cname = "";
    try { cname = rec && rec.collection ? rec.collection().name : ""; } catch (x0) {}
    if (cname !== "student_leave_record") return;

    let oldStatus = "";
    try { oldStatus = String(rec.original().get("status") || ""); } catch (x1) {}
    const newStatus = String(rec.get("status") || "");
    if (oldStatus === newStatus) return;
    if (newStatus !== "approved" && newStatus !== "rejected") return;

    const sid = String(rec.get("student_id") || "");
    if (!sid) return;

    let uid = "";
    try {
      const us = app.findRecordsByFilter("users", "student_id = {:sid}", "", 1, 0, { sid: sid });
      if (us && us.length > 0) uid = String(us[0].id || "");
    } catch (x2) {}
    if (!uid) return;

    const coll = app.findCollectionByNameOrId("notifications");
    if (!coll) return;
    const n = new Record(coll);
    n.set("user", uid);
    n.set("student", sid);
    n.set("title", newStatus === "approved" ? "请假已批准" : "请假未通过");
    const d1 = String(rec.get("start_date") || "").slice(0, 10);
    const d2 = String(rec.get("end_date") || "").slice(0, 10);
    let body = d1 + (d2 && d2 !== d1 ? " 至 " + d2 : "") + " 的请假申请";
    if (newStatus === "approved") {
      body += "已批准。";
    } else {
      body += "未通过" + (String(rec.get("rejection_reason") || "") ? "：" + String(rec.get("rejection_reason")) : "。");
    }
    n.set("body", body.slice(0, 1000));
    n.set("kind", "leave");
    n.set("link", "/my/leave");
    n.set("read", false);
    n.set("actor", String(rec.get("approved_by") || "老师"));
    try { n.set("center", String(rec.get("center") || "")); } catch (x3) {}
    app.save(n);
  } catch (err) {
  }
  e.next();
}, "student_leave_record")
