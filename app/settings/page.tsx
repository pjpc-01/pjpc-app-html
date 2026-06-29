"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme, type ThemeId } from "@/contexts/theme-context"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Building2,
  Percent,
  Shield,
  History,
  Users,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Banknote,
  PiggyBank,
  Sliders,
  Globe,
  Lock,
  Eye,
  Pencil,
  Trash2,
  UserCog,
  Palette,
} from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const { themeId, setTheme, availableThemes } = useTheme()
  const [activeTab, setActiveTab] = useState("appearance")
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState("")

  // --- Bank Settings ---
  const [bankSettings, setBankSettings] = useState({
    bankName: "CIMB Bank",
    accountName: "PJPC Education Centre",
    accountNumber: "8601-XXXXXX-XX",
    accountType: "Current Account",
    swiftCode: "CIBBMYKL",
  })

  // --- EPF / Socso / EIS Rates ---
  const [contributionRates, setContributionRates] = useState({
    epfEmployeeRate: 11,
    epfEmployerRate: 13,
    socsoEmployeeRate: 0.5,
    socsoEmployerRate: 1.75,
    eisEmployeeRate: 0.2,
    eisEmployerRate: 0.4,
  })

  // --- System Parameters ---
  const [systemParams, setSystemParams] = useState({
    centerName: "PJPC 安亲班",
    centerCode: "PJPC-001",
    currency: "MYR",
    taxRate: 0,
    sessionTimeout: 60,
    enableRegistration: true,
    enableNotifications: true,
    enableAutoBackup: false,
    maintenanceMode: false,
  })

  // --- Audit Logs ---
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  // --- Users (overview) ---
  const [userStats, setUserStats] = useState({ total: 0, active: 0, pending: 0, admin: 0 })

  // --- Role & Permission Management ---
  type Permission = {
    id: string
    label: string
    description: string
  }

  type RolePermissions = {
    [roleId: string]: {
      [permId: string]: boolean
    }
  }

  const ROLES = [
    { id: "admin", label: "管理员", color: "bg-amber-100 text-amber-700", desc: "系统超级管理员，拥有全部权限" },
    { id: "teacher", label: "教师", color: "bg-orange-100 text-orange-700", desc: "教师角色，管理课程和学生" },
    { id: "parent", label: "家长", color: "bg-green-100 text-green-700", desc: "家长角色，查看孩子信息" },
    { id: "accountant", label: "财务", color: "bg-amber-100 text-amber-700", desc: "财务角色，管理收费和报表" },
  ]

  const PERMISSIONS: Permission[] = [
    { id: "dashboard", label: "仪表板", description: "查看系统总览和统计数据" },
    { id: "students_view", label: "查看学生", description: "浏览学生列表和信息" },
    { id: "students_manage", label: "管理学生", description: "添加、编辑、删除学生" },
    { id: "teachers_view", label: "查看教师", description: "浏览教师列表和信息" },
    { id: "teachers_manage", label: "管理教师", description: "添加、编辑、删除教师" },
    { id: "finance_view", label: "查看财务", description: "浏览财务数据和报表" },
    { id: "finance_manage", label: "管理财务", description: "创建发票、管理收费" },
    { id: "courses_view", label: "查看课程", description: "浏览课程安排" },
    { id: "courses_manage", label: "管理课程", description: "创建和编辑课程" },
    { id: "attendance", label: "考勤管理", description: "管理学生和教师签到" },
    { id: "schedule", label: "课表管理", description: "管理课程时间表" },
    { id: "settings", label: "系统设置", description: "访问和修改系统配置" },
    { id: "users_manage", label: "用户管理", description: "管理用户账户和权限" },
  ]

  // Default permissions: admin has everything, others have limited
  const defaultPermissions: RolePermissions = {
    admin: Object.fromEntries(PERMISSIONS.map((p) => [p.id, true])),
    teacher: {
      dashboard: true,
      students_view: true,
      students_manage: false,
      teachers_view: true,
      teachers_manage: false,
      finance_view: false,
      finance_manage: false,
      courses_view: true,
      courses_manage: false,
      attendance: true,
      schedule: true,
      settings: false,
      users_manage: false,
    },
    parent: {
      dashboard: true,
      students_view: true,
      students_manage: false,
      teachers_view: true,
      teachers_manage: false,
      finance_view: true,
      finance_manage: false,
      courses_view: true,
      courses_manage: false,
      attendance: true,
      schedule: true,
      settings: false,
      users_manage: false,
    },
    accountant: {
      dashboard: true,
      students_view: true,
      students_manage: false,
      teachers_view: true,
      teachers_manage: false,
      finance_view: true,
      finance_manage: true,
      courses_view: false,
      courses_manage: false,
      attendance: false,
      schedule: false,
      settings: false,
      users_manage: false,
    },
  }

  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(defaultPermissions)
  const [selectedRole, setSelectedRole] = useState("teacher")

  // --- Centers Management ---
  const [centersList, setCentersList] = useState<any[]>([])
  const [centersLoading, setCentersLoading] = useState(true)
  const [showAddCenter, setShowAddCenter] = useState(false)
  const [editingCenter, setEditingCenter] = useState<any | null>(null)
  const [centerForm, setCenterForm] = useState({ name: "", code: "", address: "", phone: "", manager: "", status: "active" })
  const [centerSaving, setCenterSaving] = useState(false)

  const fetchCenters = async () => {
    try {
      setCentersLoading(true)
      const res = await fetch("/api/centers")
      const data = await res.json()
      if (data.success && data.data) setCentersList(data.data)
    } catch {} finally { setCentersLoading(false) }
  }

  const isAdmin = userProfile?.role === "admin" ||
    userProfile?.email?.includes("admin") ||
    userProfile?.email?.includes("pjpcemerlang")

  useEffect(() => {
    if (isAdmin) {
      fetchStats()
      fetchAuditLogs()
      fetchCenters()
    }
  }, [isAdmin])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      if (data.success && data.users) {
        const users = data.users
        setUserStats({
          total: users.length,
          active: users.filter((u: any) => u.status === "active" || u.approved).length,
          pending: users.filter((u: any) => u.status === "pending" || !u.approved).length,
          admin: users.filter((u: any) => u.role === "admin").length,
        })
      }
    } catch {}
  }

  const fetchAuditLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await fetch("/api/audit-logs")
      const data = await res.json()
      setAuditLogs(data.logs || [])
    } catch {
      setAuditLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const handleSave = async (section: string) => {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError("")
    try {
      // Simulate save — replace with actual API call
      await new Promise((r) => setTimeout(r, 800))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h2>
          <p className="text-gray-600 mb-2">只有管理员可以访问系统设置</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title="系统设置"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {userStats.total} 用户
          </Badge>
          <Button variant="outline" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回仪表板
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
              <CheckCircle2 className="h-4 w-4" />
              保存成功
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
              <XCircle className="h-4 w-4" />
              {saveError}
            </div>
          )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">总用户</p>
                <p className="text-xl font-bold">{userStats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">活跃用户</p>
                <p className="text-xl font-bold">{userStats.active}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">待审核</p>
                <p className="text-xl font-bold">{userStats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">管理员</p>
                <p className="text-xl font-bold">{userStats.admin}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <History className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">审核日志</p>
                <p className="text-xl font-bold">{auditLogs.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-7 w-full">
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              银行账户
            </TabsTrigger>
            <TabsTrigger value="rates" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              EPF/Socso/EIS
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              系统参数
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              外观主题
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              权限管理
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              审核日志
            </TabsTrigger>
          </TabsList>

          {/* 1. Bank Account Settings */}
          <TabsContent value="bank" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      银行账户信息
                    </CardTitle>
                    <CardDescription>配置中心银行账户信息，用于发票和付款</CardDescription>
                  </div>
                  <Button onClick={() => handleSave("bank")} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "保存中..." : "保存设置"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>银行名称</Label>
                    <Input
                      value={bankSettings.bankName}
                      onChange={(e) => setBankSettings({ ...bankSettings, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>账户名称</Label>
                    <Input
                      value={bankSettings.accountName}
                      onChange={(e) => setBankSettings({ ...bankSettings, accountName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>账户号码</Label>
                    <Input
                      value={bankSettings.accountNumber}
                      onChange={(e) => setBankSettings({ ...bankSettings, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>账户类型</Label>
                    <Input
                      value={bankSettings.accountType}
                      onChange={(e) => setBankSettings({ ...bankSettings, accountType: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Swift Code</Label>
                    <Input
                      value={bankSettings.swiftCode}
                      onChange={(e) => setBankSettings({ ...bankSettings, swiftCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>货币</Label>
                    <Input value="MYR (马来西亚令吉)" disabled />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">银行信息用于发票和付款凭证</p>
                    <p>确保银行账户信息准确，系统将使用此信息生成发票和接收付款。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. EPF / Socso / EIS Rates */}
          <TabsContent value="rates" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      EPF / Socso / EIS 贡献费率
                    </CardTitle>
                    <CardDescription>设置员工和雇主法定贡献费率（马来西亚标准）</CardDescription>
                  </div>
                  <Button onClick={() => handleSave("rates")} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "保存中..." : "保存费率"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* EPF */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <PiggyBank className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-lg">EPF (KWSP) — 雇员公积金</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>雇员缴纳 (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            value={contributionRates.epfEmployeeRate}
                            onChange={(e) =>
                              setContributionRates({ ...contributionRates, epfEmployeeRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>雇主缴纳 (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            value={contributionRates.epfEmployerRate}
                            onChange={(e) =>
                              setContributionRates({ ...contributionRates, epfEmployerRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr />

                  {/* Socso */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-amber-700" />
                      <h3 className="font-semibold text-lg">SOCSO (PERKESO) — 社会保险</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>雇员缴纳 (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.05"
                            value={contributionRates.socsoEmployeeRate}
                            onChange={(e) =>
                              setContributionRates({ ...contributionRates, socsoEmployeeRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>雇主缴纳 (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.05"
                            value={contributionRates.socsoEmployerRate}
                            onChange={(e) =>
                              setContributionRates({ ...contributionRates, socsoEmployerRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr />

                  {/* EIS */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-lg">EIS (SIP) — 就业保险</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>雇员缴纳 (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.05"
                            value={contributionRates.eisEmployeeRate}
                            onChange={(e) =>
                              setContributionRates({ ...contributionRates, eisEmployeeRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>雇主缴纳 (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.05"
                            value={contributionRates.eisEmployerRate}
                            onChange={(e) =>
                              setContributionRates({ ...contributionRates, eisEmployerRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <Percent className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">马来西亚法定贡献费率参考</p>
                    <p>EPF 雇员 11% / 雇主 13% | SOCSO 雇员 0.5% / 雇主 1.75% | EIS 雇员 0.2% / 雇主 0.4%</p>
                    <p className="text-xs mt-1">请根据最新政府公告调整费率。这些费率将用于教师薪资计算。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. System Parameters */}
          <TabsContent value="system" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sliders className="h-5 w-5" />
                      系统参数配置
                    </CardTitle>
                    <CardDescription>配置中心基本信息、时区、运行模式等</CardDescription>
                  </div>
                  <Button onClick={() => handleSave("system")} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "保存中..." : "保存参数"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>中心名称</Label>
                    <Input
                      value={systemParams.centerName}
                      onChange={(e) => setSystemParams({ ...systemParams, centerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>中心代码</Label>
                    <Input
                      value={systemParams.centerCode}
                      onChange={(e) => setSystemParams({ ...systemParams, centerCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>货币</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input className="pl-10" value="MYR (马来西亚令吉)" disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>税率 (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.5"
                        value={systemParams.taxRate}
                        onChange={(e) => setSystemParams({ ...systemParams, taxRate: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>会话超时（分钟）</Label>
                    <Input
                      type="number"
                      value={systemParams.sessionTimeout}
                      onChange={(e) => setSystemParams({ ...systemParams, sessionTimeout: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>

                <hr />

                <div className="space-y-4">
                  <h3 className="font-semibold">功能开关</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">开放注册</p>
                        <p className="text-xs text-gray-500">允许新用户自行注册</p>
                      </div>
                      <Switch
                        checked={systemParams.enableRegistration}
                        onCheckedChange={(v) => setSystemParams({ ...systemParams, enableRegistration: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">系统通知</p>
                        <p className="text-xs text-gray-500">启用系统通知推送</p>
                      </div>
                      <Switch
                        checked={systemParams.enableNotifications}
                        onCheckedChange={(v) => setSystemParams({ ...systemParams, enableNotifications: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">自动备份</p>
                        <p className="text-xs text-gray-500">每日自动备份数据库</p>
                      </div>
                      <Switch
                        checked={systemParams.enableAutoBackup}
                        onCheckedChange={(v) => setSystemParams({ ...systemParams, enableAutoBackup: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-red-600">维护模式</p>
                        <p className="text-xs text-gray-500">仅管理员可访问系统</p>
                      </div>
                      <Switch
                        checked={systemParams.maintenanceMode}
                        onCheckedChange={(v) => setSystemParams({ ...systemParams, maintenanceMode: v })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3b. Theme / Appearance */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      外观主题
                    </CardTitle>
                    <CardDescription>选择你喜欢的界面配色方案，切换即时生效</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {availableThemes.map((theme) => {
                    const isActive = themeId === theme.id
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                          isActive
                            ? "border-amber-500 bg-amber-50 shadow-sm ring-2 ring-amber-200"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {/* Preview swatches */}
                        <div className="flex gap-1.5 mb-3">
                          <div
                            className="w-8 h-8 rounded-lg"
                            style={{ backgroundColor: theme.previewBg, border: "1px solid rgba(0,0,0,0.08)" }}
                          />
                          <div
                            className="w-8 h-8 rounded-lg"
                            style={{ backgroundColor: theme.previewColor }}
                          />
                        </div>
                        <h3 className="font-semibold text-sm">{theme.nameZh}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{theme.name}</p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{theme.description}</p>
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <Palette className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">主题切换说明</p>
                    <p>切换主题会立即改变系统的品牌色调。当前选择会保存在浏览器中，下次访问自动恢复。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3c. Permission Management */}
          <TabsContent value="permissions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      角色权限管理
                    </CardTitle>
                    <CardDescription>为不同用户角色分配模块访问权限</CardDescription>
                  </div>
                  <Button onClick={() => handleSave("permissions")} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "保存中..." : "保存权限"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRole === role.id
                          ? "border-amber-500 bg-amber-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className={`h-4 w-4 ${
                          role.id === "admin" ? "text-orange-700" :
                          role.id === "teacher" ? "text-amber-700" :
                          role.id === "parent" ? "text-green-600" : "text-amber-600"
                        }`} />
                        <span className="font-semibold text-sm">{role.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{role.desc}</p>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${role.color}`}>
                          {role.id === "admin"
                            ? `${PERMISSIONS.length}/${PERMISSIONS.length} 权限`
                            : `${Object.values(rolePermissions[role.id] || {}).filter(Boolean).length}/${PERMISSIONS.length} 权限`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Permission Toggles for Selected Role */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">
                        {ROLES.find((r) => r.id === selectedRole)?.label || selectedRole} 权限配置
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">全选</span>
                      <Switch
                        checked={PERMISSIONS.every((p) => rolePermissions[selectedRole]?.[p.id])}
                        onCheckedChange={(checked) => {
                          setRolePermissions((prev) => ({
                            ...prev,
                            [selectedRole]: Object.fromEntries(PERMISSIONS.map((p) => [p.id, checked])),
                          }))
                        }}
                      />
                    </div>
                  </div>
                  <div className="divide-y">
                    {PERMISSIONS.map((perm) => (
                      <div key={perm.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            rolePermissions[selectedRole]?.[perm.id]
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-400"
                          }`}>
                            {perm.id.includes("manage") ? (
                              <Pencil className="h-4 w-4" />
                            ) : perm.id.includes("view") ? (
                              <Eye className="h-4 w-4" />
                            ) : perm.id === "settings" || perm.id === "users_manage" ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{perm.label}</p>
                            <p className="text-xs text-gray-400">{perm.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={rolePermissions[selectedRole]?.[perm.id] ?? false}
                          onCheckedChange={(checked) => {
                            setRolePermissions((prev) => ({
                              ...prev,
                              [selectedRole]: {
                                ...(prev[selectedRole] || {}),
                                [perm.id]: checked,
                              },
                            }))
                          }}
                          disabled={selectedRole === "admin"}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">权限说明</p>
                    <p>管理员拥有所有权限且不可修改。其他角色的权限可以按需开启或关闭。</p>
                    <p className="text-xs mt-1">修改后点击"保存权限"以生效。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. User Management */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  用户管理
                </CardTitle>
                <CardDescription>管理系统用户、角色和权限</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-amber-700">{userStats.total}</p>
                      <p className="text-xs text-gray-500">总注册用户</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
                      <p className="text-xs text-gray-500">活跃用户</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{userStats.pending}</p>
                      <p className="text-xs text-gray-500">待审核</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-700">{userStats.admin}</p>
                      <p className="text-xs text-gray-500">管理员</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button onClick={() => router.push("/user-management")}>
                    <Users className="h-4 w-4 mr-2" />
                    进入详细用户管理
                  </Button>
                  <Button variant="outline" onClick={fetchStats}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新数据
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Audit Logs */}
          <TabsContent value="audit" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      审核日志
                    </CardTitle>
                    <CardDescription>系统操作记录和安全事件</CardDescription>
                  </div>
                  <Button variant="outline" onClick={fetchAuditLogs}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p>加载审核日志...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <History className="h-12 w-12 mx-auto mb-4" />
                    <p>暂无审核日志记录</p>
                    <p className="text-xs mt-1">系统操作记录将在此显示</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-gray-500">时间</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">用户</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">操作</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">详情</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log: any, i: number) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-600">{new Date(log.created).toLocaleString("zh-CN")}</td>
                            <td className="py-2 px-3">{log.user || log.userId || "-"}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-xs">{log.action || log.type || "-"}</Badge>
                            </td>
                            <td className="py-2 px-3 text-gray-600">{log.detail || log.description || "-"}</td>
                            <td className="py-2 px-3 text-gray-400 text-xs">{log.ip || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
