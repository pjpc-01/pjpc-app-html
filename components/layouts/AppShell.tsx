"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
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
  Building,
  Building2,
  PieChart,
  FileEdit,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ConnectionStatus from "@/components/ConnectionStatus"
import GlobalSearch from "@/components/ui/global-search"

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
          { label: "每日日志", href: "/daily-logs", icon: FileEdit },
          { label: "家长管理", href: "/parent-management", icon: Users },
          { label: "成绩单", href: "/report-cards", icon: GraduationCap },
          { label: "作业管理", href: "/homework", icon: FileEdit },
        ],
      },
      {
        label: "教师管理",
        icon: UserCog,
        children: [
          { label: "教师列表", href: "/teacher-management", icon: UserCog },
          { label: "教师排班", href: "/schedule-management", icon: Calendar },
        ],
      },
      {
        label: "财务管理",
        icon: DollarSign,
        children: [
          { label: "财务概览", href: "/finance/overview", icon: PiggyBank },
          { label: "收费管理", href: "/finance/fees", icon: Receipt },
          { label: "发票付款", href: "/finance/payments", icon: ArrowLeftRight },
          { label: "银行对账", href: "/finance/bank", icon: Building2 },
          { label: "支出管理", href: "/finance/expenses", icon: Wallet },
          { label: "薪资管理", href: "/finance/payroll", icon: DollarSign },
          { label: "预算管理", href: "/finance/budget", icon: PieChart },
          { label: "财务报表", href: "/finance/reports", icon: BarChart3 },
          { label: "库存管理", href: "/inventory", icon: Package },
        ],
      },
      {
        label: "课程管理",
        icon: BookOpen,
        children: [
          { label: "课程表", href: "/course-management?tab=schedule", icon: Calendar },
          { label: "课程管理", href: "/course-management?tab=courses", icon: BookOpen },
          { label: "班级管理", href: "/course-management?tab=classes", icon: Users },
          { label: "课程分析", href: "/course-management?tab=analytics", icon: BarChart3 },
        ],
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
        label: "系统设置",
        icon: Settings,
        children: [
          { label: "系统设置", href: "/settings", icon: Settings },
          { label: "分院管理", href: "/center-management", icon: Building },
        ],
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
        label: "每日日志",
        href: "/daily-logs",
        icon: FileEdit,
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
        label: "每日日志",
        href: "/parent/dailylogs",
        icon: FileEdit,
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const [centers, setCenters] = useState<{id:string;code:string;name:string}[]>([])

  // Fetch centers for sidebar filter
  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/centers/records")
      .then(r => r.json())
      .then(d => setCenters(d?.items?.map((c:any) => ({ id: c.id, code: c.code, name: c.name })) || []))
      .catch(() => {})
  }, [])

  const config = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.admin

  // 【全局分行筛选】所有导航链接自动携带当前?center=参数，切换页面不丢失筛选
  const addCenterParam = (href: string | undefined): string | undefined => {
    if (!href) return href
    const center = searchParams?.get("center")
    if (!center || center === "all") return href
    const [base, query] = href.split("?")
    const params = new URLSearchParams(query || "")
    params.set("center", center)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === "/") return pathname === "/"
    // Get the path+query from href
    const [hrefPath, hrefQuery] = href.split("?")
    if (pathname !== hrefPath) return false
    if (!hrefQuery) return true // no query = just match path
    // Match query params: check each key=value in the link
    const params = new URLSearchParams(hrefQuery)
    for (const [key, val] of params) {
      if (searchParams?.get(key) !== val) return false
    }
    return true
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
            href={addCenterParam(item.href) || "#"}
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
    "/inventory": { label: "库存管理", parent: "财务管理" },
    "/course-management": { label: "课程管理", parent: "课程管理" },
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
    // For course-management with tabs, show the sub-page as breadcrumb
    if (pathname === "/course-management") {
      const tab = searchParams?.get("tab") || "schedule"
      const tabLabels: Record<string, string> = {
        schedule: "课程表",
        courses: "课程管理",
        classes: "班级管理",
        analytics: "课程分析",
      }
      crumbs.push({ label: "课程管理" })
      crumbs.push({ label: tabLabels[tab] || "课程表" })
      return crumbs
    }
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

        {/* Bottom section — 分行Tab */}
        <div className="flex-shrink-0 p-3 border-t border-white/5">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-2">分行筛选</p>
            <div className="flex flex-wrap gap-1">
              {centers.length === 0 ? (
                <div className="text-[10px] text-slate-500 px-2">加载中...</div>
              ) : (
                [{ id: "all", code: "全部", icon: Building2 } as const, ...centers.map(c => ({ id: c.id, code: c.code, icon: School } as const))].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set("center", c.id)
                    // Set cookie so PB Proxy can inject center filter
                    document.cookie = `selectedCenter=${c.id};path=/;max-age=86400`
                    router.replace(url.pathname + url.search)
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    (searchParams?.get("center") || "all") === c.id
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <c.icon className="h-3 w-3" />
                  {c.code}
                </button>
              )))}
            </div>
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
              {/* User info */}
              <div className="flex items-center gap-2 pl-2 ml-2 border-l border-slate-200">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {userAvatar || userName?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-medium text-slate-700 leading-tight">{userName}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{getRoleLabel(userRole)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <GlobalSearch />
          {children}
        </main>
      </div>
    </div>
  )
}
