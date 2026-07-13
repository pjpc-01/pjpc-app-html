"use client"

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
  centerId: string
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
const EXPENSE_COLOR = "#ea580c" // orange-600

// ─── Helper: group-by + count ────────────────────────────────────────────────

function groupCount<T>(items: T[], keyFn: (item: T) => string): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = keyFn(item) || "未分类"
    map.set(key, (map.get(key) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function groupSum<T>(
  items: T[],
  keyFn: (item: T) => string,
  valFn: (item: T) => number
): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = keyFn(item) || "未分类"
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

export default function ModernAdminDashboard({ activeTab, setActiveTab }: ModernAdminDashboardProps) {
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
          students: `${proxy}/students/records?perPage=500&sort=-created&expand=centerId`,
          teachers: `${proxy}/teachers/records?perPage=500&sort=-created&expand=centerId`,
          payments: `${proxy}/payments/records?perPage=500&sort=-created`,
          expenses: `${proxy}/expenses/records?perPage=500&sort=-date`,
          invoices: `${proxy}/invoices/records?perPage=500&sort=-created`,
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

  // ─── Student analytics ───────────────────────────────────────────────────

  const gradeDistribution = useMemo(
    () => groupCount(filteredStudents, (s) => s.grade || ""),
    [filteredStudents]
  )

  const genderDistribution = useMemo(
    () => {
      const raw = groupCount(filteredStudents, (s) => {
        const g = (s.gender || "").toLowerCase()
        if (g === "male" || g === "男") return "男"
        if (g === "female" || g === "女") return "女"
        return "未知"
      })
      return raw
    },
    [filteredStudents]
  )

  const statusDistribution = useMemo(
    () =>
      groupCount(filteredStudents, (s) => {
        if (s.status === "active") return "在读"
        return "离校"
      }),
    [filteredStudents]
  )

  // ─── Teacher analytics ───────────────────────────────────────────────────

  const departmentDistribution = useMemo(
    () =>
      groupCount(filteredTeachers, (t) => {
        const dept = (t.department || "").trim()
        return dept || "未分配"
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
      groupSum(feeItems, (f) => f.category || "未分类", (f) => Number(f.amount) || 0),
    [feeItems]
  )

  // ─── Center comparison ───────────────────────────────────────────────────

  const centerComparisonData = useMemo(() => {
    return centers.map((c) => {
      const cStudents = students.filter((s) => s.centerId === c.id)
      const cTeachers = teachers.filter((t) => t.centerId === c.id)
      const cPayments = payments.filter((p) => p.centerId === c.id)
      const cExpenses = expenses.filter((e) => e.centerId === c.id)
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
  }, [centers, students, teachers, payments, expenses])

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
    () => [{ id: "all", code: "全部", name: "所有分行" }, ...centers],
    [centers]
  )

  const selectedCenterName = useMemo(() => {
    if (selectedCenter === "all") return "所有分行"
    const c = centers.find((cc) => cc.id === selectedCenter)
    return c ? `${c.code} ${c.name}` : "未知分行"
  }, [selectedCenter, centers])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header + Center Filter */}
      <div className="bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-50 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm border border-yellow-200">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
              数据分析仪表板
            </h2>
            <p className="text-amber-700 text-sm sm:text-base">
              欢迎回来，{userProfile?.name || "管理员"} · 当前查看：
              <span className="font-semibold text-amber-900">{selectedCenterName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-amber-700 font-medium mr-1">分行筛选：</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Students */}
        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">总学生数</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {loading ? "—" : totalStudents}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  在读 {filteredStudents.filter((s) => s.status === "active").length} 人
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Teachers */}
        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">总教师数</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {loading ? "—" : totalTeachers}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  在职 {filteredTeachers.filter((t) => t.status === "active").length} 人
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">总收入</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {loading ? "—" : `RM ${totalIncome.toLocaleString()}`}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-600">
                    {filteredPayments.length} 笔收款
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all flex-shrink-0">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">总支出</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {loading ? "—" : `RM ${totalExpenses.toLocaleString()}`}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-xs text-red-600">
                    {filteredExpenses.length} 笔支出
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all flex-shrink-0">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Birthday Card */}
      {birthdayStudents.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <Cake className="h-4 w-4" /> 🎂 本月寿星 ({birthdayStudents.length}人)
            </h3>
            <div className="flex flex-wrap gap-2">
              {birthdayStudents.map(s => {
                const day = new Date(s.date_of_birth!).getDate()
                return (
                  <a key={s.id} href={`/student-management?id=${s.id}`}
                    className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all text-sm">
                    <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">{day}</span>
                    <span className="text-gray-700 font-medium">{s.name}</span>
                    <span className="text-xs text-gray-400">{s.grade || ""}</span>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Dimension Charts */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-amber-600" />
          学生维度
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grade Distribution — BarChart */}
          <ChartCard
            title="年级分布"
            description="各年级学生人数"
            icon={BarChart3}
            isEmpty={gradeDistribution.length === 0}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fde68a" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#92400e", fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#92400e", fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#fef3c7" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" name="学生数" radius={[4, 4, 0, 0]} barSize={30}>
                  {gradeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={AMBER_COLORS[index % AMBER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Gender Distribution — PieChart */}
          <ChartCard
            title="性别分布"
            description="学生男女比例"
            icon={PieChartIcon}
            isEmpty={genderDistribution.length === 0}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    const RADIAN = Math.PI / 180
                    const radius = outerRadius * 1.35
                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                    const y = cy + radius * Math.sin(-midAngle * RADIAN)
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#1e293b"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight={600}
                      >
                        {`${name} ${value ?? 0}人`}
                      </text>
                    )
                  }}
                  labelLine={true}
                  >
                  {genderDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={AMBER_COLORS[index % AMBER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Student Status — PieChart */}
          <ChartCard
            title="学生状态"
            description="在读 / 离校分布"
            icon={Activity}
            isEmpty={statusDistribution.length === 0}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={(entry: { name?: string; value?: number }) => `${entry.name}: ${entry.value ?? 0}`}
                  labelLine={false}
                  >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === "在读" ? "#10b981" : "#f59e0b"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Teacher + Financial Dimension Charts */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <School className="h-5 w-5 text-amber-600" />
          教师 & 财务维度
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teacher Department Distribution — BarChart */}
          <ChartCard
            title="教师部门分布"
            description="各部门教师人数"
            icon={Shield}
            isEmpty={departmentDistribution.length === 0}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentDistribution}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#fde68a" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#92400e", fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#92400e", fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "#fef3c7" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" name="教师数" radius={[0, 4, 4, 0]} barSize={20}>
                  {departmentDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={AMBER_COLORS[index % AMBER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue / Expense Trend — AreaChart */}
          <ChartCard
            title="收支趋势"
            description="近12个月收入与支出"
            icon={TrendingUp}
            isEmpty={revenueExpenseTrend.length === 0}
            loading={loading}
            className="lg:col-span-2"
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
                  formatter={(value: number, name: string) => [`RM ${value.toLocaleString()}`, name === "income" ? "收入" : "支出"]}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  formatter={(value) => (value === "income" ? "收入" : "支出")}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke={INCOME_COLOR}
                  strokeWidth={2}
                  fill="url(#incomeGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke={EXPENSE_COLOR}
                  strokeWidth={2}
                  fill="url(#expenseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Fee Item Category Distribution — PieChart (full row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="收费项类别分布"
          description="各类收费项金额占比"
          icon={Layers}
          isEmpty={feeItemDistribution.length === 0}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={feeItemDistribution}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={(entry: { name?: string; value?: number }) => (entry.value ?? 0) > 0 ? `${entry.name}: RM${entry.value}` : ""}
                labelLine={false}
              >
                {feeItemDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={AMBER_COLORS[index % AMBER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #fde68a",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => `RM ${value.toLocaleString()}`}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Center Student Comparison — Horizontal BarChart */}
        <ChartCard
          title="分行学生数对比"
          description="PU1 vs BATU14 学生数量"
          icon={Building2}
          isEmpty={centerStudentComparison.length === 0}
          loading={loading}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={centerStudentComparison}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#fde68a" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#92400e", fontSize: 11 }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#92400e", fontSize: 13, fontWeight: 600 }}
                width={80}
              />
              <Tooltip
                cursor={{ fill: "#fef3c7" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #fde68a",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value} 人`, "学生数"]}
              />
              <Bar dataKey="students" name="学生数" radius={[0, 6, 6, 0]} barSize={40}>
                {centerStudentComparison.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={AMBER_COLORS[index % AMBER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Center Comparison Table */}
      <Card className="border-amber-200/60 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-amber-100">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-600" />
            分行数据对比
          </h3>
          <p className="text-xs text-muted-foreground mt-1">各分行核心指标对比</p>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-amber-800 font-semibold">分行</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">学生总数</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">在读学生</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">教师数</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">总收入</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">总支出</TableHead>
                  <TableHead className="text-amber-800 font-semibold text-right">净利润</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : centerComparisonData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无分行数据
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
                          <span>全部合计</span>
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
