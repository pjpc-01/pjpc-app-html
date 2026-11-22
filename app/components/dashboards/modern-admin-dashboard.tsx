"use client"

import { buildCenterMaps, inCenterScope, centerOfInvoiceId, centerOfExpense } from '@/lib/center-scope'
import { formatGrade } from "@/lib/utils"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PageHelpButton from "@/components/help/PageHelpButton"
import { useLanguage } from "@/contexts/language-context"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import {
  Users,
  UserCheck,
  Shield,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  Building2,
  School,
  Layers,
  Activity,
  Cake,
} from "lucide-react"
import ChartCard from "@/components/dashboard/ChartCard"

// ─── Types ───────────────────────────────────────────────────────────────────

interface CenterInfo {
  id: string
  code: string
  name: string
}

interface StudentRecord {
  id: string
  name: string
  centerId: string
  center?: string
  grade: string
  gender: string
  status: string
  created: string
  date_of_birth?: string
}

interface TeacherRecord {
  id: string
  name: string
  centerId: string
  department: string
  position: string
  status: string
}

interface PaymentRecord {
  id: string
  invoiceId: string
  centerId?: string
  amount: number
  date: string
  created: string
}

interface ExpenseRecord {
  id: string
  centerId: string
  amount: number
  category: string
  date: string
  created: string
}

interface InvoiceRecord {
  id: string
  centerId: string
  amount: number
  total_amount?: number
  status: string
  date: string
  created: string
}

interface FeeItemRecord {
  id: string
  category: string
  amount: number
}

interface RefundRecord {
  id: string
  centerId: string
  amount: number
  date: string
  created: string
}

interface ModernAdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

// ─── Amber color palette (brand) ─────────────────────────────────────────────

const AMBER_COLORS = [
  "#f59e0b", // amber-500
  "#d97706", // amber-600
  "#f97316", // orange-500
  "#ea580c", // orange-600
  "#fbbf24", // amber-400
  "#fb923c", // orange-400
  "#fcd34d", // amber-300
  "#b45309", // amber-700
  "#92400e", // amber-800
  "#fde68a", // amber-200
]

const INCOME_COLOR = "#f59e0b" // amber-500
const EXPENSE_COLOR = "#64748b" // slate-500：支出用中性色，跟收入橙区分开

// ─── Helper: group-by + count ────────────────────────────────────────────────

