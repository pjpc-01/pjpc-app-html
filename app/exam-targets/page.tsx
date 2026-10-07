"use client"

import { useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Maximize2, LayoutGrid, Users } from "lucide-react"
import ExamTargetsWidget from "@/components/dashboard/ExamTargetsWidget"

export default function ExamTargetsPage() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<"overview" | "rotate">("overview")
  const [interval, setIntervalSec] = useState(7)

  const goFullscreen = () => {
    const el = document.getElementById("exam-targets-stage")
    el?.requestFullscreen?.()
  }

  return (
    <PageLayout
      title={t("考试目标")}
      description={t("学生各科考试目标 · 可全屏放映（幻灯片）")}
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant={mode === "overview" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("overview")}
        >
          <LayoutGrid className="h-4 w-4 mr-1" />{t("全班总览")}
        </Button>
        <Button
          variant={mode === "rotate" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("rotate")}
        >
          <Users className="h-4 w-4 mr-1" />{t("每人轮播")}
        </Button>
        {mode === "rotate" && (
          <div className="flex items-center gap-1 ml-1">
            <span className="text-xs text-gray-500">{t("每页停留")}</span>
            {[5, 7, 10, 15].map(n => (
              <button
                key={n}
                onClick={() => setIntervalSec(n)}
                className={`text-xs px-2 py-0.5 rounded ${interval === n ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}
              >
                {n}s
              </button>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" className="ml-auto" onClick={goFullscreen}>
          <Maximize2 className="h-4 w-4 mr-1" />{t("全屏放映")}
        </Button>
      </div>

      <div
        id="exam-targets-stage"
        className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 min-h-[560px] flex flex-col"
      >
        <div className="flex-1 min-h-0">
          <ExamTargetsWidget settings={{ mode, interval }} />
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {t("数据来自「考试目标」表；每科 0 视为「尚未填写」显示为 —。目标改完刷新页面即可。")}
      </p>
    </PageLayout>
  )
}
