"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Users,
  UserCog,
  DollarSign,
  FileText,
  BookOpen,
  GraduationCap,
  Command,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ============================================================
// 搜索项类型
// ============================================================

interface SearchResult {
  id: string
  label: string
  subtitle?: string
  href: string
  icon: React.ElementType
  category: "student" | "teacher" | "finance" | "course" | "other"
}

// ============================================================
// 预定义导航（不需要 API 请求）
// ============================================================

const QUICK_NAV: SearchResult[] = [
  { id: "dashboard", label: "仪表板", href: "/", icon: GraduationCap, category: "other" },
  { id: "students", label: "学生列表", subtitle: "查看所有学生", href: "/student-management", icon: Users, category: "student" },
  { id: "teachers", label: "教师列表", subtitle: "查看所有教师", href: "/teacher-management", icon: UserCog, category: "teacher" },
  { id: "courses", label: "课程管理", href: "/course-management?tab=courses", icon: BookOpen, category: "course" },
  { id: "classes", label: "班级管理", href: "/course-management?tab=classes", icon: BookOpen, category: "course" },
  { id: "schedule", label: "排课管理", href: "/schedule-management", icon: BookOpen, category: "course" },
  { id: "fees", label: "收费管理", subtitle: "费用套餐设置", href: "/finance/fees", icon: DollarSign, category: "finance" },
  { id: "payments", label: "发票付款", subtitle: "付款记录", href: "/finance/payments", icon: DollarSign, category: "finance" },
  { id: "expenses", label: "支出管理", href: "/finance/expenses", icon: DollarSign, category: "finance" },
  { id: "payroll", label: "薪资管理", href: "/finance/payroll", icon: DollarSign, category: "finance" },
  { id: "reports", label: "财务报表", href: "/finance/reports", icon: FileText, category: "finance" },
  { id: "attendance", label: "考勤报表", href: "/attendance-reports", icon: FileText, category: "other" },
  { id: "checkin", label: "学生签到", href: "/student-checkin", icon: Users, category: "student" },
  { id: "teacher-checkin", label: "教师签到", href: "/teacher-checkin", icon: UserCog, category: "teacher" },
  { id: "homework", label: "作业管理", href: "/homework", icon: BookOpen, category: "other" },
  { id: "inventory", label: "库存管理", href: "/inventory", icon: FileText, category: "other" },
  { id: "settings", label: "系统设置", href: "/settings", icon: FileText, category: "other" },
]

// ============================================================
// 分类配置
// ============================================================

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  student: { label: "学生", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  teacher: { label: "教师", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  finance: { label: "财务", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  course: { label: "课程", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  other: { label: "其他", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
}

// ============================================================
// GlobalSearch 组件
// ============================================================

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // ============================================================
  // 键盘快捷键监听
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // 打开时聚焦输入框
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setResults(QUICK_NAV)
      setSelectedIndex(0)
    }
  }, [open])

  // ============================================================
  // 搜索逻辑
  // ============================================================

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(QUICK_NAV)
      return
    }

    const lower = q.toLowerCase()
    setLoading(true)

    // 本地搜索导航
    const navResults = QUICK_NAV.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        (item.subtitle || "").toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    )

    // 尝试 API 搜索学生和教师
    let apiResults: SearchResult[] = []
    try {
      const [studentsRes, teachersRes] = await Promise.allSettled([
        fetch(`/api/students?search=${encodeURIComponent(q)}&limit=5`),
        fetch(`/api/teachers?search=${encodeURIComponent(q)}&limit=5`),
      ])

      // 处理学生结果
      if (studentsRes.status === "fulfilled") {
        const data = await studentsRes.value.json()
        const students = data.students || data.data?.items || []
        apiResults.push(
          ...students.slice(0, 5).map((s: any) => ({
            id: `s-${s.id}`,
            label: s.name || s.student_name || "未知学生",
            subtitle: `${s.grade || s.standard || ""} · ${s.school || ""}`,
            href: `/student-management?id=${s.id}`,
            icon: Users,
            category: "student" as const,
          }))
        )
      }

      // 处理教师结果
      if (teachersRes.status === "fulfilled") {
        const data = await teachersRes.value.json()
        const teachers = data.data || data.teachers || []
        apiResults.push(
          ...teachers.slice(0, 5).map((t: any) => ({
            id: `t-${t.id}`,
            label: t.name || t.teacher_name || "未知教师",
            subtitle: t.position || t.department || "",
            href: `/teacher-management?id=${t.id}`,
            icon: UserCog,
            category: "teacher" as const,
          }))
        )
      }
    } catch {
      // API 搜索失败不影响导航搜索
    }

    // 合并结果：导航优先，API 其次
    const merged = [...navResults, ...apiResults]
    setResults(merged)
    setSelectedIndex(0)
    setLoading(false)
  }, [])

  useEffect(() => {
    performSearch(query)
  }, [query, performSearch])

  // ============================================================
  // 导航
  // ============================================================

  const navigate = (item: SearchResult) => {
    setOpen(false)
    router.push(item.href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      navigate(results[selectedIndex])
    }
  }

  // ============================================================
  // 按分类分组
  // ============================================================

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, SearchResult[]>)

  if (!open) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* 搜索对话框 */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 搜索输入 */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search className="h-5 w-5 text-gray-400 shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索页面、学生、教师..."
              className="border-0 p-0 h-7 text-base bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />}
            {query && !loading && (
              <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>

          {/* 结果列表 */}
          <div className="max-h-[50vh] overflow-y-auto">
            {results.length === 0 && !loading && (
              <div className="py-12 text-center">
                <Search className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">没有找到结果</p>
                <p className="text-xs text-gray-400 mt-1">试试其他关键词</p>
              </div>
            )}

            {Object.entries(groupedResults).map(([category, items]) => (
              <div key={category} className="py-2">
                {/* 分类标题 */}
                <div className="px-4 py-1.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-2 py-0 font-normal",
                      CATEGORY_CONFIG[category]?.color
                    )}
                  >
                    {CATEGORY_CONFIG[category]?.label || category}
                  </Badge>
                </div>

                {/* 结果项 */}
                {items.map((item, idx) => {
                  const globalIdx = Object.values(groupedResults)
                    .flat()
                    .indexOf(item)
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        selectedIndex === globalIdx
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.label}
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* 键盘快捷键提示 */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between text-[10px] text-gray-400">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">↑↓</kbd> 导航</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">↵</kbd> 打开</span>
            </div>
            <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">Esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </>
  )
}