function groupCount<T>(items: T[], keyFn: (item: T) => string, fallback = "未分类"): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = keyFn(item) || fallback
    map.set(key, (map.get(key) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function groupSum<T>(
  items: T[],
  keyFn: (item: T) => string,
  valFn: (item: T) => number,
  fallback = "未分类"
): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = keyFn(item) || fallback
    map.set(key, (map.get(key) || 0) + valFn(item))
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

// ─── Helper: get month key from date string ──────────────────────────────────

function getMonthKey(dateStr: string): string {
  if (!dateStr) return ""
  // Handle "2026-06-18 11:40:07.181Z" format or ISO format
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ""
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-")
  return `${year}/${month}`
}

// ─── Main Component ──────────────────────────────────────────────────────────


// ─── 概览指标块 ─────────────────────────────────────────────────────────────

const KPI_TONES: Record<string, string> = {
  amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
}

function KpiTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "amber",
}: {
  label: string
  value: string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "amber" | "green" | "rose"
}) {
  return (
    <div className="group rounded-2xl border border-amber-100/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${KPI_TONES[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 whitespace-nowrap text-xl font-bold leading-none tracking-tight tabular-nums text-foreground sm:text-[26px]">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

export default function ModernAdminDashboard({ activeTab, setActiveTab }: ModernAdminDashboardProps) {
  const { t } = useLanguage()
  const { userProfile } = useAuth()

  // Center filter state
  const [selectedCenter, setSelectedCenter] = useState<string>("all")
  const [centers, setCenters] = useState<CenterInfo[]>([])

  // Raw data
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [teachers, setTeachers] = useState<TeacherRecord[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [feeItems, setFeeItems] = useState<FeeItemRecord[]>([])
  const [refunds, setRefunds] = useState<RefundRecord[]>([])

  const [loading, setLoading] = useState(true)

  // ─── Fetch all data ──────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const proxy = "/api/pocketbase-proxy/api/collections"
        const urls = {
          centers: `${proxy}/centers/records?perPage=20&sort=code`,
          // ⚠️ 只有 payments / invoices 有 deleted 字段；students / teachers / expenses 没有，
          //    对它们用 deleted!=true 会被 PB 判为非法字段直接 400（整包数据取不回来）。
          // students 集合没有 created/updated 字段，sort=-created 会 400 → 按名字排
          students: `${proxy}/students/records?perPage=500&sort=name&expand=centerId`,
          teachers: `${proxy}/teachers/records?perPage=500&sort=-created&expand=centerId`,
          payments: `${proxy}/payments/records?perPage=500&sort=-created&filter=${encodeURIComponent('deleted!=true')}`,
          expenses: `${proxy}/expenses/records?perPage=500&sort=-date`,
          invoices: `${proxy}/invoices/records?perPage=500&sort=-created&filter=${encodeURIComponent('deleted!=true')}`,
          feeItems: `${proxy}/fee_items/records?perPage=500&sort=-created`,
          refunds: `${proxy}/refunds/records?perPage=500&sort=-created`,
        }

        const responses = await Promise.all(
          Object.entries(urls).map(async ([key, url]) => {
            try {
              const res = await fetch(url)
              const data = await res.json()
              return [key, data?.items || []]
            } catch {
              return [key, []]
            }
          })
        )

        const data = Object.fromEntries(responses)

        setCenters(
          (data.centers || []).map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
          }))
        )
        setStudents(data.students || [])
        setTeachers(data.teachers || [])
        setPayments(data.payments || [])
        setExpenses(data.expenses || [])
        setInvoices(data.invoices || [])
        setFeeItems(data.feeItems || [])
        setRefunds(data.refunds || [])
      } catch (err) {
        console.error("Dashboard data fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ─── Filter helpers ──────────────────────────────────────────────────────

  const filterByCenter = useCallback(
    <T extends { centerId?: string }>(items: T[]): T[] => {
      if (selectedCenter === "all") return items
      return items.filter(
        (item) => item.centerId === selectedCenter
      )
    },
    [selectedCenter]
  )

  // ─── Filtered data ───────────────────────────────────────────────────────

  const filteredStudents = useMemo(() => filterByCenter(students), [students, filterByCenter])
  const filteredTeachers = useMemo(() => filterByCenter(teachers), [teachers, filterByCenter])
  const filteredPayments = useMemo(() => filterByCenter(payments), [payments, filterByCenter])
  const filteredExpenses = useMemo(() => filterByCenter(expenses), [expenses, filterByCenter])
  const filteredInvoices = useMemo(() => filterByCenter(invoices), [invoices, filterByCenter])
  const filteredRefunds = useMemo(() => filterByCenter(refunds), [refunds, filterByCenter])

  // ─── Birthday students this month ────────────────────────────────────────

  const birthdayStudents = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    return filteredStudents.filter(s => {
      if (!s.date_of_birth) return false
      const d = new Date(s.date_of_birth)
      return d.getMonth() === thisMonth
    }).sort((a, b) => {
      const da = new Date(a.date_of_birth!).getDate()
      const db = new Date(b.date_of_birth!).getDate()
      return da - db
    })
  }, [filteredStudents])

  // ─── KPI calculations ────────────────────────────────────────────────────

  const totalStudents = filteredStudents.length
  const totalTeachers = filteredTeachers.length

  const totalIncome = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [filteredPayments]
  )

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [filteredExpenses]
  )

  // ─── 概览只看四件必要的事：在读 / 今日出席 / 本月收款 / 本月支出 ──────────

  const activeStudents = useMemo(
    () => filteredStudents.filter((s) => s.status === "active").length,
    [filteredStudents]
  )

  const monthKey = useMemo(
    () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).slice(0, 7),
    []
  )

  const monthPayments = useMemo(
    () => filteredPayments.filter((p) => String(p.date || "").startsWith(monthKey)),
    [filteredPayments, monthKey]
  )
  const monthExpensesList = useMemo(
    () => filteredExpenses.filter((e) => String(e.date || "").startsWith(monthKey)),
    [filteredExpenses, monthKey]
  )
  const monthIncome = useMemo(
    () => monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [monthPayments]
  )
  const monthExpense = useMemo(
    () => monthExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [monthExpensesList]
  )

  // 今日出席：直接问考勤接口（PB 里 student_attendance 才是真实打卡记录）
  const [todayPresent, setTodayPresent] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" })
    const code = selectedCenter === "all" ? "" : centers.find((c) => c.id === selectedCenter)?.code || ""
    const qs = new URLSearchParams({ date: today, type: "student", pageSize: "200" })
    if (code) qs.set("center", code)
    fetch(`/api/student-attendance?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (cancelled) return
        const ids = new Set(
          (d.items || []).filter((i: any) => i.check_in).map((i: any) => i.person_id)
        )
        setTodayPresent(ids.size)
      })
      .catch(() => {
        if (!cancelled) setTodayPresent(null)
      })
    return () => {
      cancelled = true
    }
  }, [selectedCenter, centers])

  const attendanceRate = activeStudents > 0 && todayPresent !== null
    ? Math.round((todayPresent / activeStudents) * 100)
    : null

  // ─── Student analytics ───────────────────────────────────────────────────

  const gradeDistribution = useMemo(
    () => groupCount(filteredStudents, (s) => t(s.grade) || "", t("未分类")),
    [filteredStudents]
  )

  const genderDistribution = useMemo(
    () => {
      const raw = groupCount(filteredStudents, (s) => {
        const g = (s.gender || "").toLowerCase()
        if (g === "male" || g === "男") return t("男")
        if (g === "female" || g === "女") return t("女")
        return t("未知")
      })
      return raw
    },
    [filteredStudents]
  )

  const statusDistribution = useMemo(
    () =>
      groupCount(filteredStudents, (s) => {
        if (s.status === "active") return t("在读")
        return t("离校")
      }),
    [filteredStudents]
  )

  // ─── Teacher analytics ───────────────────────────────────────────────────

  const departmentDistribution = useMemo(
    () =>
      groupCount(filteredTeachers, (tc) => {
        const dept = (tc.department || "").trim()
        return t(dept) || t("未分配")
      }),
    [filteredTeachers]
  )

  // ─── Financial analytics ─────────────────────────────────────────────────

  const revenueExpenseTrend = useMemo(() => {
    const monthMap = new Map<string, { income: number; expense: number }>()

    // Income from payments
    for (const p of filteredPayments) {
      const mk = getMonthKey(p.date || p.created)
      if (!mk) continue
      const entry = monthMap.get(mk) || { income: 0, expense: 0 }
      entry.income += Number(p.amount) || 0
      monthMap.set(mk, entry)
    }

    // Expenses
    for (const e of filteredExpenses) {
      const mk = getMonthKey(e.date || e.created)
      if (!mk) continue
      const entry = monthMap.get(mk) || { income: 0, expense: 0 }
      entry.expense += Number(e.amount) || 0
      monthMap.set(mk, entry)
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([mk, val]) => ({
        month: formatMonthLabel(mk),
        income: Math.round(val.income * 100) / 100,
        expense: Math.round(val.expense * 100) / 100,
      }))
  }, [filteredPayments, filteredExpenses])

  const feeItemDistribution = useMemo(
    () =>
      groupSum(feeItems, (f) => t(f.category) || "", (f) => Number(f.amount) || 0, t("未分类")),
    [feeItems]
  )

  // ─── Center comparison ───────────────────────────────────────────────────

  // 分行归属统一走 lib/center-scope（payments 根本没有 centerId，必须经发票反查学生所属分行）
  const centerMaps = useMemo(
    () => buildCenterMaps(centers, students, teachers, invoices),
    [centers, students, teachers, invoices]
  )

  const centerComparisonData = useMemo(() => {
    return centers.map((c) => {
      // 学生：优先 center(code)，退回 centerId(UUID)
      const cStudents = students.filter(
        (s) => s.center === c.code || s.centerId === c.id
      )
      const cTeachers = teachers.filter((t) => t.centerId === c.id)
      // 收款：payments → invoiceId → 发票 → 学生 → 分行 code（这就是原来恒 0 的原因）
      const cPayments = payments.filter((p) => centerOfInvoiceId(p.invoiceId, centerMaps) === c.code)
      const cExpenses = expenses.filter((e) => centerOfExpense(e, centerMaps) === c.code)
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        students: cStudents.length,
        teachers: cTeachers.length,
        income: cPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        expenses: cExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
        activeStudents: cStudents.filter((s) => s.status === "active").length,
      }
    })
  }, [centers, students, teachers, payments, expenses, centerMaps])

  const centerStudentComparison = useMemo(
    () =>
      centerComparisonData.map((c) => ({
        name: c.code,
        students: c.students,
      })),
    [centerComparisonData]
  )

  // ─── Center filter options ───────────────────────────────────────────────

  const centerFilterOptions = useMemo(
    () => [{ id: "all", code: t("全部"), name: t("所有分行") }, ...centers],
    [centers]
  )

  const selectedCenterName = useMemo(() => {
    if (selectedCenter === "all") return t("所有分行")
    const c = centers.find((cc) => cc.id === selectedCenter)
    return c ? `${c.code} ${c.name}` : t("未知分行")
  }, [selectedCenter, centers])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header + Center Filter */}
      <div className="bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-50 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm border border-yellow-200">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                {t("概览")}
              </h2>
              <PageHelpButton title={t("数据分析仪表板")} description={t("欢迎回来，")} />
            </div>
            <p className="text-amber-700 text-sm sm:text-base">
              {t("欢迎回来，")}{userProfile?.name || "管理员"}
              <span className="mx-1.5 text-amber-400">·</span>
              <span className="tabular-nums">
                {new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Kuala_Lumpur", month: "long", day: "numeric", weekday: "long" })}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-amber-700 font-medium mr-1">{t("分行筛选：")}</span>
            {centerFilterOptions.map((opt) => (
              <Button
                key={opt.id}
                size="sm"
                variant={selectedCenter === opt.id ? "default" : "outline"}
                onClick={() => setSelectedCenter(opt.id)}
                className={
                  selectedCenter === opt.id
                    ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                    : "bg-white/60 border-amber-300 text-amber-800 hover:bg-amber-100"
                }
              >
                <Building2 className="h-3.5 w-3.5 mr-1" />
                {opt.code}
              </Button>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/30 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200/30 rounded-full -ml-10 -mb-10 blur-2xl" />
      </div>


      {/* KPI —— 只留四件必要的事 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile
          label={t("在读学生")}
          value={loading ? "—" : String(activeStudents)}
          sub={`${t("共")} ${totalStudents} ${t("人")}`}
          icon={Users}
          tone="amber"
        />
        <KpiTile
          label={t("今日出席")}
          value={loading || !todayPresent ? "—" : String(todayPresent)}
          sub={
            todayPresent === null || todayPresent === 0
              ? t("今日还没有打卡记录")
              : `${attendanceRate}% · ${t("未到")} ${Math.max(0, activeStudents - todayPresent)} ${t("人")}`
          }
          icon={UserCheck}
          tone="green"
        />
        <KpiTile
          label={t("本月收款")}
          value={loading ? "—" : `RM ${monthIncome.toLocaleString()}`}
          sub={`${monthKey} · ${monthPayments.length} ${t("笔")}`}
          icon={Wallet}
          tone="amber"
        />
        <KpiTile
          label={t("本月支出")}
          value={loading ? "—" : `RM ${monthExpense.toLocaleString()}`}
          sub={`${monthKey} · ${monthExpensesList.length} ${t("笔")}`}
          icon={TrendingDown}
          tone="rose"
        />
      </div>


      {/* Birthday Card */}
      {birthdayStudents.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <Cake className="h-4 w-4" /> {t("🎂 本月寿星 (")}{birthdayStudents.length}{t("人)")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {birthdayStudents.map(s => {
                const day = new Date(s.date_of_birth!).getDate()
                return (
                  <a key={s.id} href={`/student-management?id=${s.id}`}
                    className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all text-sm">
                    <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">{day}</span>
                    <span className="text-gray-700 font-medium">{s.name}</span>
                    <span className="text-xs text-gray-400">{formatGrade(s.grade)}</span>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {/* 收支趋势 —— 财务看这一张就够 */}
      <section>
            <ChartCard
              title={t("收支趋势")}
              description={t("按月收入与支出")}
              icon={TrendingUp}
              isEmpty={revenueExpenseTrend.length === 0}
              loading={loading}
              className=""
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueExpenseTrend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fde68a" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#92400e", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#92400e", fontSize: 11 }}
                    tickFormatter={(v) => `RM${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #fde68a",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [`RM ${value.toLocaleString()}`, name === "income" ? t("收入") : t("支出")]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="circle"
                    formatter={(value) => (value === "income" ? t("收入") : t("支出"))}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke={INCOME_COLOR}
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                    dot={{ r: 2.5, fill: INCOME_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke={EXPENSE_COLOR}
                    strokeWidth={2}
                    fill="url(#expenseGradient)"
                    dot={{ r: 2.5, fill: EXPENSE_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
      </section>

      {/* Center Comparison Table */}
      <Card className="border-amber-200/60 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-amber-100">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-600" />
            {t("分行数据对比")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{t("各分行核心指标对比（累计，不受月份影响）")}</p>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-amber-800 font-semibold">{t("分行")}</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">{t("学生总数")}</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">{t('dashboard.active_students')}</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">{t("教师数")}</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">{t('finance.total_income')}</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">{t('finance.total_expenses')}</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">{t("净利润")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {t("加载中...")}
                    </TableCell>
                  </TableRow>
                ) : centerComparisonData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {t("暂无分行数据")}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {centerComparisonData.map((c) => {
                      const netProfit = c.income - c.expenses
                      return (
                        <TableRow key={c.id} className="hover:bg-amber-50/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{c.code}</div>
                                <div className="text-xs text-muted-foreground">{c.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{c.students}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              {c.activeStudents}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{c.teachers}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-600">
                            RM {c.income.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            RM {c.expenses.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              RM {netProfit.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {/* Total row */}
                    <TableRow className="border-t-2 border-amber-200 bg-amber-50/30 font-semibold">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                            <Layers className="h-4 w-4 text-amber-700" />
                          </div>
                          <span>{t("全部合计")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {centerComparisonData.reduce((s, c) => s + c.students, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {centerComparisonData.reduce((s, c) => s + c.activeStudents, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {centerComparisonData.reduce((s, c) => s + c.teachers, 0)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        RM {centerComparisonData.reduce((s, c) => s + c.income, 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        RM {centerComparisonData.reduce((s, c) => s + c.expenses, 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const totalNet = centerComparisonData.reduce((s, c) => s + c.income - c.expenses, 0)
                          return (
                            <span className={totalNet >= 0 ? "text-emerald-600" : "text-red-600"}>
                              RM {totalNet.toLocaleString()}
                            </span>
                          )
                        })()}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
