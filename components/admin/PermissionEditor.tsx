"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, CheckCircle2, Shield } from "lucide-react"

// Sidebar nav structure (must match AppShell.tsx)
const NAV_TREE: Record<string, { label: string; icon?: string; children?: string[] }> = {
  dashboard: { label: "仪表板" },
  students: { label: "学生管理", children: ["students.list", "daily-logs", "grades", "points", "pickup", "photos", "parents", "report-cards", "homework"] },
  teachers: { label: "教师管理", children: ["teachers.list", "schedule"] },
  finance: { label: "财务管理", children: ["finance.overview", "finance.fees", "finance.payments", "finance.bank", "finance.expenses", "finance.payroll", "finance.budget", "finance.reports", "inventory"] },
  courses: { label: "课程管理", children: ["courses.schedule", "courses.list", "courses.classes", "courses.analytics"] },
  attendance: { label: "考勤系统", children: ["attendance.checkin", "attendance.teacher", "attendance.reports"] },
  settings: { label: "系统设置", children: ["settings.general", "settings.users", "settings.centers"] },
}

const CHILD_LABELS: Record<string, string> = {
  "students.list": "学生列表", "daily-logs": "每日日志", "grades": "成绩管理",
  "points": "积分管理", "pickup": "接送管理", "photos": "随手拍", "parents": "家长管理",
  "report-cards": "成绩单", "homework": "作业管理",
  "teachers.list": "教师列表", "schedule": "教师排班",
  "finance.overview": "财务概览", "finance.fees": "收费管理", "finance.payments": "发票付款",
  "finance.bank": "银行对账", "finance.expenses": "支出管理", "finance.payroll": "薪资管理",
  "finance.budget": "预算管理", "finance.reports": "财务报表", "inventory": "库存管理",
  "courses.schedule": "课程表", "courses.list": "课程管理", "courses.classes": "班级管理",
  "courses.analytics": "课程分析",
  "attendance.checkin": "学生签到", "attendance.teacher": "教师签到", "attendance.reports": "考勤报表",
  "settings.general": "系统设置", "settings.users": "用户管理", "settings.centers": "分院管理",
}

const ROLES = [
  { id: "admin", label: "管理员", color: "bg-orange-100 text-orange-700" },
  { id: "teacher", label: "老师", color: "bg-blue-100 text-blue-700" },
  { id: "parent", label: "家长", color: "bg-green-100 text-green-700" },
  { id: "accountant", label: "会计", color: "bg-purple-100 text-purple-700" },
]

export default function PermissionEditor() {
  const [selectedRole, setSelectedRole] = useState("teacher")
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadPermissions(selectedRole)
  }, [selectedRole])

  const loadPermissions = async (role: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pocketbase-proxy/api/collections/role_permissions/records?filter=(role%3D'${role}')`)
      const data = await res.json()
      const record = data?.items?.[0]
      setPermissions(record?.permissions || {})
    } catch (e) {
      console.error("加载权限失败:", e)
      setPermissions({})
    } finally {
      setLoading(false)
    }
  }

  const toggle = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleParent = (parentKey: string, value: boolean) => {
    const newPerms = { ...permissions, [parentKey]: value }
    const item = NAV_TREE[parentKey]
    if (item?.children) {
      item.children.forEach(child => { newPerms[child] = value })
    }
    setPermissions(newPerms)
  }

  const savePermissions = async () => {
    setSaving(true)
    setSaved(false)
    try {
      // Get existing record
      const res = await fetch(`/api/pocketbase-proxy/api/collections/role_permissions/records?filter=(role%3D'${selectedRole}')`)
      const data = await res.json()
      const record = data?.items?.[0]
      if (record) {
        await fetch(`/api/pocketbase-proxy/api/collections/role_permissions/records/${record.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions }),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error("保存权限失败:", e)
    } finally {
      setSaving(false)
    }
  }

  const allKeys = Object.keys(NAV_TREE)
  const enabledCount = Object.values(permissions).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Role selector */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(role => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
              selectedRole === role.id
                ? "border-amber-500 bg-amber-50 shadow-sm"
                : "border-transparent hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Shield className="h-3.5 w-3.5 inline mr-1.5" />
            {role.label}
            <Badge variant="outline" className="ml-2 text-xs">
              {loading ? "..." : `${Object.entries(permissions).filter(([_,v]) => v).length}/${allKeys.length}`}
            </Badge>
          </button>
        ))}
      </div>

      {/* Permission tree */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {ROLES.find(r => r.id === selectedRole)?.label} — 导航权限
          </CardTitle>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 已保存
              </span>
            )}
            <Button size="sm" onClick={savePermissions} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              保存
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Toggle all */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 mb-2">
                <span className="text-sm font-medium">全选 / 取消全选</span>
                <Switch
                  checked={allKeys.every(k => permissions[k])}
                  onCheckedChange={(v) => {
                    const newPerms = { ...permissions }
                    allKeys.forEach(k => { newPerms[k] = v })
                    Object.entries(NAV_TREE).forEach(([k, item]) => {
                      if (item.children) item.children.forEach(c => { newPerms[c] = v })
                    })
                    setPermissions(newPerms)
                  }}
                />
              </div>

              {/* Nav items as tree */}
              {Object.entries(NAV_TREE).map(([key, item]) => (
                <div key={key} className="border rounded-lg overflow-hidden">
                  {/* Parent row */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-amber-700">
                          {item.label.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <Switch
                      checked={!!permissions[key]}
                      onCheckedChange={(v) => toggleParent(key, v)}
                    />
                  </div>

                  {/* Children */}
                  {item.children && (
                    <div className="border-t bg-gray-50/50 divide-y">
                      {item.children.map(childKey => {
                        const childLabel = CHILD_LABELS[childKey] || childKey
                        return (
                          <div
                            key={childKey}
                            className="flex items-center justify-between px-3 py-2 pl-10 hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-sm text-muted-foreground">{childLabel}</span>
                            <Switch
                              checked={!!permissions[childKey]}
                              onCheckedChange={() => toggle(childKey)}
                              disabled={!permissions[key]}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
