/// <reference path="../pb_data/types.d.ts" />
//
// 发票学号自动对齐（2026-11-25）
//
// 事故：批量开票出来 84 张票的 studentNumber 是空的，票面上学号那栏显示「-」；
// 还有几张写错（徐誉洋的票印着沈仁平的 BT B34）。
//
// 根因：开票的路径不止一条（网页批量、学费矩阵、助理、脚本），谁都有可能漏传 studentNumber。
// 所以在数据库层兜底：只要票上有 studentId，就把学生的 student_id 同步进 studentNumber。
//
// 注意（照 main.pb.js 的教训）：
//   1. 顶层函数不共享给回调 → 内联
//   2. 任何异常一律放行，绝不能让开票/改票失败

onRecordCreateRequest((e) => {
  try {
    const rec = e.record;
    // 只处理 invoices；别的集合没 studentNumber 这个字段
    let col = "";
    try { col = rec.collection().name; } catch (xCol) { col = (e.collection && e.collection.name) || ""; }
    if (col && col !== "invoices") { e.next(); return; }
    const sid = rec.getString("studentId");
    if (sid) {
      const app = e.app || $app;
      const st = app.findRecordById("students", sid);
      const no = st.getString("student_id") || "";
      if (no) rec.set("studentNumber", no);
    }
  } catch (x0) {
    // 找不到学生 / 字段不存在 → 保持原样，不挡开票
  }
  e.next();
});

onRecordUpdateRequest((e) => {
  try {
    const rec = e.record;
    let col = "";
    try { col = rec.collection().name; } catch (xCol) { col = (e.collection && e.collection.name) || ""; }
    if (col && col !== "invoices") { e.next(); return; }
    const sid = rec.getString("studentId");
    if (sid) {
      const app = e.app || $app;
      const st = app.findRecordById("students", sid);
      const no = st.getString("student_id") || "";
      if (no && rec.getString("studentNumber") !== no) rec.set("studentNumber", no);
    }
  } catch (x1) {
    // 同上，放行
  }
  e.next();
});
