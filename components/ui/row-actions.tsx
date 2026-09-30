"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type RowActionItem = {
  label: string
  icon?: LucideIcon
  onClick?: () => void
  destructive?: boolean
  disabled?: boolean
  hidden?: boolean
}

export type RowActionPrimary = {
  label?: string
  icon?: LucideIcon
  onClick?: () => void
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
}

/**
 * 表格行操作列的统一收束组件：1 个主操作按钮 + 一个「⋯」下拉菜单装其余操作。
 * - primary 不传时只渲染「⋯」（用于行点击即主操作、或需要极简的场景）。
 * - actions 为空时不渲染「⋯」，避免出现空菜单。
 * - destructive 项标红（text-red-600）。
 */
export function RowActions({
  primary,
  actions,
  align = "end",
  menuLabel = "更多操作",
}: {
  primary?: RowActionPrimary
  actions: (RowActionItem | false | null | undefined)[]
  align?: "start" | "center" | "end"
  menuLabel?: string
}) {
  const items = (actions.filter(Boolean) as RowActionItem[]).filter((a) => !a.hidden)

  return (
    <div className="flex items-center justify-end gap-1">
      {primary && (
        <Button
          variant={primary.variant || "outline"}
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={primary.onClick}
          aria-label={primary.label}
        >
          {primary.icon && <primary.icon className="h-3.5 w-3.5" />}
          {primary.label}
        </Button>
      )}
      {items.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={menuLabel}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align} className="min-w-[9rem]">
            {items.map((a) => (
              <DropdownMenuItem
                key={a.label}
                disabled={a.disabled}
                onClick={a.onClick}
                className={a.destructive ? "text-red-600 focus:text-red-700" : ""}
              >
                {a.icon && <a.icon className="h-4 w-4 mr-2" />}
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}