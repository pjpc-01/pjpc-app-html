"use client"

/**
 * 页面标题旁边的「?」—— 打开就是这一页的说明 + mermaid 图 + 操作步骤。
 *
 * 设计取舍：
 * - 内容来自 lib/page-help.ts，PageLayout 用 usePathname() 自动取，页面不用改一行
 * - 一页可以有不止一张图（流程图 + 状态图），moreCharts 依次排下去
 * - mermaid 体积大（1MB+），只在第一次点开时 dynamic import，主 bundle 不变
 * - 单张图渲染失败只影响那一张（回退显示源码），不让整个弹窗白屏
 * - 用 useId 生成稳定 id，避免 mermaid.render 撞 id
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { HelpCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { helpFor, fallbackHelp, type PageHelp } from "@/lib/page-help"

type Rendered = { src: string; svg: string; error: string }

export default function PageHelpButton({ title, description }: { title: string; description?: string }) {
  const pathname = usePathname() || "/"
  const { language } = useLanguage()
  const zh = language !== "en"
  const [open, setOpen] = useState(false)
  const [charts, setCharts] = useState<Rendered[]>([])
  const [loading, setLoading] = useState(false)
  const renderSeq = useRef(0)
  const uid = useId().replace(/[:]/g, "")

  const help: PageHelp = useMemo(() => helpFor(pathname) || fallbackHelp(title, description), [pathname, title, description])

  const sources = useMemo(() => {
    const list: string[] = []
    if (help.chart) list.push(help.chart)
    if (help.moreCharts?.length) list.push(...help.moreCharts)
    return list
  }, [help])

  const renderAll = useCallback(async () => {
    if (!sources.length) return
    const round = ++renderSeq.current
    setLoading(true)
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
      const out: Rendered[] = []
      for (let i = 0; i < sources.length; i++) {
        try {
          const { svg } = await mermaid.render(`pjpc-help-${uid}-${round}-${i}`, sources[i])
          out.push({ src: sources[i], svg, error: "" })
        } catch (e: any) {
          out.push({ src: sources[i], svg: "", error: String(e?.message || e).slice(0, 200) })
        }
      }
      if (round === renderSeq.current) setCharts(out)
    } finally {
      if (round === renderSeq.current) setLoading(false)
    }
  }, [sources, uid])

  useEffect(() => {
    if (open) renderAll()
  }, [open, renderAll])

  const steps = zh ? help.steps.zh : help.steps.en || help.steps.zh
  const tips = zh ? help.tips?.zh : help.tips?.en || help.tips?.zh

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
              {zh ? help.summary.zh : help.summary.en || help.summary.zh}
            </div>

            {sources.map((_, idx) => {
              const c = charts[idx]
              return (
                <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3 overflow-x-auto">
                  {c?.svg ? (
                    <div
                      className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: c.svg }}
                    />
                  ) : c?.error ? (
                    <div className="text-xs text-red-600 space-y-1">
                      <p>{zh ? "这张图渲染失败，下面是源码：" : "Diagram failed, source below:"}</p>
                      <pre className="whitespace-pre-wrap text-[11px] text-gray-600">{c.src}</pre>
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center text-xs text-gray-400">
                      {loading ? (zh ? "正在画图…" : "Rendering…") : ""}
                    </div>
                  )}
                </div>
              )
            })}

            <div>
              <p className="font-medium text-gray-900 mb-1">{zh ? "怎么用" : "How to use"}</p>
              <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>

            {tips && tips.length ? (
              <div>
                <p className="font-medium text-gray-900 mb-1">{zh ? "注意" : "Notes"}</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  {tips.map((s, i) => (
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
