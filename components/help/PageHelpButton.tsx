"use client"

/**
 * 页面标题旁边的「?」—— 打开就是这一页的说明 + mermaid 流程图 + 操作步骤。
 *
 * 设计取舍：
 * - 内容来自 lib/page-help.ts，PageLayout 用 usePathname() 自动取，页面不用改一行
 * - mermaid 体积大（1MB+），只在第一次点开时 dynamic import，主 bundle 不变
 * - 渲染失败（语法错误等）只显示源码，不让整个弹窗白屏
 * - identity 用 useId 生成的稳定 id，避免 mermaid.render 撞 id
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { HelpCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { helpFor, fallbackHelp, type PageHelp } from "@/lib/page-help"

export default function PageHelpButton({ title, description }: { title: string; description?: string }) {
  const pathname = usePathname() || "/"
  const { language } = useLanguage()
  const zh = language !== "en"
  const [open, setOpen] = useState(false)
  const [svg, setSvg] = useState("")
  const [error, setError] = useState("")
  const renderSeq = useRef(0)
  const uid = useId().replace(/[:]/g, "")

  const help: PageHelp = useMemo(() => helpFor(pathname) || fallbackHelp(title, description), [pathname, title, description])

  const renderChart = useCallback(async () => {
    if (!help.chart) return
    const seq = ++renderSeq.current
    setError("")
    setSvg("")
    try {
      const mermaid = (await import("mermaid")).default
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: "inherit",
        themeVariables: {
          primaryColor: "#f1f5f9",
          primaryBorderColor: "#cbd5e1",
          primaryTextColor: "#0f172a",
          lineColor: "#94a3b8",
          fontSize: "14px",
        },
        flowchart: { curve: "basis", htmlLabels: true, padding: 12 },
      })
      const { svg: out } = await mermaid.render(`pjpc-help-${uid}-${seq}`, help.chart)
      if (seq === renderSeq.current) setSvg(out)
    } catch (e: any) {
      if (seq === renderSeq.current) setError(String(e?.message || e).slice(0, 300))
    }
  }, [help.chart, uid])

  useEffect(() => {
    if (open) renderChart()
  }, [open, renderChart])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={zh ? "这一页怎么用" : "How to use this page"}
        aria-label={zh ? "这一页怎么用" : "How to use this page"}
        className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full border border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-blue-900">
              {zh ? help.summary.zh : (help.summary.en || help.summary.zh)}
            </div>

            {help.chart && (
              <div className="rounded-lg border border-gray-200 bg-white p-3 overflow-x-auto">
                {svg ? (
                  <div
                    className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                ) : error ? (
                  <div className="text-xs text-red-600 space-y-1">
                    <p>{zh ? "流程图渲染失败，下面是源码：" : "Diagram failed to render, source below:"}</p>
                    <pre className="whitespace-pre-wrap text-[11px] text-gray-600">{help.chart}</pre>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-xs text-gray-400">
                    {zh ? "正在画流程图…" : "Rendering diagram…"}
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="font-medium text-gray-900 mb-1">{zh ? "怎么用" : "How to use"}</p>
              <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                {(zh ? help.steps.zh : (help.steps.en || help.steps.zh)).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>

            {help.tips && (help.tips.zh?.length || help.tips.en?.length) ? (
              <div>
                <p className="font-medium text-gray-900 mb-1">{zh ? "注意" : "Notes"}</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  {(zh ? help.tips.zh : (help.tips.en || help.tips.zh))?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
