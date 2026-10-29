"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export interface PageLayoutProps {
  title: string
  description?: string
  backUrl?: string
  userRole?: 'admin' | 'teacher' | 'parent' | 'accountant'
  status?: string
  background?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function PageLayout({
  title,
  description,
  backUrl,
  userRole,
  status,
  background = "from-gray-50 to-gray-100",
  actions,
  children,
}: PageLayoutProps) {
  const router = useRouter()
  // 返回按钮：有站内历史就真的回上一页；直接打开这一页(没有历史)才去 backUrl。
  // 不能用 history.length > 1 判断 —— 只要浏览器开过一次它就 > 1，于是「返回」会把人弹回首页。
  const goBack = () => {
    if (typeof window === "undefined") return
    const idx = (window.history.state && typeof window.history.state.idx === "number") ? window.history.state.idx : 0
    if (idx > 0) window.history.back()
    else router.push(backUrl || "/")
  }
  return (
    <div className="space-y-4">
      {/* 页面标题栏 */}
      {/* 手机端左上角有汉堡按钮，标题行需让位（lg 起无汉堡） */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pl-10 lg:pl-0">
        <div className="flex items-center gap-3 min-w-0">
          {backUrl && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
            <p className="text-sm text-gray-500 truncate">{description}</p>
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* 主要内容 */}
      <div>{children}</div>
    </div>
  )
}
