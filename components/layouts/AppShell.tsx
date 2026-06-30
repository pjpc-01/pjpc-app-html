"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
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
  School,
  Calendar,
  FileText,
  UserCheck,
  CreditCard,
  ChevronUp,
  Building,
  Building2,
  PieChart,
  FileEdit,
  Package,
  Star,
  Truck,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
          { label: "成绩管理", href: "/grades", icon: GraduationCap },
          { label: "积分管理", href: "/points-management", icon: Star },
          { label: "接送管理", href: "/pickup", icon: Truck },
          { label: "随手拍", href: "/photo-moments", icon: Camera },
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
          { label: "用户管理", href: "/user-management", icon: Users },
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
  const [rolePerms, setRolePerms] = useState<Record<string, boolean>>({})

  // Fetch permissions for current user role
  useEffect(() => {
    if (userRole) {
      fetch(`/api/pocketbase-proxy/api/collections/role_permissions/records?filter=(role%3D'${userRole}')`)
        .then(r => r.json())
        .then(d => {
          const perms = d?.items?.[0]?.permissions || {}
          setRolePerms(perms)
        })
        .catch(() => {})
    }
  }, [userRole])

  // Fetch centers for sidebar filter
  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/centers/records")
      .then(r => r.json())
      .then(d => setCenters(d?.items?.map((c:any) => ({ id: c.id, code: c.code, name: c.name })) || []))
      .catch(() => {})
  }, [])

  const config = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.admin
  const { logout, user, loading } = useAuth()

  // Permission key mapping for nav items
  // Parents: check by label. Children: check by href path.
  const PARENT_PERM: Record<string, string> = {
    "仪表板": "dashboard", "学生管理": "students", "教师管理": "teachers",
    "财务管理": "finance", "课程管理": "courses", "考勤系统": "attendance",
    "系统设置": "settings",
  }
  const CHILD_PERM: Record<string, string> = {
    "/student-management": "students.list", "/daily-logs": "daily-logs",
    "/grades": "grades", "/points-management": "points",
    "/pickup": "pickup", "/photo-moments": "photos", "/parent-management": "parents",
    "/report-cards": "report-cards", "/homework": "homework",
    "/teacher-management": "teachers.list", "/schedule-management": "schedule",
    "/finance/overview": "finance.overview", "/finance/fees": "finance.fees",
    "/finance/payments": "finance.payments", "/finance/bank": "finance.bank",
    "/finance/expenses": "finance.expenses", "/finance/payroll": "finance.payroll",
    "/finance/budget": "finance.budget", "/finance/reports": "finance.reports",
    "/inventory": "inventory",
    "/student-checkin": "attendance.checkin", "/teacher-checkin": "attendance.teacher",
    "/attendance-reports": "attendance.reports",
    "/settings": "settings.general", "/user-management": "settings.users",
    "/center-management": "settings.centers",
  }

  // Filter nav items based on permissions
  const filterByPerms = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (item.children) {
        // Parent item: check parent permission key
        const parentKey = PARENT_PERM[item.label]
        if (parentKey && rolePerms[parentKey] === false) return false
        // Filter children
        item.children = filterByPerms(item.children)
        return item.children.length > 0
      }
      // Leaf item: check child permission key by href
      const childKey = item.href ? CHILD_PERM[item.href] : undefined
      if (childKey && rolePerms[childKey] === false) return false
      return true
    })
  }

  const filteredNavItems = filterByPerms(config.navItems)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (e) {
      console.error("登出失败:", e)
    }
  }

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
    filteredNavItems.forEach((item) => {
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

  // 登录页直接渲染内容，不显示侧边栏
  if (pathname === '/login') {
    return <>{children}</>
  }

  // 路由守卫：未登录用户重定向到登录页
  if (!loading && !user) {
    router.replace('/login')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">正在跳转登录页...</p>
      </div>
    )
  }

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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-accent-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
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
            <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border/70 pl-3">
                {item.children.map((child) => renderNavItem(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={addCenterParam(item.href) || "#"}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border border-sidebar-border"
              : "text-sidebar-accent-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary"></span>
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
    <div className="min-h-screen bg-background">
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
            <X className="h-5 w-5 text-foreground/60" />
          ) : (
            <Menu className="h-5 w-5 text-foreground/60" />
          )}
        </Button>
      </div>

      {/* Desktop sidebar toggle — hamburger when collapsed, X when open */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed z-50 hidden lg:flex items-center justify-center h-7 w-7 rounded-full bg-white border shadow-sm hover:bg-muted transition-all duration-200 ${
          sidebarOpen
            ? "top-3 left-[calc(16rem+0.75rem)]"
            : "top-3 left-3"
        }`}
      >
        {sidebarOpen ? (
          <X className="h-3.5 w-3.5 text-foreground/50" />
        ) : (
          <Menu className="h-3.5 w-3.5 text-foreground/50" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-sidebar border-r border-sidebar-border sidebar-glass-bg transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarOpen ? "lg:translate-x-0 lg:w-64" : "lg:-translate-x-full lg:w-0"}`}
      >
        {/* Logo */}
        <div className="flex-shrink-0 p-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-100 rounded-lg blur opacity-30"></div>
              <div className="relative bg-gradient-to-r from-yellow-300 to-yellow-100 p-2 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className={`${!sidebarOpen ? "lg:hidden" : ""}`}>
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">PJPC</h1>
              <p className="text-[10px] text-sidebar-foreground/60">{config.title}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredNavItems.map((item) => renderNavItem(item))}
        </nav>

        {/* Bottom section — 用户 + 分行 + 工具 */}
        <div className="flex-shrink-0 border-t border-sidebar-border">
          {/* Center filter */}
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider font-semibold px-2 mb-1.5">分行筛选</p>
            <div className="flex flex-wrap gap-1">
              {centers.length === 0 ? (
                <div className="text-[10px] text-sidebar-foreground/50 px-2">加载中...</div>
              ) : (
                [{ id: "all", code: "全部", icon: Building2 } as const, ...centers.map(c => ({ id: c.id, code: c.code, icon: School } as const))].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set("center", c.id)
                    document.cookie = `selectedCenter=${c.id};path=/;max-age=86400`
                    router.replace(url.pathname + url.search)
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    (searchParams?.get("center") || "all") === c.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                  }`}
                >
                  <c.icon className="h-3 w-3" />
                  {c.code}
                </button>
              )))}
            </div>
          </div>
          {/* User info + tools */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-sidebar-border/50">
            {user ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-100 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm">
                    {userAvatar || userName?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-sidebar-foreground leading-tight truncate">{userName || getRoleLabel(userRole)}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-sidebar-foreground/60">{getRoleLabel(userRole)}</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[9px] text-sidebar-foreground/60">在线</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent">
                    <Bell className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent justify-center gap-2"
                onClick={() => router.push("/login")}
              >
                <LogOut className="h-3.5 w-3.5 rotate-180" />
                登入
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content — no separate header bar */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <main className="p-4 sm:p-6 lg:p-8">
          <GlobalSearch />
          {children}
        </main>
      </div>
    </div>
  )
}
