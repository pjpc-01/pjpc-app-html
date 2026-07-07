"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2, Save, CheckCircle2, Shield, Plus, Trash2, X,
} from "lucide-react"

// Sidebar nav structure (must match AppShell.tsx)
const NAV_TREE: Record<string, { label: string; icon?: string; children?: string[] }> = {
  dashboard: { label: "仪表板" },
  students: { label: "学生管理", children: ["students.list", "daily-logs", "grades", "pickup", "parents", "homework"] },
  points: { label: "积分系统", children: ["points.operate", "points.records", "points.leaderboard"] },
  teachers: { label: "教师管理", children: ["teachers.list", "schedule"] },
  finance: { label: "财务管理", children: ["finance.overview", "finance.fees", "finance.payments", "finance.bank", "finance.expenses", "finance.payroll", "finance.budget", "finance.reports", "inventory"] },
  courses: { label: "课程管理", children: ["courses.schedule", "courses.list", "courses.classes", "courses.analytics"] },
  attendance: { label: "考勤系统", children: ["attendance.checkin", "attendance.cards"] },
  settings: { label: "系统设置", children: ["settings.general", "settings.users", "settings.centers"] },
}

const CHILD_LABELS: Record<string, string> = {
  "students.list": "学生列表", "daily-logs": "每日日志", "grades": "成绩管理",
  "points.operate": "积分操作", "points.records": "积分记录", "points.leaderboard": "积分排行榜", "pickup": "接送管理", "parents": "家长管理",
  "teachers.list": "教师列表", "schedule": "教师排班",
  "finance.overview": "财务概览", "finance.fees": "收费管理", "finance.payments": "发票付款",
  "finance.bank": "银行对账", "finance.expenses": "支出管理", "finance.payroll": "薪资管理",
  "finance.budget": "预算管理", "finance.reports": "财务报表", "inventory": "库存管理",
  "courses.schedule": "课程表", "courses.list": "课程管理", "courses.classes": "班级管理",
  "courses.analytics": "课程分析",
  "attendance.checkin": "打卡记录", "attendance.cards": "卡片管理",
  "settings.general": "系统设置", "settings.users": "用户管理", "settings.centers": "分院管理",
}

// Default permission templates for new roles
const EMPTY_PERMISSIONS: Record<string, boolean> = {
  dashboard: true,
}

interface RoleInfo {
  id: string          // PB record id
  role: string        // role key (admin, teacher, etc.)
  label: string       // display name
  permissions: Record<string, boolean>
}

