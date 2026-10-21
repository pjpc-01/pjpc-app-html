"use client"

/**
 * PDF → 图片（浏览器端）
 *
 * 报告里上传的 PDF 只显示成一个附件卡片，内容看不到。这里用 pdf.js 把 PDF 每一页
 * 渲染成 JPEG dataURL，交给 generateReportHTML 当成图片插进报告（预览 + 导出 PDF 都可见）。
 *
 * ⚠️ 一定要在父层（React）先渲染好再传进 generateReportHTML —— 不要放进 iframe 里异步渲染，
 *    否则 html2canvas 截图时会跟渲染赛跑，导出 PDF 出现空白页。
 * ⚠️ worker 必须放在 public/ 下（public/pdf.worker.min.mjs），否则 pdf.js 在 next 里会报
 *    "Setting up fake worker failed"。
 */

let pdfjsPromise: Promise<any> | null = null

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((m: any) => {
      const lib = m.default || m
      lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
      return lib
    })
  }
  return pdfjsPromise
}

/** 一个 PDF 档名 → 各页的 JPEG dataURL 数组 */
export type PdfPageImages = Record<string, string[]>

/**
 * 把 URL 指向的 PDF 渲染成 dataURL 数组。
 * @param url   可直接 fetch 的 URL（走 proxy 的 /api/files/...）
 * @param maxPages 最多渲染几页（默认 8，防止大档案把页面拖死）
 * @param scale  渲染倍率（2 ≈ 清晰；调小=档案小）
 */
export async function renderPdfPages(url: string, maxPages = 8, scale = 2): Promise<string[]> {
  if (typeof window === "undefined") return []
  const pdfjsLib = await loadPdfjs()
  let doc: any = null
  try {
    doc = await pdfjsLib.getDocument({ url }).promise
    const out: string[] = []
    const n = Math.min(doc.numPages, maxPages)
    for (let i = 1; i <= n; i++) {
      const page = await doc.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement("canvas")
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext("2d")
      if (!ctx) continue
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise
      out.push(canvas.toDataURL("image/jpeg", 0.85))
      page.cleanup?.()
    }
    return out
  } finally {
    try { await doc?.destroy() } catch { /* noop */ }
  }
}

/** 报告有多个 PDF 时，一次全部渲染好 */
export async function renderAllReportPdfs(
  jobs: { filename: string; url: string }[],
  maxPages = 8,
  scale = 2,
): Promise<PdfPageImages> {
  const result: PdfPageImages = {}
  for (const j of jobs) {
    try {
      result[j.filename] = await renderPdfPages(j.url, maxPages, scale)
    } catch (e: any) {
      const msg = (e && (e.message || e.name)) || String(e)
      console.error("[pdf-raster] 渲染失败:", j.filename, "→", msg, e)
      result[j.filename] = []
    }
  }
  return result
}
