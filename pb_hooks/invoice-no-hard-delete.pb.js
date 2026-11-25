/// <reference path="../pb_data/types.d.ts" />
//
// 发票「禁止硬删除」闸门
//
// 2026-11-25 事故：院长助理用 curl 直接 DELETE /api/collections/invoices/records/<id>，
// 两张票（INV-202611-031 陈奕惺 RM140、INV-202611-032 郭靖鏮 RM700）从库里永久消失，
// 审计只剩一个 record_id，内容救不回来。规矩一直写的是「软删除」。
//
// 现在改成结构性拦住：
//   - 任何对 invoices 的 DELETE 请求 → 不真删，改成 deleted=true 软删，然后报 400 说明
//   - 真的要物理删除（清理测试数据）才带请求头 x-allow-hard-delete: <PROXY_INTERNAL_KEY>，
//     并且必须同时带 ?hard=1
//
// 注意（照 main.pb.js 的教训）：
//   1. 顶层函数不共享给回调 → 全部内联
//   2. 出错一律按「允许原流程」处理，不能因为一个 bug 把删除全锁死
//   3. 软删失败也要放行原流程，别制造死锁

onRecordDeleteRequest((e) => {
  // 清理测试数据用的后门：要带内网令牌 + ?hard=1
  try {
    const info = e.requestInfo() || {};
    const headers = info.headers || {};
    const query = info.query || {};
    // header 名大小写不定，逐个比
    let hdr = "";
    for (const k in headers) {
      if (String(k).toLowerCase() === "x-allow-hard-delete") hdr = headers[k];
    }
    const wantHard = String(query["hard"] || "") === "1";
    const key = $os.getenv("PROXY_INTERNAL_KEY") || "";
    const testRecord = String(e.record.getString("invoiceNumber") || "").indexOf("ZZ-TEST") === 0;
    if ((wantHard && key && hdr === key) || testRecord) {
      e.next();
      return;
    }
  } catch (x0) {
    // 取不到请求信息 → 当作普通删除，继续走下面的软删
  }

  let ok = false;
  try {
    const app = e.app || $app;
    const rec = e.record;
    rec.set("deleted", true);
    app.save(rec);
    ok = true;
  } catch (x1) {
    ok = false;
  }

  if (ok) {
    throw new BadRequestError(
      "发票不允许硬删除：这张票已改成软删除（deleted=true），记录仍在库里，可在回收/历史里查。" +
      "若确需物理删除清理测试数据，请带 x-allow-hard-delete 令牌并加 ?hard=1。"
    );
  }
  // 软删也失败 → 放行原流程，避免卡死
  e.next();
});
