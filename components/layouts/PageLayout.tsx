"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export interface PageLayoutProps {
  title: string
  description: string
  backUrl?: string
  userRole: 'admin' | 'teacher' | 'parent' | 'accountant'
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
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理员'
      case 'teacher': return '老师'
      case 'parent': return '家长'
      case 'accountant': return '会计'
      default: return role
    }
  }

  return (
    <div className="space-y-4">
      {/* 页面标题栏（非 sticky，不走独立 header） */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {backUrl && (
            <Link href={backUrl}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
            <p className="text-sm text-gray-500 truncate">{description}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {status && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                {status}
              </Badge>
            )}
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              {getRoleLabel(userRole)}
            </Badge>
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* 主要内容 */}
      <div>{children}</div>
    </div>
  )
}
