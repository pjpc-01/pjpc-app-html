"use client"

import { cn } from "@/lib/utils"

/**
 * 骨架屏组件 — 加载时显示占位
 *
 * 用法：
 * <Skeleton className="h-4 w-[200px]" />
 * <Skeleton className="h-10 w-full rounded-lg" />
 *
 * 配合列表：
 * {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full mb-2 rounded-lg" />)}
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  )
}

/**
 * 表格行骨架屏 — 用于列表加载
 */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`r${r}-c${c}`} className="h-8 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * 卡片骨架屏 — 用于卡片视图加载
 */
export function CardSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * KPI 卡片骨架屏
 */
export function KpiSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
