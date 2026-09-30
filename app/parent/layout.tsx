"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, GraduationCap, CreditCard, Bell, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context";

const NAV_ITEMS = [
  { href: "/parent/dashboard", label: "首页", icon: Home },
  { href: "/parent/attendance", label: "孩子", icon: Users },
  { href: "/parent/grades", label: "成绩", icon: GraduationCap },
  { href: "/parent/payments", label: "缴费", icon: CreditCard },
  { href: "/parent/notifications", label: "通知", icon: Bell },
]

const TITLES: Record<string, string> = {
  "/parent/dashboard": "首页",
  "/parent/attendance": "孩子",
  "/parent/grades": "成绩",
  "/parent/payments": "缴费",
  "/parent/notifications": "通知",
  "/parent/dailylogs": "每日日志",
  "/parent/leave": "请假申请",
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname()
  const title = TITLES[pathname] || "家长门户"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="h-12 flex items-center pl-10 lg:pl-4 pr-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-gray-900">{t("家长门户")}</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">{title}</span>
          </div>
        </div>
      </header>

      {/* 内容区 — 为顶部栏和底部 Tab 栏留出空间 */}
      <main className="pt-12 pb-28 sm:pb-32 max-w-3xl mx-auto">
        {children}
      </main>

      {/* 底部 Tab 栏 — 固定底部，5 项 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="mx-auto max-w-xl">
          <div className="grid grid-cols-5">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === "/parent/attendance" && pathname === "/parent/dailylogs") ||
                (item.href === "/parent/attendance" && pathname === "/parent/leave")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] transition-colors",
                    "pb-[calc(0.625rem+env(safe-area-inset-bottom))]",
                    active
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}