export default function PermissionEditor() {
  const [roles, setRoles] = useState<RoleInfo[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("teacher")
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // ─── New role form state ───────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRoleKey, setNewRoleKey] = useState("")
  const [newRoleLabel, setNewRoleLabel] = useState("")
  const [addError, setAddError] = useState("")
  const [deletingRole, setDeletingRole] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")

  // ─── Load all roles from PB ────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pocketbase-proxy/api/collections/role_permissions/records?perPage=50&sort=role")
      const data = await res.json()
      const items: RoleInfo[] = (data?.items || []).map((item: any) => ({
        id: item.id,
        role: item.role,
        label: item.label || item.role,
        permissions: item.permissions || {},
      }))
      setRoles(items)
      // Load permissions for selected role
      const current = items.find((r) => r.role === selectedRole)
      setPermissions(current?.permissions || {})
    } catch (e) {
      console.error("加载角色失败:", e)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [selectedRole])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // ─── When role tab changes, load that role's permissions ───────
  const handleSelectRole = (roleKey: string) => {
    setSelectedRole(roleKey)
    const roleData = roles.find((r) => r.role === roleKey)
    setPermissions(roleData?.permissions || {})
  }

  // ─── Permission toggle helpers ─────────────────────────────────
  const toggle = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleParent = (parentKey: string, value: boolean) => {
    const newPerms = { ...permissions, [parentKey]: value }
    const item = NAV_TREE[parentKey]
    if (item?.children) {
      item.children.forEach((child) => {
        newPerms[child] = value
      })
    }
    setPermissions(newPerms)
  }

  // ─── Save permissions ──────────────────────────────────────────
  const savePermissions = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const roleData = roles.find((r) => r.role === selectedRole)
      if (roleData) {
        await fetch(`/api/pocketbase-proxy/api/collections/role_permissions/records/${roleData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions }),
        })
      }
      // Update local state
      setRoles((prev) =>
        prev.map((r) => (r.role === selectedRole ? { ...r, permissions } : r))
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error("保存权限失败:", e)
    } finally {
      setSaving(false)
    }
  }

  // ─── Add new role ──────────────────────────────────────────────
  const addRole = async () => {
    setAddError("")
    const key = newRoleKey.trim().toLowerCase().replace(/\s+/g, "_")
    const label = newRoleLabel.trim()

    if (!key || !label) {
      setAddError("角色代码和名称都不能为空")
      return
    }
    if (roles.some((r) => r.role === key)) {
      setAddError("角色代码已存在")
      return
    }

    try {
      const res = await fetch("/api/pocketbase-proxy/api/collections/role_permissions/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: key,
          label: label,
          permissions: { ...EMPTY_PERMISSIONS },
        }),
      })
      if (!res.ok) throw new Error("创建失败")
      setNewRoleKey("")
      setNewRoleLabel("")
      setShowAddForm(false)
      await fetchRoles()
      setSelectedRole(key)
    } catch (e) {
      setAddError("创建角色失败")
    }
  }

  // ─── Delete role ───────────────────────────────────────────────
  const deleteRole = async (roleInfo: RoleInfo) => {
    setDeleteError("")
    if (roleInfo.role === "admin") {
      setDeleteError("管理员角色不可删除")
      return
    }

    // Check if any users have this role
    try {
      const res = await fetch(
        `/api/pocketbase-proxy/api/collections/users/records?perPage=500&filter=(role='${roleInfo.role}')`
      )
      const data = await res.json()
      const userCount = data?.items?.length || 0
      if (userCount > 0) {
        setDeleteError(`无法删除：仍有 ${userCount} 个用户使用此角色，请先改他们的角色`)
        return
      }

      if (!confirm(`确定删除角色「${roleInfo.label}」？此操作不可撤销。`)) return

      setDeletingRole(roleInfo.role)
      await fetch(`/api/pocketbase-proxy/api/collections/role_permissions/records/${roleInfo.id}`, {
        method: "DELETE",
      })
      // If we deleted the selected role, switch to admin
      if (selectedRole === roleInfo.role) {
        setSelectedRole("admin")
      }
      await fetchRoles()
    } catch (e) {
      setDeleteError("删除角色失败")
    } finally {
      setDeletingRole(null)
    }
  }

  // ─── Derived values ────────────────────────────────────────────
  const allKeys = Object.keys(NAV_TREE)
  const enabledCount = Object.entries(permissions).filter(([, v]) => v).length
  const currentRole = roles.find((r) => r.role === selectedRole)

  return (
    <div className="space-y-6">
      {deleteError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
          <X className="h-4 w-4" />
          {deleteError}
        </div>
      )}

      {/* ─── Role selector + add/delete ──────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            roles.map((roleInfo) => (
              <div
                key={roleInfo.id}
                className={`relative group inline-flex items-center rounded-lg border-2 transition-all ${
                  selectedRole === roleInfo.role
                    ? "border-amber-500 bg-amber-50 shadow-sm"
                    : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <button
                  onClick={() => handleSelectRole(roleInfo.role)}
                  className="px-4 py-2 text-sm font-medium flex items-center"
                >
                  <Shield className="h-3.5 w-3.5 inline mr-1.5 text-amber-600" />
                  {roleInfo.label}
                  {roleInfo.role === "admin" && (
                    <span className="ml-1.5 text-[10px] text-amber-600 font-normal">默认全开</span>
                  )}
                </button>
                {/* Delete button — not for admin */}
                {roleInfo.role !== "admin" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteRole(roleInfo)
                    }}
                    disabled={deletingRole === roleInfo.role}
                    className="ml-1 mr-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title={`删除角色「${roleInfo.label}」`}
                  >
                    {deletingRole === roleInfo.role ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            ))
          )}

          {/* Add role button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-all flex items-center"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              新增角色
            </button>
          )}
        </div>

        {/* ─── Add role form ────────────────────────────────────── */}
        {showAddForm && (
          <Card className="border-amber-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">新增角色</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setShowAddForm(false)
                    setAddError("")
                    setNewRoleKey("")
                    setNewRoleLabel("")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">角色代码（英文）</Label>
                  <Input
                    placeholder="如 supervisor"
                    value={newRoleKey}
                    onChange={(e) => setNewRoleKey(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">显示名称</Label>
                  <Input
                    placeholder="如 主任"
                    value={newRoleLabel}
                    onChange={(e) => setNewRoleLabel(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              {addError && (
                <p className="text-xs text-red-600">{addError}</p>
              )}
              <Button size="sm" onClick={addRole} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-3.5 w-3.5 mr-1" />
                创建
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Permission tree ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {currentRole?.label || selectedRole} — 导航权限
            <Badge variant="outline" className="text-xs ml-1">
              {enabledCount} 项已开启
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 已保存
              </span>
            )}
            <Button size="sm" onClick={savePermissions} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1" />
              )}
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
                  checked={allKeys.every((k) => permissions[k])}
                  onCheckedChange={(v) => {
                    const newPerms = { ...permissions }
                    allKeys.forEach((k) => {
                      newPerms[k] = v
                    })
                    Object.entries(NAV_TREE).forEach(([, item]) => {
                      if (item.children)
                        item.children.forEach((c) => {
                          newPerms[c] = v
                        })
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
                      {item.children.map((childKey) => {
                        const childLabel = CHILD_LABELS[childKey] || childKey
                        return (
                          <div
                            key={childKey}
                            className="flex items-center justify-between px-3 py-2 pl-10 hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-sm text-muted-foreground">
                              {childLabel}
                            </span>
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
