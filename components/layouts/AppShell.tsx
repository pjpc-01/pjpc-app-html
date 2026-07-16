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
  PiggyBank,
  Receipt,
  Wallet,
  BarChart3,
  School,
  CalendarCheck,
  FileText,
  UserCheck,
  CreditCard,
  Building,
  Building2,
  PieChart,
  FileEdit,
  Package,
  Star,
  ScrollText,
  Trophy,
  Truck,
  MonitorPlay,
  GripVertical,
  Edit3,
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
        label: "概览",
        href: "/",
        icon: LayoutDashboard,
        children: [
          { label: "仪表板", href: "/", icon: LayoutDashboard },
          { label: "幻灯片", href: "/dashboard/slideshow", icon: MonitorPlay },
          { label: "TV看板", href: "/tv-board", icon: MonitorPlay },
        ],
      },
      {
        label: "教务",
        href: "/education",
        icon: GraduationCap,
        children: [
          { label: "教育概览", href: "/education", icon: GraduationCap },
          { label: "学生列表", href: "/student-management", icon: Users },
          { label: "学生报告", href: "/student-reports", icon: FileText },
          { label: "家长管理", href: "/parent-management", icon: Users },
          { label: "作业管理", href: "/homework", icon: FileEdit },
          { label: "成绩管理", href: "/grades", icon: GraduationCap },
          { label: "接送管理", href: "/pickup", icon: Truck },
          { label: "每日日志", href: "/daily-logs", icon: FileEdit },
          { label: "资源库", href: "/resource-library", icon: BookOpen },
          { label: "教师列表", href: "/teacher-management", icon: UserCog },
          { label: "教师考勤", href: "/teacher-attendance-reports", icon: CalendarCheck },
          { label: "课程管理", href: "/course-management", icon: BookOpen },
        ],
      },
      {
        label: "财务",
        href: "/finance/overview",
        icon: DollarSign,
        children: [
          { label: "财务概览", href: "/finance/overview", icon: PiggyBank },
          { label: "收费管理", href: "/finance/fees", icon: Receipt },
          { label: "学生费用", href: "/finance/student-fees", icon: GraduationCap },
          { label: "发票管理", href: "/finance/invoices", icon: FileText },
          { label: "付款管理", href: "/finance/payments", icon: CreditCard },
          { label: "收据管理", href: "/finance/receipts", icon: ScrollText },
          { label: "薪资管理", href: "/finance/payroll", icon: DollarSign },
          { label: "支出管理", href: "/finance/expenses", icon: Wallet },
          { label: "银行对账", href: "/finance/bank", icon: Building2 },
          { label: "预算管理", href: "/finance/budget", icon: PieChart },
          { label: "财务报表", href: "/finance/reports", icon: BarChart3 },
          { label: "库存管理", href: "/inventory", icon: Package },
        ],
      },
      {
        label: "系统",
        href: "/settings",
        icon: Settings,
        children: [
          { label: "考勤中心", href: "/attendance", icon: ClipboardCheck },
          { label: "卡片管理", href: "/card-management", icon: CreditCard },
          { label: "积分操作", href: "/points", icon: Star },
          { label: "积分规则", href: "/points/rules", icon: ScrollText },
          { label: "积分排行", href: "/points/leaderboard", icon: Trophy },
          { label: "用户管理", href: "/user-management", icon: Users },
          { label: "分行管理", href: "/center-management", icon: Building },
          { label: "系统设置", href: "/settings", icon: Settings },
          { label: "管理面板", href: "/admin", icon: Settings },
        ],
      },
    ],
  },
  teacher: {
    title: "教师工作台",
    navItems: [
      { label: "我的工作台", href: "/teacher-workspace", icon: LayoutDashboard },
      { label: "学生签到", href: "/attendance", icon: UserCheck },
      { label: "每日日志", href: "/daily-logs", icon: FileEdit },
      { label: "我的学生", href: "/student-management", icon: Users },
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
      { label: "财务概览", href: "/finance/overview", icon: LayoutDashboard },
      { label: "收费管理", href: "/finance/fees", icon: Receipt },
      { label: "学生费用", href: "/finance/student-fees", icon: GraduationCap },
      { label: "发票管理", href: "/finance/invoices", icon: FileText },
      { label: "付款管理", href: "/finance/payments", icon: CreditCard },
      { label: "收据管理", href: "/finance/receipts", icon: ScrollText },
      { label: "薪资管理", href: "/finance/payroll", icon: Wallet },
      { label: "支出管理", href: "/finance/expenses", icon: Wallet },
      { label: "财务报表", href: "/finance/reports", icon: BarChart3 },
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
  const [navEditMode, setNavEditMode] = useState(false)
  const [navOrder, setNavOrder] = useState<string[]>([])
  const [dragOver, setDragOver] = useState<string | null>(null)

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

  // Load custom nav order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`pjpc_nav_order_${userRole}`)
      if (saved) setNavOrder(JSON.parse(saved))
    } catch {}
  }, [userRole])

  // Save nav order to localStorage
  const saveNavOrder = (order: string[]) => {
    setNavOrder(order)
    localStorage.setItem(`pjpc_nav_order_${userRole}`, JSON.stringify(order))
  }

  // Apply custom order to nav items
  const applyNavOrder = (items: NavItem[]): NavItem[] => {
    if (!navOrder.length) return items
    const orderMap = new Map(navOrder.map((label, i) => [label, i]))
    const sorted = [...items].sort((a, b) => {
      const ai = orderMap.get(a.label) ?? 999
      const bi = orderMap.get(b.label) ?? 999
      return ai - bi
    })
    return sorted
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, label: string) => {
    e.dataTransfer.setData("text/plain", label)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, label: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOver(label)
  }

  const handleDragLeave = () => setDragOver(null)

  const handleDrop = (e: React.DragEvent, targetLabel: string) => {
    e.preventDefault()
    setDragOver(null)
    const draggedLabel = e.dataTransfer.getData("text/plain")
    if (draggedLabel === targetLabel) return

    const items = applyNavOrder(filteredNavItems)
    const labels = items.map(i => i.label)
    const fromIdx = labels.indexOf(draggedLabel)
    const toIdx = labels.indexOf(targetLabel)
    if (fromIdx < 0 || toIdx < 0) return

    const newLabels = [...labels]
    newLabels.splice(fromIdx, 1)
    newLabels.splice(toIdx, 0, draggedLabel)
    saveNavOrder(newLabels)
  }

  const resetNavOrder = () => {
    setNavOrder([])
    localStorage.removeItem(`pjpc_nav_order_${userRole}`)
  }

  const config = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.admin
  const { logout, user, loading } = useAuth()

  // Permission key mapping for nav items
  const PARENT_PERM: Record<string, string> = {
    "概览": "overview", "教务": "education", "财务": "finance", "系统": "system",
  }
  const CHILD_PERM: Record<string, string> = {
    "/": "overview.dashboard", "/dashboard/slideshow": "overview.slideshow",
    "/education": "education.overview", "/student-management": "education.students",
    "/student-reports": "education.reports", "/parent-management": "education.parents",
    "/homework": "education.homework", "/grades": "education.grades",
    "/pickup": "education.pickup", "/daily-logs": "education.logs",
    "/teacher-management": "education.teachers", "/teacher-attendance-reports": "education.teacher_attendance",
    "/course-management": "education.courses",
    "/finance/overview": "finance.overview", "/finance/fees": "finance.fees",
    "/finance/student-fees": "finance.student_fees", "/finance/invoices": "finance.invoices",
    "/finance/payments": "finance.payments", "/finance/receipts": "finance.receipts",
    "/finance/payroll": "finance.payroll", "/finance/expenses": "finance.expenses",
    "/finance/bank": "finance.bank", "/finance/budget": "finance.budget",
    "/finance/reports": "finance.reports", "/inventory": "finance.inventory",
    "/attendance": "system.attendance", "/card-management": "system.cards",
    "/points": "system.points", "/points/rules": "system.points_rules",
    "/points/leaderboard": "system.points_leaderboard",
    "/user-management": "system.users", "/center-management": "system.centers",
    "/settings": "system.settings",
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

  const filteredNavItems = applyNavOrder(filterByPerms(config.navItems))

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

  // 登录页不显示 AppShell 侧边栏
  if (pathname === '/login') {
    return <>{children}</>
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0
    const expanded = expandedMenus.has(item.label)

    const dragProps = navEditMode && depth === 0 ? {
      draggable: true,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, item.label),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, item.label),
      onDragLeave: handleDragLeave,
      onDrop: (e: React.DragEvent) => handleDrop(e, item.label),
    } : {}

    const isDragTarget = dragOver === item.label

    return (
      <div key={item.label}
        className={`transition-all ${isDragTarget ? "ring-2 ring-blue-300 rounded-lg bg-blue-50/30" : ""}`}
        {...dragProps}
      >
        <div className="flex items-center gap-1">
          {navEditMode && depth === 0 && (
            <GripVertical className="h-3.5 w-3.5 text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
        {hasChildren ? (
          <>
            <div className="flex items-center gap-0.5 w-full">
              {item.href ? (
                <Link
                  href={addCenterParam(item.href) || "#"}
                  className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    expanded
                      ? "bg-gray-200/30 text-gray-800"
                      : "text-gray-600/60 hover:bg-gray-100/30 hover:text-gray-800"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                </Link>
              ) : (
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    expanded
                      ? "bg-gray-200/30 text-gray-800"
                      : "text-gray-600/60 hover:bg-gray-100/30 hover:text-gray-800"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleMenu(item.label) }}
                className="flex-shrink-0 px-1.5 py-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/30 transition-all duration-200"
                title={expanded ? "收起" : "展开"}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
            {expanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-gray-200/30 pl-3">
                {item.children.map((child) => renderNavItem(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={addCenterParam(item.href) || "#"}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            active
              ? "bg-gray-200/40 text-gray-800 font-semibold shadow-sm border border-gray-300/30"
              : "text-gray-600/60 hover:bg-gray-100/30 hover:text-gray-800"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-500"></span>
            )}
          </Link>
        )}
          </div>
        </div>
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
    "/": { label: "仪表板", parent: "概览" },
    "/dashboard/slideshow": { label: "幻灯片", parent: "概览" },
    "/education": { label: "教育概览", parent: "教务" },
    "/student-management": { label: "学生列表", parent: "教务" },
    "/student-reports": { label: "学生报告", parent: "教务" },
    "/student-report": { label: "报告详情", parent: "教务" },
    "/daily-logs": { label: "每日日志", parent: "教务" },
    "/grades": { label: "成绩管理", parent: "教务" },
    "/pickup": { label: "接送管理", parent: "教务" },
    "/parent-management": { label: "家长管理", parent: "教务" },
    "/homework": { label: "作业管理", parent: "教务" },
    "/teacher-management": { label: "教师列表", parent: "教务" },
    "/teacher-attendance-reports": { label: "教师考勤", parent: "教务" },
    "/course-management": { label: "课程管理", parent: "教务" },
    "/finance/overview": { label: "财务概览", parent: "财务" },
    "/finance/fees": { label: "收费管理", parent: "财务" },
    "/finance/student-fees": { label: "学生费用", parent: "财务" },
    "/finance/invoices": { label: "发票管理", parent: "财务" },
    "/finance/payments": { label: "付款管理", parent: "财务" },
    "/finance/receipts": { label: "收据管理", parent: "财务" },
    "/finance/payroll": { label: "薪资管理", parent: "财务" },
    "/finance/expenses": { label: "支出管理", parent: "财务" },
    "/finance/bank": { label: "银行对账", parent: "财务" },
    "/finance/budget": { label: "预算管理", parent: "财务" },
    "/finance/reports": { label: "财务报表", parent: "财务" },
    "/inventory": { label: "库存管理", parent: "财务" },
    "/attendance": { label: "考勤中心", parent: "系统" },
    "/card-management": { label: "卡片管理", parent: "系统" },
    "/points": { label: "积分操作", parent: "系统" },
    "/points/rules": { label: "积分规则", parent: "系统" },
    "/points/leaderboard": { label: "积分排行", parent: "系统" },
    "/user-management": { label: "用户管理", parent: "系统" },
    "/center-management": { label: "分行管理", parent: "系统" },
    "/settings": { label: "系统设置", parent: "系统" },
  }

  const getBreadcrumbs = () => {
    const crumbs: { label: string; href?: string }[] = []
    const info = BREADCRUMB_LABELS[pathname]
    // Also match /student-report/xxx → /student-report
    if (!info && pathname.startsWith("/student-report/")) {
      const baseInfo = BREADCRUMB_LABELS["/student-report"]
      if (baseInfo?.parent) crumbs.push({ label: baseInfo.parent })
      crumbs.push({ label: baseInfo?.label || "报告详情" })
      return crumbs
    }
    if (info?.parent) {
      crumbs.push({ label: info.parent })
    }
    crumbs.push({ label: info?.label || pathname.replace("/", "") || "未知" })
    return crumbs
  }

  return (
    <div className="min-h-screen glass-body">
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
        className={`fixed top-0 left-0 z-40 h-full glass-sidebar transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarOpen ? "lg:translate-x-0 lg:w-64" : "lg:-translate-x-full lg:w-0"}`}
      >
        {/* Logo */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200/30">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg shadow-gray-500/10">
              <span className="text-sm font-bold text-gray-800">P</span>
            </div>
            <div className={`${!sidebarOpen ? "lg:hidden" : ""}`}>
              <h1 className="text-sm font-bold text-gray-800/90 tracking-tight">PJPC</h1>
              <p className="text-[10px] text-gray-500/50">{config.title}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-200/20 scrollbar-track-transparent">
          {filteredNavItems.map((item) => renderNavItem(item))}
        </nav>

        {/* Nav edit toggle */}
        <div className="px-3 pb-1">
          {navEditMode ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-400 hover:text-gray-600 flex-1"
                onClick={() => setNavEditMode(false)}>
                完成排序
              </Button>
              {navOrder.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-300 hover:text-red-400"
                  onClick={resetNavOrder}>
                  恢复默认
                </Button>
              )}
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-300 hover:text-gray-500 w-full"
              onClick={() => setNavEditMode(true)}>
              <Edit3 className="h-3 w-3 mr-1" />调整菜单顺序
            </Button>
          )}
        </div>

        {/* Bottom section — 用户 + 分行 + 工具 */}
        <div className="flex-shrink-0 border-t border-gray-200/30">
          {/* Center filter */}
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] text-gray-400/40 uppercase tracking-wider font-semibold px-2 mb-1.5">分行筛选</p>
            <div className="flex flex-wrap gap-1">
              {centers.length === 0 ? (
                <div className="text-[10px] text-gray-400/40 px-2">加载中...</div>
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
                      ? "bg-gray-200/40 text-gray-800 border border-gray-300/30"
                      : "text-gray-500/50 hover:text-gray-800 hover:bg-gray-100/30"
                  }`}
                >
                  <c.icon className="h-3 w-3" />
                  {c.code}
                </button>
              )))}
            </div>
          </div>
          {/* User info + tools */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200/30">
            {user ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[10px] font-bold text-gray-800 flex-shrink-0 shadow-sm shadow-gray-500/10">
                    {userAvatar || userName?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800/90 leading-tight truncate">{userName || getRoleLabel(userRole)}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500/50">{getRoleLabel(userRole)}</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[9px] text-gray-500/50">在线</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500/50 hover:text-gray-800 hover:bg-gray-100/30">
                    <Bell className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-500/50 hover:text-gray-800 hover:bg-gray-100/30"
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
                className="w-full text-xs text-gray-500/50 hover:text-gray-800 hover:bg-gray-100/30 justify-center gap-2"
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
