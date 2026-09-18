/// <reference path="../pb_data/types.d.ts" />
//
// PJPC 审计日志 —— 任何写操作自动落一条 audit_logs（何时、改哪条、前后值、来源）
//
// 背景：出现过「薪资记录少了 7 条，查不出是谁删的」——PB 自带请求日志只有
// userAgent=node（请求都经 Next 代理），区分不了浏览器 / agent / 脚本。
//
// ⚠️ PB JSVM 实测坑（0.39.6，都踩过）：
//   1. 顶层 function / const 不共享给 hook 回调（甚至影响加载）→ 一切内联。
//   2. `e.collection` 是 undefined；`e.record.collectionName` 也不存在
//      → 取集合名只能用 `e.record.collection().name`。
//   3. 改完文件要**完整重启 PB**，hooksWatch 的自动重载不可靠。
// 全程 try/catch：审计失败绝不影响业务。

onRecordAfterCreateSuccess((e) => {
  try {
    const app = e.app || $app;
    const rec = e.record;
    let cname = "";
    try { cname = rec && rec.collection ? rec.collection().name : ""; } catch (x0) {}
    if (app && rec && cname && cname !== "audit_logs") {
      const coll = app.findCollectionByNameOrId("audit_logs");
      if (coll) {
        const a = new Record(coll);
        a.set("action", "create:" + cname);
        a.set("description", cname + " #" + rec.id);
        let actor = "";
        try {
          if (e.httpContext && typeof e.httpContext.request === "function") {
            const h = e.httpContext.request().header;
            if (h) actor = String(h.get("x-actor") || h.get("user-agent") || "");
          }
        } catch (x) {}
        if (actor) a.set("user_name", actor.slice(0, 500));
        a.set("metadata", JSON.stringify({ collection: cname, record_id: rec.id, action: "create" }));
        app.save(a);
      }
    }
  } catch (err) {
    console.log("[audit] create 失败(已忽略): " + err);
  }
  e.next();
});

onRecordAfterUpdateSuccess((e) => {
  try {
    const app = e.app || $app;
    const rec = e.record;
    let cname = "";
    try { cname = rec && rec.collection ? rec.collection().name : ""; } catch (x0) {}
    if (app && rec && cname && cname !== "audit_logs") {
      let changes = {};
      let hasChange = false;
      try {
        const orig = rec.original();
        const fields = rec.collection().fields;
        for (let i = 0; i < fields.length; i++) {
          const k = fields[i].name;
          if (k === "updated" || k === "created" || k === "id") continue;
          const nowV = rec.get(k);
          const wasV = orig ? orig.get(k) : undefined;
          if (JSON.stringify(nowV) !== JSON.stringify(wasV)) {
            changes[k] = { from: wasV, to: nowV };
            hasChange = true;
          }
        }
      } catch (x) {}
      if (hasChange) {
        const coll = app.findCollectionByNameOrId("audit_logs");
        if (coll) {
          const a = new Record(coll);
          a.set("action", "update:" + cname);
          a.set("description", cname + " #" + rec.id);
          let actor = "";
          try {
            if (e.httpContext && typeof e.httpContext.request === "function") {
              const h = e.httpContext.request().header;
              if (h) actor = String(h.get("x-actor") || h.get("user-agent") || "");
            }
          } catch (x) {}
          if (actor) a.set("user_name", actor.slice(0, 500));
          a.set("description", cname + " #" + rec.id + " | " + JSON.stringify(changes).slice(0, 800));
          a.set("metadata", JSON.stringify({ collection: cname, record_id: rec.id, action: "update", changes: changes }));
          app.save(a);
        }
      }
    }
  } catch (err) {
    console.log("[audit] update 失败(已忽略): " + err);
  }
  e.next();
});

onRecordAfterDeleteSuccess((e) => {
  try {
    const app = e.app || $app;
    const rec = e.record;
    let cname = "";
    try { cname = rec && rec.collection ? rec.collection().name : ""; } catch (x0) {}
    if (app && rec && cname && cname !== "audit_logs") {
      const coll = app.findCollectionByNameOrId("audit_logs");
      if (coll) {
        const a = new Record(coll);
        a.set("action", "delete:" + cname);
        a.set("description", cname + " #" + rec.id);
        let actor = "";
        try {
          if (e.httpContext && typeof e.httpContext.request === "function") {
            const h = e.httpContext.request().header;
            if (h) actor = String(h.get("x-actor") || h.get("user-agent") || "");
          }
        } catch (x) {}
        if (actor) a.set("user_name", actor.slice(0, 500));
        a.set("metadata", JSON.stringify({ collection: cname, record_id: rec.id, action: "delete" }));
        app.save(a);
      }
    }
  } catch (err) {
    console.log("[audit] delete 失败(已忽略): " + err);
  }
  e.next();
});

// ============================================================================
// 凭证编号自动生成 —— payments / expenses / refunds 创建时自动填 voucher_no
//   格式：RCV-YYYYMM-001（收款）/ EXP-YYYYMM-001（支出）/ REF-YYYYMM-001（退款）
//   发票 INV-、收据 RCP-、薪资 PS- 已有各自生成逻辑，此处不重复。
//   已有的 invoiceNumber 等字段保持不动，voucher_no 只补缺失的单据类型。
// ============================================================================
onRecordCreateRequest((e) => {
  try {
    const rec = e.record;
    let cname = "";
    try { cname = rec && rec.collection ? rec.collection().name : ""; } catch (x0) {}
    if (rec && cname) {
      let prefix = "";
      if (cname === "payments") { prefix = "RCV"; }
      else if (cname === "expenses") { prefix = "EXP"; }
      else if (cname === "refunds") { prefix = "REF"; }
      if (prefix !== "") {
        let cur = "";
        try { cur = String(rec.get("voucher_no") || ""); } catch (xg) {}
        if (cur === "") {
          const d = new Date();
          let mm = String(d.getMonth() + 1);
          if (mm.length < 2) { mm = "0" + mm; }
          const head = prefix + "-" + String(d.getFullYear()) + mm + "-";
          let n = 0;
          try {
            const list = $app.findRecordsByFilter(cname, "voucher_no ~ '" + head + "'", "-voucher_no", 1, 0);
            if (list && list.length > 0) {
              const last = String(list[0].get("voucher_no") || "");
              const tail = last.substring(head.length);
              const num = parseInt(tail, 10);
              if (!isNaN(num)) { n = num; }
            }
          } catch (x2) {}
          n = n + 1;
          let seq = String(n);
          while (seq.length < 3) { seq = "0" + seq; }
          rec.set("voucher_no", head + seq);
        }
      }
    }
  } catch (err) {
    console.log("[voucher] 生成失败(已忽略): " + err);
  }
  e.next();
});
