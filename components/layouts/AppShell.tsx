"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  UserCog,
  DollarSign,
  BookOpen,
  ClipboardCheck,
  Settings,
  GraduationCap,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  PiggyBank,
  Receipt,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  ChevronLeft,
  School,
  Calendar,
  FileText,
  UserCheck,
  CreditCard,
  HelpCircle,
  ChevronUp,
  Building2,
  PieChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ConnectionStatus from "@/components/ConnectionStatus"

type NavItem = {
  label: string
  href?: string
  icon: React.ElementType
  children?: NavItem[]
}

type RoleConfig = {
  title: string
  navItems: NavItem[]
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  admin: {
    title: "管理后台",
    navItems: [
      {
        label: "仪表板",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        label: "学生管理",
        icon: Users,
        children: [
          { label: "学生列表", href: "/student-management", icon: Users },
          { label: "成绩单", href: "/report-cards", icon: GraduationCap },
        ],
      },
      {
        label: "教师管理",
        href: "/teacher-management",
        icon: UserCog,
      },
      {
        label: "财务管理",
        icon: DollarSign,
        children: [
          { label: "财务概览", href: "/finance/overview", icon: PiggyBank },
          { label: "收费管理", href: "/finance/fees", icon: Receipt },
          { label: "发票付款", href: "/finance/payments", icon: ArrowLeftRight },
          { label: "支出/薪资", href: "/finance/expenses", icon: Wallet },
          { label: "银行对账", href: "/finance/bank", icon: Building2 },
          { label: "预算管理", href: "/finance/budget", icon: PieChart },
          { label: "财务报表", href: "/finance/reports", icon: BarChart3 },
        ],
      },
      {
        label: "课程管理",
        href: "/course-management",
        icon: BookOpen,
      },
      {
        label: "考勤系统",
        icon: ClipboardCheck,
        children: [
          { label: "学生签到", href: "/student-checkin", icon: UserCheck },
          { label: "教师签到", href: "/teacher-checkin", icon: UserCog },
          { label: "考勤报表", href: "/attendance-reports", icon: FileText },
        ],
      },
      {
        label: "课表管理",
        href: "/schedule-management",
        icon: Calendar,
      },
      {
        label: "系统设置",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
  teacher: {
    title: "教师工作台",
    navItems: [
      {
        label: "我的工作台",
        href: "/teacher-workspace",
        icon: LayoutDashboard,
      },
      {
        label: "我的课表",
        href: "/schedule-management",
        icon: Calendar,
      },
      {
        label: "学生签到",
        href: "/student-checkin",
        icon: UserCheck,
      },
      {
        label: "我的学生",
        href: "/student-management",
        icon: Users,
      },
      {
        label: "成绩管理",
        href: "/student-points",
        icon: BarChart3,
      },
    ],
  },
  parent: {
    title: "家长门户",
    navItems: [
      {
        label: "孩子总览",
        href: "/parent/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "成绩查询",
        href: "/parent/grades",
        icon: BarChart3,
      },
      {
        label: "缴费记录",
        href: "/parent/payments",
        icon: CreditCard,
      },
      {
        label: "出勤记录",
        href: "/parent/attendance",
        icon: ClipboardCheck,
      },
      {
        label: "通知消息",
        href: "/parent/notifications",
        icon: Bell,
      },
    ],
  },
  accountant: {
    title: "财务工作台",
    navItems: [
      {
        label: "财务概览",
        href: "/finance-management",
        icon: LayoutDashboard,
      },
      {
        label: "收费管理",
        href: "/finance-management",
        icon: Receipt,
      },
      {
        label: "交易记录",
        href: "/finance-management",
        icon: ArrowLeftRight,
      },
      {
        label: "薪资管理",
        href: "/finance-management",
        icon: Wallet,
      },
      {
        label: "财务报表",
        href: "/finance-management",
        icon: BarChart3,
      },
    ],
  },
}

interface AppShellProps {
  children: React.ReactNode
  userRole?: string
  userName?: string
  userAvatar?: string
}

export default function AppShell({
  children,
  userRole = "admin",
  userName = "Admin",
  userAvatar,
}: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  const config = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.admin
  const isActive = (href?: string) => {
    if (!href) return false
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // Auto-expand parent menu if a child is active
  useEffect(() => {
    config.navItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => isActive(child.href))
        if (hasActiveChild) {
          setExpandedMenus((prev) => new Set(prev).add(item.label))
        }
      }
    })
  }, [pathname, config.navItems])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0
    const expanded = expandedMenus.has(item.label)

    return (
      <div key={item.label}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleMenu(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                expanded
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{item.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {expanded && (
              <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                {item.children.map((child) => renderNavItem(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.href || "#"}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white shadow-sm border border-indigo-500/30"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            )}
          </Link>
        )}
      </div>
    )
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrator",
      teacher: "教师",
      parent: "家长",
      accountant: "会计",
    }
    return labels[role] || role
  }

  // Breadcrumb: map path to display label
  const BREADCRUMB_LABELS: Record<string, { label: string; parent?: string }> = {
    "/": { label: "仪表板" },
    "/student-management": { label: "学生管理" },
    "/teacher-management": { label: "教师管理" },
    "/finance-management": { label: "财务概览", parent: "财务管理" },
    "/finance/fees": { label: "收费管理", parent: "财务管理" },
    "/finance/transactions": { label: "交易记录", parent: "财务管理" },
    "/finance/payroll": { label: "薪资管理", parent: "财务管理" },
    "/finance/reports": { label: "财务报表", parent: "财务管理" },
    "/course-management": { label: "课程管理" },
    "/unified-attendance": { label: "考勤系统" },
    "/student-checkin": { label: "学生签到", parent: "考勤系统" },
    "/teacher-checkin": { label: "教师签到", parent: "考勤系统" },
    "/attendance-reports": { label: "考勤报表", parent: "考勤系统" },
    "/schedule-management": { label: "课表管理" },
    "/settings": { label: "系统设置" },
    "/teacher-workspace": { label: "我的工作台" },
    "/student-points": { label: "学生积分" },
    "/points-management": { label: "积分管理" },
    "/card-management": { label: "卡片管理" },
    "/resource-library": { label: "资源库" },
    "/payroll-management": { label: "薪资管理" },
    "/user-management": { label: "用户管理" },
    "/admin": { label: "系统设置" },
  }

  const getBreadcrumbs = () => {
    const crumbs: { label: string; href?: string }[] = []
    const info = BREADCRUMB_LABELS[pathname]
    if (info?.parent) {
      crumbs.push({ label: info.parent })
    }
    crumbs.push({ label: info?.label || pathname.replace("/", "") || "未知" })
    return crumbs
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <div className="fixed top-3 left-3 z-50 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h-9 w-9 p-0 bg-white/80 backdrop-blur-sm shadow-md rounded-lg hover:bg-white"
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-slate-700" />
          ) : (
            <Menu className="h-5 w-5 text-slate-700" />
          )}
        </Button>
      </div>

      {/* Desktop sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-[calc(16rem+0.75rem)] z-50 hidden lg:flex items-center justify-center h-7 w-7 rounded-full bg-white border shadow-sm hover:bg-slate-50 transition-all duration-200"
        style={{ left: sidebarOpen ? "calc(16rem + 0.75rem)" : "calc(4rem + 0.75rem)" }}
      >
        <ChevronLeft
          className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
            !sidebarOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarOpen ? "lg:translate-x-0 lg:w-64" : "lg:-translate-x-full lg:w-0"}`}
      >
        {/* Logo */}
        <div className="flex-shrink-0 p-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-40"></div>
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className={`${!sidebarOpen ? "lg:hidden" : ""}`}>
              <h1 className="text-sm font-bold text-white tracking-tight">PJPC</h1>
              <p className="text-[10px] text-slate-400">{config.title}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {config.navItems.map((item) => renderNavItem(item))}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 p-4 border-t border-white/5 space-y-3">
          {/* Network status */}
          <div className={`px-2 ${!sidebarOpen ? "lg:hidden" : ""}`}>
            <ConnectionStatus />
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {userAvatar || userName?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className={`flex-1 min-w-0 ${!sidebarOpen ? "lg:hidden" : ""}`}>
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{getRoleLabel(userRole)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        {/* Top header bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2">
                <School className="h-4 w-4 text-slate-400" />
                <nav className="flex items-center gap-1.5 text-sm">
                  {getBreadcrumbs().map((crumb, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                      )}
                      <span className={i === getBreadcrumbs().length - 1 ? "text-slate-900 font-medium" : "text-slate-500"}>
                        {crumb.label}
                      </span>
                    </React.Fragment>
                  ))}
                </nav>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <ConnectionStatus />
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
