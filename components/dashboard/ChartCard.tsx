"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon, Inbox } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface ChartCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  isEmpty?: boolean
  loading?: boolean
  children: React.ReactNode
  className?: string
}

export default function ChartCard({
  title,
  description,
  icon: Icon,
  isEmpty = false,
  loading = false,
  children,
  className = "",
}: ChartCardProps) {
  const { t } = useLanguage()
  return (
    <Card className={`border-amber-200/60 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          {Icon && <Icon className="h-4 w-4 text-amber-600" />}
          {title}
        </CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[260px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
              <p className="mt-2 text-xs">{t('teacher.loading')}</p>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex h-[260px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Inbox className="h-10 w-10 mx-auto mb-2 text-amber-300" />
              <p className="text-sm">{t('parent.no_data')}</p>
            </div>
          </div>
        ) : (
          <div className="h-[260px] w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
